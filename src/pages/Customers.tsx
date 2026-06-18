import { useState, useEffect } from "react";
import { IoMdRefresh } from "react-icons/io";
import { TeamOutlined, FilterOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { Button, Select, DatePicker, Divider } from "antd";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import { fetchCustomers } from "../store/slices/customerSlice";
import CustomerTable from "../components/CustomerTable/CustomerTable";
import dayjs from "dayjs";
import TitleBar from "../components/TitleBarCommon/TitleBar";
// import AdvancedFilters from "../components/AdvancedFilters/AdvanceFilters";
// import type { FilterField } from "../components/AdvancedFilters/AdvanceFilters";
import CustomerStats from "../components/Customers/CustomerStats";

export type CustomerStatus = "active" | "inactive" | "suspended" | "blocked";

export interface EmergencyContact {
    name: string;
    phone: string;
    relationship?: string;
}

export interface Customer {
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
    status: CustomerStatus;
    updated_at: string;
    created_at: string;
    gender?: string;
    role?: string;
    emergency_contacts?: EmergencyContact[];
    user_code?: string;
    total_trips?: number;
}

// Remove dummy DATA array

export interface Filters {
    status: CustomerStatus[];
    updated_at: Date | null;
    created_at: Date | null;
}

const STATUSES = ["active", "inactive", "suspended"];
// const fields: FilterField[] = [
//     {
//         name: "status",
//         label: "Status",
//         type: "select",
//         mode: "multiple",
//         options: STATUSES.map((r) => ({ label: r, value: r })),
//     },
//     { name: "updated_at", label: "Updated At", type: "date" },
//     { name: "created_at", label: "Created At", type: "date" },
// ];

const Customers = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { customers, loading } = useSelector((state: RootState) => state.customers);
    const { role } = useSelector((state: RootState) => state.auth);
    const isSuperAdmin = role === 'super_admin';

    const [filters, setFilters] = useState<Filters>({
        status: [],
        updated_at: null,
        created_at: null,
    });

    const [filteredData, setFilteredData] = useState<Customer[]>([]);

    useEffect(() => {
        dispatch(fetchCustomers());
    }, [dispatch]);

    useEffect(() => {
        const customersArray = Array.isArray(customers) ? customers : (customers as any)?.data || (customers as any)?.users || [];
        let tempData = [...customersArray];
        if (filters?.status?.length > 0) {
            const selectedStatuses = Array.isArray(filters?.status)
                ? filters?.status
                : [filters?.status];
            tempData = tempData.filter((customer) =>
                selectedStatuses.includes(customer?.status),
            );
        }
        if (filters?.updated_at) {
            tempData = tempData.filter((customer) =>
                dayjs(customer?.updated_at).isSame(filters?.updated_at, "day"),
            );
        }
        if (filters?.created_at) {
            tempData = tempData.filter((customer) =>
                dayjs(customer?.created_at).isSame(filters?.created_at, "day"),
            );
        }

        setFilteredData(tempData);
    }, [customers, filters]);

    const applyFilters = (values: Record<string, any>) => {
        setFilters((prev) => ({
            ...prev,
            ...values,
        }));
    };

    return (
        <TitleBar
            title="Customer Management"
            description="Manage and oversee all customer accounts within the system."
            icon={
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center">
                    <TeamOutlined className="text-white" />
                </div>
            }
            iconBgColor="bg-blue-600"
            extraContent={
                <div className="flex items-center gap-3">
                    <Button
                        icon={<IoMdRefresh />}
                        loading={loading}
                        type="primary"
                        className="rounded-xl h-11 px-6 font-bold !bg-gradient-to-br !from-indigo-600 !to-blue-500 border-none"
                        onClick={() => dispatch(fetchCustomers())}
                    >
                        Refresh Data
                    </Button>
                </div>
            }
        >
            <div className="w-full h-full flex flex-col gap-6 bg-white dark:bg-[#0f172a] min-h-screen">
                <CustomerStats customers={customers} loading={loading} />

                {/* Inline Filter Bar */}
                <div className="bg-white dark:bg-slate-800 p-2 px-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-grow">
                        <div className="flex items-center gap-2">
                            <FilterOutlined className="text-slate-400 dark:text-slate-500" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Filters</span>
                        </div>
                        <Divider type="vertical" className="h-6 border-slate-100" />

                        <Select
                            mode="multiple"
                            placeholder="Status"
                            style={{ minWidth: 200 }}
                            className="premium-select-inline"
                            value={filters.status}
                            onChange={(val) => applyFilters({ status: val })}
                            options={STATUSES.map(s => ({ label: s.toUpperCase(), value: s }))}
                            maxTagCount="responsive"
                        />

                        <DatePicker
                            placeholder="Updated At"
                            className="premium-datepicker-inline"
                            onChange={(date) => applyFilters({ updated_at: date ? date.toDate() : null })}
                        />

                        <DatePicker
                            placeholder="Created At"
                            className="premium-datepicker-inline"
                            onChange={(date) => applyFilters({ created_at: date ? date.toDate() : null })}
                        />
                    </div>

                    {(filters.status.length > 0 || filters.updated_at || filters.created_at) && (
                        <Button
                            type="text"
                            danger
                            icon={<CloseCircleOutlined />}
                            className="text-[10px] font-black uppercase tracking-widest px-4 hover:bg-rose-50 rounded-xl"
                            onClick={() => setFilters({ status: [], updated_at: null, created_at: null })}
                        >
                            Clear Filters
                        </Button>
                    )}
                </div>

                <div className="flex-grow overflow-hidden bg-white dark:bg-[#0f172a]">
                    <CustomerTable data={filteredData} isSuperAdmin={isSuperAdmin} />
                </div>
            </div>
        </TitleBar>
    );
};

export default Customers;
