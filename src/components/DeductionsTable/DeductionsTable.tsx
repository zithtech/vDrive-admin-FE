import React, { useRef, useState, useMemo } from "react";
import {
  Table,
  Input,
  Button,
  Dropdown,
  type TableColumnsType,
  type TableColumnType,
  type InputRef,
} from "antd";
import {
  DownloadOutlined,
  EyeOutlined,
  SearchOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import dayjs from "dayjs";
import type { Deduction, Driver } from "../../pages/Deductions";

interface DeductionTableProps {
  data: Deduction[];
  loading?: boolean;
}

type DataIndex = keyof Deduction;

const DeductionTable: React.FC<DeductionTableProps> = ({ data, loading = false }) => {
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState<DataIndex | "">("");
  const searchInput = useRef<InputRef>(null);

  const handleSearch = (selectedKeys: string[], confirm: () => void, dataIndex: DataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void, confirm: () => void) => {
    clearFilters();
    setSearchText("");
    confirm();
  };

  const getColumnSearchProps = (dataIndex: DataIndex): TableColumnType<Deduction> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${String(dataIndex)}`}
          value={selectedKeys?.[0]}
          onChange={(e) => setSelectedKeys?.(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <div className="flex gap-2">
          <Button
            type="primary"
            size="small"
            icon={<SearchOutlined />}
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            size="small"
            onClick={() => clearFilters && handleReset(clearFilters, confirm)}
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </div>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#2563eb" : undefined }} />
    ),
    onFilter: (value, record) => {
      const recordValue = record[dataIndex];
      return recordValue
        ? recordValue
          .toString()
          .toLowerCase()
          .includes((value as string).toLowerCase())
        : false;
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  const getStatusBadge = (status: string) => {
    let bg = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350";
    switch (status) {
      case "Success":
        bg = "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400";
        break;
      case "Failed":
        bg = "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400";
        break;
      case "Pending":
        bg = "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";
        break;
      case "Initiated":
        bg = "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
        break;
      case "Reversed":
        bg = "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-350";
        break;
      default:
        break;
    }
    return (
      <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider inline-block border-none ${bg}`}>
        {status}
      </span>
    );
  };

  const columns: TableColumnsType<Deduction> = useMemo(
    () => [
      {
        title: "DEDUCTION ID",
        dataIndex: "id",
        key: "id",
        width: 140,
        sorter: (a, b) => a.id.localeCompare(b.id),
        ...getColumnSearchProps("id"),
        render: (id: string) => (
          <span className="font-semibold text-slate-800 dark:text-slate-200">{id}</span>
        ),
      },
      {
        title: "DRIVER",
        dataIndex: "driver",
        key: "driver",
        width: 200,
        render: (driver: Driver) => (
          <div className="flex flex-col min-w-0 gap-0.5">
            <span className="font-extrabold text-slate-800 dark:text-slate-100 tracking-tight text-xs leading-none truncate">
              {driver.fullName}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {driver.id} • {driver.phone}
            </span>
          </div>
        ),
      },
      {
        title: "AMOUNT",
        dataIndex: "amount",
        key: "amount",
        width: 110,
        sorter: (a, b) =>
          parseFloat(a.amount.replace("$", "")) - parseFloat(b.amount.replace("$", "")),
        render: (amount: string) => (
          <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">{amount}</span>
        ),
      },
      {
        title: "TRIP ID",
        dataIndex: "trip",
        key: "trip",
        width: 120,
        sorter: (a, b) => a.trip.localeCompare(b.trip),
        ...getColumnSearchProps("trip"),
        render: (trip: string) => (
          <span className="font-medium text-xs text-slate-700 dark:text-slate-300">{trip}</span>
        ),
      },
      {
        title: "TYPE",
        dataIndex: "type",
        key: "type",
        width: 120,
        render: (type: string) => (
          <span className="px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-none inline-block">
            {type}
          </span>
        ),
      },
      {
        title: "BALANCE BEFORE",
        dataIndex: "balanceBefore",
        key: "balanceBefore",
        width: 130,
        sorter: (a: Deduction, b: Deduction) =>
          parseFloat(a.balanceBefore.replace(/[$,]/g, "")) -
          parseFloat(b.balanceBefore.replace(/[$,]/g, "")),
        render: (text: string) => <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">{text}</span>,
      },
      {
        title: "BALANCE AFTER",
        dataIndex: "balanceAfter",
        key: "balanceAfter",
        width: 130,
        sorter: (a: Deduction, b: Deduction) =>
          parseFloat(a.balanceAfter.replace(/[$,]/g, "")) -
          parseFloat(b.balanceAfter.replace(/[$,]/g, "")),
        render: (text: string) => <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">{text}</span>,
      },
      {
        title: "STATUS",
        dataIndex: "status",
        key: "status",
        width: 110,
        render: (status: string) => getStatusBadge(status),
        sorter: (a, b) => a.status.localeCompare(b.status),
      },
      {
        title: "DATE",
        dataIndex: "date",
        width: 130,
        key: "date",
        render: (text: string) => (
          <span className="text-slate-700 dark:text-slate-300 font-semibold text-xs whitespace-nowrap">
            {dayjs(text).format("MMM DD, YYYY")}
          </span>
        ),
        sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      },
      {
        title: "REFERENCE",
        dataIndex: "reference",
        key: "reference",
        width: 120,
        ...getColumnSearchProps("reference"),
        render: (ref: string) => (
          <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">{ref}</span>
        ),
      },
      {
        title: "PERFORMED BY",
        dataIndex: "performedBy",
        width: 130,
        key: "performedBy",
        ...getColumnSearchProps("performedBy"),
        render: (user: string) => (
          <span className="text-slate-700 dark:text-slate-300 font-bold text-xs">{user}</span>
        ),
      },
      {
        title: "ACTIONS",
        key: "actions",
        width: 80,
        fixed: "right" as const,
        align: "center" as const,
        render: (record: any) => {
          const menuItems = [
            {
              key: "view",
              icon: <EyeOutlined className="text-slate-500" />,
              label: <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">View Details</span>,
            },
            {
              key: "download",
              icon: <DownloadOutlined className="text-blue-500" />,
              label: <span className="font-semibold text-xs text-blue-600">Download Receipt</span>,
            },
          ];

          return (
            <Dropdown
              menu={{
                items: menuItems,
                onClick: ({ key }) => {
                  if (key === "view") {
                    console.log("View record:", record);
                  } else if (key === "download") {
                    console.log("Download record receipt:", record);
                  }
                },
              }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button
                type="text"
                icon={<EllipsisOutlined className="text-slate-500 dark:text-slate-400 text-base" />}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80 p-0 cursor-pointer"
              />
            </Dropdown>
          );
        },
      },
    ],
    [searchText, searchedColumn],
  );

  return (
    <>
      <style>{`
        /* Compact premium table flat styles */
        .premium-table-compact .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          font-size: 10px !important;
          letter-spacing: 0.05em !important;
          border-bottom: 1px solid #e2e8f0 !important;
          padding: 8px 12px !important;
        }
        .premium-table-compact .ant-table-tbody > tr:not(.ant-table-measure-row) > td {
          padding: 8px 12px !important;
          border-bottom: 1px solid #f1f5f9 !important;
          background: #ffffff !important;
        }
        .premium-table-compact .ant-table-tbody > tr:not(.ant-table-measure-row):hover > td {
          background: #f8fafc !important;
        }
        .premium-table-compact .ant-table-cell-row-hover {
          background: #f8fafc !important;
        }
        .premium-table-compact .ant-table {
          background: transparent !important;
        }

        /* Dark mode overrides for compact table */
        .dark .premium-table-compact .ant-table-thead > tr > th {
          background: #1e293b !important;
          color: #94a3b8 !important;
          border-bottom: 1px solid #334155 !important;
        }
        .dark .premium-table-compact .ant-table-tbody > tr:not(.ant-table-measure-row) > td {
          background: #0f172a !important;
          border-bottom: 1px solid #1e293b !important;
          color: #cbd5e1 !important;
        }
        .dark .premium-table-compact .ant-table-tbody > tr:not(.ant-table-measure-row):hover > td {
          background: #1e293b !important;
        }
        .dark .premium-table-compact .ant-table-cell-row-hover {
          background: #1e293b !important;
        }
      `}</style>
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden pb-1 flex flex-col flex-1 min-h-0 h-full">
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="id"
          pagination={false}
          className="premium-table-compact"
          scroll={{ x: 1000, y: 'calc(100vh - 430px)' }}
          size="small"
        />
      </div>
    </>
  );
};

export default DeductionTable;
