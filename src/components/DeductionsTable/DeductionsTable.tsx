import React, { useRef, useState, useMemo } from "react";
import {
  Table,
  Input,
  Button,
  Space,
  Tag,
  type TableColumnsType,
  type TableColumnType,
  type InputRef,
} from "antd";
import { DownloadOutlined, EyeOutlined, SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import { format } from "date-fns-tz";
import type { Deduction, Driver } from "../../pages/Deductions";
import { useGetHeight } from "../../utilities/customheightWidth";

interface DeductionTableProps {
  data: Deduction[];
}

type DataIndex = keyof Deduction;

const DeductionTable: React.FC<DeductionTableProps> = ({ data }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const tableHeight = useGetHeight(contentRef);
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
        <Space>
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
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
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

  const statusColors: Record<string, string> = {
    Success: "green",
    Failed: "red",
    Pending: "gold",
    Initiated: "blue",
    Reversed: "gray",
  };

  const columns: TableColumnsType<Deduction> = useMemo(
    () => [
      {
        title: "Deduction ID",
        dataIndex: "id",
        key: "id",
        minWidth: 160,
        sorter: (a, b) => a.id.localeCompare(b.id),
        ...getColumnSearchProps("id"),
      },
      {
        title: "Driver",
        dataIndex: "driver",
        key: "driver",
        minWidth: 160,

        render: (driver: Driver) => (
          <div>
            <div className="font-medium">{driver.fullName}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400">
              {driver.id} • {driver.phone}
            </div>
          </div>
        ),
      },
      {
        title: "Amount",
        dataIndex: "amount",
        key: "amount",
        minWidth: 110,

        sorter: (a, b) =>
          parseFloat(a.amount.replace("$", "")) - parseFloat(b.amount.replace("$", "")),
      },
      {
        title: "Trip ID",
        dataIndex: "trip",
        key: "trip",
        minWidth: 120,
        sorter: (a, b) => a.trip.localeCompare(b.trip),
        ...getColumnSearchProps("trip"),
      },
      {
        title: "Type",
        dataIndex: "type",
        key: "type",
        minWidth: 110,
        render: (type: string) => <Tag color="blue">{type}</Tag>,
      },
      {
        title: "Balance Before",
        dataIndex: "balanceBefore",
        key: "balanceBefore",
        minWidth: 140,
        sorter: (a: Deduction, b: Deduction) =>
          parseFloat(a.balanceBefore.replace(/[$,]/g, "")) -
          parseFloat(b.balanceBefore.replace(/[$,]/g, "")),
        render: (text: string) => <span className="font-medium">{text}</span>,
      },
      {
        title: "Balance After",
        dataIndex: "balanceAfter",
        key: "balanceAfter",
        minWidth: 140,
        sorter: (a: Deduction, b: Deduction) =>
          parseFloat(a.balanceAfter.replace(/[$,]/g, "")) -
          parseFloat(b.balanceAfter.replace(/[$,]/g, "")),
        render: (text: string) => <span className="font-medium">{text}</span>,
      },

      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        minWidth: 110,
        render: (status: string) => <Tag color={statusColors[status]}>{status}</Tag>,
        sorter: (a, b) => a.status.localeCompare(b.status),
      },
      {
        title: "Date",
        dataIndex: "date",
        minWidth: 120,
        key: "date",
        render: (text: string) => format(new Date(text), "MMM dd, yyyy"),
        sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      },
      {
        title: "Reference",
        dataIndex: "reference",
        key: "reference",
        minWidth: 120,
        ...getColumnSearchProps("reference"),
      },
      {
        title: "Performed By",
        dataIndex: "performedBy",
        minWidth: 140,
        key: "performedBy",
        ...getColumnSearchProps("performedBy"),
      },
      {
        title: "Actions",
        key: "actions",
        render: () => (
          <Space>
            <Button icon={<EyeOutlined />} size="small" type="default" onClick={() => {}} />
            <Button icon={<DownloadOutlined />} size="small" type="primary" onClick={() => {}} />
          </Space>
        ),
      },
    ],
    [searchText, searchedColumn],
  );

  return (
    <div ref={contentRef} className="h-full w-full">
      <Table
        className="rounded-lg border border-gray-300 dark:border-slate-700 premium-table"
        key={tableHeight}
        rowKey="driverId"
        columns={columns}
        dataSource={data}
        showSorterTooltip={false}
        tableLayout="auto"
        scroll={{ y: Math.floor(tableHeight || 0) }}
      />
    </div>
  );
};

export default DeductionTable;
