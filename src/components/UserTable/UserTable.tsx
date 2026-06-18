import { SearchOutlined } from "@ant-design/icons";
import type { InputRef, TableColumnsType, TableColumnType } from "antd";
import { Button, Input, Space, Table, Tag } from "antd";
import type { FilterDropdownProps } from "antd/es/table/interface";
import Highlighter from "react-highlight-words";
import { useMemo, useRef, useState } from "react";
import { format } from "date-fns-tz";
import { useGetHeight } from "../../utilities/customheightWidth";
import type { User } from "../../pages/Users";

interface UserTableProps {
  data: User[];
}

type DataIndex = keyof User;

const UserTable = ({ data }: UserTableProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const tableHeight = useGetHeight(contentRef);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef>(null);

  const handleSearch = (
    selectedKeys: string[],
    confirm: FilterDropdownProps["confirm"],
    dataIndex: DataIndex,
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void, confirm: FilterDropdownProps["confirm"]) => {
    clearFilters();
    setSearchText("");
    confirm();
  };

  const getColumnSearchProps = (dataIndex: DataIndex): TableColumnType<User> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${String(dataIndex)}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            type="link"
            onClick={() => clearFilters && handleReset(clearFilters, confirm)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
          {/* <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            close
          </Button> */}
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    filterDropdownProps: {
      onOpenChange(open) {
        if (open) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
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

  const columns: TableColumnsType<User> = useMemo(
    () => [
      {
        title: "User ID",
        dataIndex: "userId",
        key: "userId",
        minWidth: 120,
        sorter: (a: User, b: User) => a.userId.localeCompare(b.userId),
        ...getColumnSearchProps("userId"),
      },
      {
        title: "Full Name",
        dataIndex: "fullName",
        key: "fullName",
        minWidth: 160,
        sorter: (a: User, b: User) => a.fullName.localeCompare(b.fullName),
        ...getColumnSearchProps("fullName"),
      },
      {
        title: "Email",
        dataIndex: "email",
        minWidth: 160,
        key: "email",
        sorter: (a: User, b: User) => a.email.localeCompare(b.email),
        ...getColumnSearchProps("email"),
      },
      {
        title: "Phone Number",
        dataIndex: "phoneNumber",
        minWidth: 160,
        key: "phoneNumber",
        width: 190,
        sorter: (a: User, b: User) => a.phoneNumber.localeCompare(b.phoneNumber),
      },
      {
        title: "Role",
        minWidth: 140,
        dataIndex: "role",
        key: "role",
        sorter: (a: User, b: User) => a.role.localeCompare(b.role),
        render: (role: string) => <Tag color="blue">{role}</Tag>,
      },
      {
        title: "Status",
        dataIndex: "status",
        minWidth: 120,
        key: "status",
        sorter: (a: User, b: User) => a.status.localeCompare(b.status),
        render: (status: string) => {
          let color = "green";
          if (status === "Inactive") color = "orange";
          if (status === "Suspended") color = "red";
          return <Tag color={color}>{status}</Tag>;
        },
      },
      {
        title: "Last Login",
        dataIndex: "lastLogin",
        minWidth: 240,
        key: "lastLogin",
        render: (text: string) =>
          format(new Date(text), "MMMM do yyyy, h:mm a", {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        sorter: (a: User, b: User) =>
          new Date(a.lastLogin).getTime() - new Date(b.lastLogin).getTime(),
      },
      {
        title: "Created At",
        minWidth: 240,
        dataIndex: "createdAt",
        key: "createdAt",
        render: (text: string) =>
          format(new Date(text), "MMMM do yyyy, h:mm a", {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        sorter: (a: User, b: User) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      },
    ],
    [searchText, searchedColumn],
  );

  return (
    <div ref={contentRef} className="h-full w-full">
      <Table
        key={tableHeight}
        // virtual
        columns={columns}
        dataSource={data}
        rowKey="userId"
        pagination={false}
        showSorterTooltip={false}
        tableLayout="auto"
        scroll={{ y: Math.floor(tableHeight || 0) }}
      />
    </div>
  );
};

export default UserTable;
