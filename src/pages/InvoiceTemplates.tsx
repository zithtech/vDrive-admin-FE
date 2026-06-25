// src/pages/InvoiceTemplates.tsx
import React, { useState } from "react";
import { Tabs, Button, Tag, Pagination } from "antd";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import type { TripDetailsType } from "../store/slices/tripSlice";

import {
  FileTextOutlined,
  UserOutlined,
  CarOutlined,
  BarChartOutlined,
  CloudDownloadOutlined,
  SendOutlined,
} from "@ant-design/icons";

import TitleBar from "../components/TitleBarCommon/TitleBar";

import CustomerInvoice from "../components/InvoiceTemplates/CustomerInvoice";
import DriverInvoice from "../components/InvoiceTemplates/DriverInvoice";
import DailyTripReport from "../components/InvoiceTemplates/DailyTripReport";
import AdminPlatformReport from "../components/InvoiceTemplates/AdminPlatformReport";

// Extend Trip type to include invoice sending status
type TripInvoiceState = TripDetailsType & {
  sentToCustomer?: boolean;
  sentToDriver?: boolean;
  sentToAdmin?: boolean;
};

// Filter trips created today
// const getTodayTrips = (data: TripInvoiceState[]) => {
//   const today = new Date().toISOString().split("T")[0];
//   return data.filter((t) => t.createdAt.startsWith(today));
// };

// Trip list component for customer/driver/admin
const TripInvoiceList: React.FC<{
  data: TripInvoiceState[];
  type: "customer" | "driver" | "admin";
  openPreview: (trip: TripInvoiceState) => void;
  sendHandler: (trip: TripInvoiceState) => void;
}> = ({ data, type, openPreview, sendHandler }) => {
  const statusKey =
    type === "customer" ? "sentToCustomer" : type === "driver" ? "sentToDriver" : "sentToAdmin";

  const completedTrips = data.filter((t) => t.trip_status === "COMPLETED");

  const pageSize = 10;
  const [page, setPage] = useState(1);
  const paginated = completedTrips.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="mt-4">
      <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
        {paginated.map((trip) => (
          <div
            key={trip.trip_id}
            className="p-4 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 rounded-lg flex justify-between items-center"
          >
            <div className="w-[60%]">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {type === "customer" && `${trip.user_name} • ${trip.trip_id}`}
                {type === "driver" && `${trip.driver_name} • ${trip.trip_id}`}
                {type === "admin" && `Trip ${trip.trip_id}`}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {trip.pickup_address} → {trip.drop_address}
              </p>
              {type === "driver" && (
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Vehicle: {trip.car_number} • {trip.car_type}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Tag color={trip[statusKey] ? "green" : "red"}>
                {trip[statusKey] ? "Sent" : "Not Sent"}
              </Tag>

              <Button size="small" onClick={() => openPreview(trip)}>
                Preview
              </Button>

              {/* Icon button placeholder */}
              <Button size="small" icon={<CloudDownloadOutlined />} />

              <Button
                size="small"
                icon={<SendOutlined />}
                type={trip[statusKey] ? "default" : "primary"}
                onClick={() => sendHandler(trip)}
              >
                {trip[statusKey] ? "Resend" : "Send"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700">
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
          Showing {completedTrips.length > 0 ? (page - 1) * pageSize + 1 : 0}–
          {Math.min(page * pageSize, completedTrips.length)} of {completedTrips.length} invoices
        </span>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={completedTrips.length}
          onChange={(p) => setPage(p)}
          showSizeChanger={false}
          size="small"
        />
      </div>
    </div>
  );
};

const InvoiceTemplates: React.FC = () => {
  const tripData = useSelector((state: RootState) => state.trips.trips) as TripInvoiceState[];

  const [openModal, setOpenModal] = useState({
    customer: false,
    driver: false,
    daily: false,
    admin: false,
  });

  const [selectedTrip, setSelectedTrip] = useState<TripInvoiceState | null>(null);

  const openPreview = (key: keyof typeof openModal, trip?: TripInvoiceState) => {
    setSelectedTrip(trip ?? null);
    setOpenModal({ ...openModal, [key]: true });
  };

  const closePreview = (key: keyof typeof openModal) => {
    setSelectedTrip(null);
    setOpenModal({ ...openModal, [key]: false });
  };

  const mockSend = (t: TripInvoiceState) => alert(`Sending invoice for ${t.trip_id}`);

  return (
    <TitleBar
      title="Invoice & Reports"
      description="Preview invoices and platform reports."
      icon={
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-sm">
          <FileTextOutlined className="text-white text-xl" />
        </div>
      }
    >
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 min-h-[80vh] overflow-y-auto">
        <Tabs
          items={[
            {
              key: "customer",
              label: (
                <span className="flex items-center gap-2">
                  <UserOutlined /> Customer Invoices
                </span>
              ),
              children: (
                <TripInvoiceList
                  data={tripData}
                  type="customer"
                  openPreview={(t) => openPreview("customer", t)}
                  sendHandler={mockSend}
                />
              ),
            },
            {
              key: "driver",
              label: (
                <span className="flex items-center gap-2">
                  <CarOutlined /> Driver Invoices
                </span>
              ),
              children: (
                <TripInvoiceList
                  data={tripData}
                  type="driver"
                  openPreview={(t) => openPreview("driver", t)}
                  sendHandler={mockSend}
                />
              ),
            },
            {
              key: "daily",
              label: (
                <span className="flex items-center gap-2">
                  <BarChartOutlined /> Daily Trip Report
                </span>
              ),
              children: (
                <section className="p-4 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                      Daily Summary
                    </h2>

                    <div className="flex gap-2">
                      <Button type="default" icon={<CloudDownloadOutlined />}>
                        Preview
                      </Button>

                      <Button type="primary" icon={<FileTextOutlined />}>
                        Export PDF
                      </Button>
                    </div>
                  </div>
                </section>
              ),
            },
            {
              key: "admin",
              label: (
                <span className="flex items-center gap-2">
                  <BarChartOutlined /> Platform Report
                </span>
              ),
              children: (
                <section className="p-3 space-y-3">
                  <Button type="primary" icon={<FileTextOutlined />}>
                    Preview Platform Report
                  </Button>

                  <Button type="default" icon={<CloudDownloadOutlined />}>
                    Export PDF
                  </Button>
                </section>
              ),
            },
          ]}
        />
      </div>

      {/* Modals */}
      <CustomerInvoice
        isOpen={openModal.customer}
        onClose={() => closePreview("customer")}
        trip={selectedTrip ?? undefined}
      />

      <DriverInvoice
        isOpen={openModal.driver}
        onClose={() => closePreview("driver")}
        trip={selectedTrip ?? undefined}
      />

      <DailyTripReport isOpen={openModal.daily} onClose={() => closePreview("daily")} />

      <AdminPlatformReport isOpen={openModal.admin} onClose={() => closePreview("admin")} />
    </TitleBar>
  );
};

export default InvoiceTemplates;
