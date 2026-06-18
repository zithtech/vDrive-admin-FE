import { useState } from "react";
import { Button } from "antd";
import { IoMdRefresh } from "react-icons/io";
import UserTable from "../components/UserTable/UserTable";
import dayjs from "dayjs";
import AppliedFilters from "../components/AppliedFilters/AppliedFilters";
import TitleBar from "../components/TitleBarCommon/TitleBar";
import AdvancedFilters from "../components/AdvancedFilters/AdvanceFilters";
import type { FilterField } from "../components/AdvancedFilters/AdvanceFilters";
export type UserRole =
  | "Admin"
  | "Manager"
  | "Developer"
  | "Tester"
  | "Support"
  | "Designer"
  | "Analyst";

export type UserStatus = "Active" | "Inactive" | "Suspended";

export interface User {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: string;
  createdAt: string;
}

const DATA: User[] = [
  {
    userId: "U1001",
    fullName: "Abiraham Immanvel Aasakoilraj",
    email: "john.doe@example.com",
    phoneNumber: "+1-202-555-0123",
    role: "Admin",
    status: "Active",
    lastLogin: "2025-08-20T14:35:22.000Z",
    createdAt: "2023-02-15T09:12:45.000Z",
  },
  {
    userId: "U1002",
    fullName: "Jane Smith",
    email: "jane.smith@example.com",
    phoneNumber: "+1-202-555-0456",
    role: "Manager",
    status: "Inactive",
    lastLogin: "2025-07-30T11:05:12.000Z",
    createdAt: "2023-03-21T12:25:30.000Z",
  },
  {
    userId: "U1003",
    fullName: "Michael Johnson",
    email: "michael.johnson@example.com",
    phoneNumber: "+1-202-555-0789",
    role: "Developer",
    status: "Active",
    lastLogin: "2025-08-22T08:45:10.000Z",
    createdAt: "2023-06-11T16:42:18.000Z",
  },
  {
    userId: "U1004",
    fullName: "Emily Davis",
    email: "emily.davis@example.com",
    phoneNumber: "+1-202-555-0987",
    role: "Tester",
    status: "Suspended",
    lastLogin: "2025-06-05T19:20:33.000Z",
    createdAt: "2023-07-28T10:15:00.000Z",
  },
  {
    userId: "U1005",
    fullName: "William Brown",
    email: "william.brown@example.com",
    phoneNumber: "+1-202-555-0674",
    role: "Support",
    status: "Active",
    lastLogin: "2025-08-21T06:55:40.000Z",
    createdAt: "2023-09-10T13:47:55.000Z",
  },
  {
    userId: "U1006",
    fullName: "Olivia Wilson",
    email: "olivia.wilson@example.com",
    phoneNumber: "+1-315-555-0111",
    role: "Designer",
    status: "Active",
    lastLogin: "2025-08-25T10:15:00.000Z",
    createdAt: "2023-10-01T11:20:15.000Z",
  },
  {
    userId: "U1007",
    fullName: "James Moore",
    email: "james.moore@example.com",
    phoneNumber: "+1-404-555-0122",
    role: "Developer",
    status: "Active",
    lastLogin: "2025-08-24T18:30:55.000Z",
    createdAt: "2023-11-05T09:00:00.000Z",
  },
  {
    userId: "U1008",
    fullName: "Sophia Taylor",
    email: "sophia.taylor@example.com",
    phoneNumber: "+1-512-555-0133",
    role: "Analyst",
    status: "Inactive",
    lastLogin: "2025-05-15T22:10:45.000Z",
    createdAt: "2023-12-12T14:30:00.000Z",
  },
  {
    userId: "U1009",
    fullName: "Robert Anderson",
    email: "robert.anderson@example.com",
    phoneNumber: "+1-617-555-0144",
    role: "Manager",
    status: "Active",
    lastLogin: "2025-08-19T12:00:10.000Z",
    createdAt: "2024-01-20T10:10:10.000Z",
  },
  {
    userId: "U1010",
    fullName: "Isabella Thomas",
    email: "isabella.thomas@example.com",
    phoneNumber: "+1-713-555-0155",
    role: "Support",
    status: "Suspended",
    lastLogin: "2025-04-01T09:25:30.000Z",
    createdAt: "2024-02-18T16:55:20.000Z",
  },
  {
    userId: "U1011",
    fullName: "David Jackson",
    email: "david.jackson@example.com",
    phoneNumber: "+1-801-555-0166",
    role: "Developer",
    status: "Active",
    lastLogin: "2025-08-23T11:45:19.000Z",
    createdAt: "2024-03-03T18:05:45.000Z",
  },
  {
    userId: "U1012",
    fullName: "Mia White",
    email: "mia.white@example.com",
    phoneNumber: "+1-916-555-0177",
    role: "Tester",
    status: "Active",
    lastLogin: "2025-08-20T15:50:02.000Z",
    createdAt: "2024-03-25T13:20:30.000Z",
  },
  {
    userId: "U1013",
    fullName: "Richard Harris",
    email: "richard.harris@example.com",
    phoneNumber: "+1-214-555-0188",
    role: "Admin",
    status: "Inactive",
    lastLogin: "2025-02-10T07:18:11.000Z",
    createdAt: "2024-04-10T12:00:00.000Z",
  },
  {
    userId: "U1014",
    fullName: "Charlotte Martin",
    email: "charlotte.martin@example.com",
    phoneNumber: "+1-305-555-0199",
    role: "Designer",
    status: "Active",
    lastLogin: "2025-08-25T09:05:14.000Z",
    createdAt: "2024-05-15T08:45:00.000Z",
  },
  {
    userId: "U1015",
    fullName: "Joseph Garcia",
    email: "joseph.garcia@example.com",
    phoneNumber: "+1-415-555-0101",
    role: "Developer",
    status: "Active",
    lastLogin: "2025-08-22T14:22:33.000Z",
    createdAt: "2024-06-20T22:30:10.000Z",
  },
  {
    userId: "U1016",
    fullName: "Amelia Martinez",
    email: "amelia.martinez@example.com",
    phoneNumber: "+1-602-555-0112",
    role: "Analyst",
    status: "Active",
    lastLogin: "2025-08-18T17:10:15.000Z",
    createdAt: "2024-07-01T11:11:11.000Z",
  },
  {
    userId: "U1017",
    fullName: "Daniel Robinson",
    email: "daniel.robinson@example.com",
    phoneNumber: "+1-720-555-0124",
    role: "Manager",
    status: "Active",
    lastLogin: "2025-08-24T10:00:00.000Z",
    createdAt: "2024-07-15T09:30:45.000Z",
  },
  {
    userId: "U1018",
    fullName: "Harper Clark",
    email: "harper.clark@example.com",
    phoneNumber: "+1-813-555-0135",
    role: "Support",
    status: "Inactive",
    lastLogin: "2025-07-05T13:40:50.000Z",
    createdAt: "2024-08-02T15:25:00.000Z",
  },
  {
    userId: "U1019",
    fullName: "Matthew Rodriguez",
    email: "matthew.rodriguez@example.com",
    phoneNumber: "+1-904-555-0146",
    role: "Tester",
    status: "Active",
    lastLogin: "2025-08-21T16:20:18.000Z",
    createdAt: "2024-08-21T10:10:05.000Z",
  },
  {
    userId: "U1020",
    fullName: "Evelyn Lewis",
    email: "evelyn.lewis@example.com",
    phoneNumber: "+1-206-555-0157",
    role: "Developer",
    status: "Suspended",
    lastLogin: "2025-01-22T23:55:00.000Z",
    createdAt: "2024-09-01T12:00:00.000Z",
  },
  {
    userId: "U1021",
    fullName: "Alexander Walker",
    email: "alexander.walker@example.com",
    phoneNumber: "+1-312-555-0168",
    role: "Designer",
    status: "Active",
    lastLogin: "2025-08-25T11:12:13.000Z",
    createdAt: "2024-09-15T14:45:30.000Z",
  },
  {
    userId: "U1022",
    fullName: "Abigail Hall",
    email: "abigail.hall@example.com",
    phoneNumber: "+1-412-555-0179",
    role: "Analyst",
    status: "Active",
    lastLogin: "2025-08-20T08:55:27.000Z",
    createdAt: "2024-10-02T09:15:10.000Z",
  },
  {
    userId: "U1023",
    fullName: "Benjamin Allen",
    email: "benjamin.allen@example.com",
    phoneNumber: "+1-503-555-0180",
    role: "Manager",
    status: "Inactive",
    lastLogin: "2025-06-11T19:00:41.000Z",
    createdAt: "2024-10-20T17:20:00.000Z",
  },
  {
    userId: "U1024",
    fullName: "Elizabeth Young",
    email: "elizabeth.young@example.com",
    phoneNumber: "+1-614-555-0191",
    role: "Admin",
    status: "Active",
    lastLogin: "2025-08-24T13:33:33.000Z",
    createdAt: "2024-11-05T11:40:55.000Z",
  },
  {
    userId: "U1025",
    fullName: "Henry King",
    email: "henry.king@example.com",
    phoneNumber: "+1-702-555-0102",
    role: "Developer",
    status: "Active",
    lastLogin: "2025-08-23T20:15:00.000Z",
    createdAt: "2024-11-28T20:00:00.000Z",
  },
  {
    userId: "U1026",
    fullName: "Sofia Wright",
    email: "sofia.wright@example.com",
    phoneNumber: "+1-816-555-0113",
    role: "Support",
    status: "Active",
    lastLogin: "2025-08-22T05:40:10.000Z",
    createdAt: "2024-12-10T10:30:25.000Z",
  },
  {
    userId: "U1027",
    fullName: "Jackson Scott",
    email: "jackson.scott@example.com",
    phoneNumber: "+1-919-555-0125",
    role: "Tester",
    status: "Suspended",
    lastLogin: "2025-03-14T12:12:12.000Z",
    createdAt: "2025-01-05T16:18:40.000Z",
  },
  {
    userId: "U1028",
    fullName: "Scarlett Green",
    email: "scarlett.green@example.com",
    phoneNumber: "+1-210-555-0136",
    role: "Designer",
    status: "Active",
    lastLogin: "2025-08-19T21:00:00.000Z",
    createdAt: "2025-01-20T18:50:00.000Z",
  },
  {
    userId: "U1029",
    fullName: "Logan Adams",
    email: "logan.adams@example.com",
    phoneNumber: "+1-314-555-0147",
    role: "Developer",
    status: "Active",
    lastLogin: "2025-08-25T13:25:45.000Z",
    createdAt: "2025-02-11T11:22:33.000Z",
  },
  {
    userId: "U1030",
    fullName: "Victoria Baker",
    email: "victoria.baker@example.com",
    phoneNumber: "+1-407-555-0158",
    role: "Manager",
    status: "Active",
    lastLogin: "2025-08-23T10:35:17.000Z",
    createdAt: "2025-03-17T09:05:15.000Z",
  },
];

export interface Filters {
  role: UserRole[];
  status: UserStatus[];
  lastLogin: Date | null;
  createdAt: Date | null;
}
const ROLES = ["Admin", "Manager", "Developer", "Tester", "Support", "Designer", "Analyst"];
const STATUSES = ["Active", "Inactive", "Suspended"];
const fields: FilterField[] = [
  {
    name: "status",
    label: "Status",
    type: "select",
    mode: "multiple",
    options: STATUSES.map((r) => ({ label: r, value: r })),
  },
  {
    name: "role",
    label: "Role",
    type: "select",
    mode: "multiple",
    options: ROLES.map((r) => ({ label: r, value: r })),
  },

  { name: "lastLogin", label: "Last Login", type: "date" },
  { name: "createdAt", label: "Created At", type: "date" },
];

const Users = () => {
  const [filters, setFilters] = useState<Filters>({
    role: [],
    status: [],
    lastLogin: null,
    createdAt: null,
  });

  const [filteredData, setFilteredData] = useState<User[]>(DATA);

  const applyFilters = (values: Record<string, any>) => {
    let tempData = DATA;
    if (values?.status?.length > 0) {
      const selectedStatuses = Array.isArray(values?.status) ? values?.status : [values?.status];
      tempData = tempData.filter((user) => selectedStatuses.includes(user?.status));
    }
    if (values?.role?.length > 0) {
      const selectedRole = Array.isArray(values?.role) ? values?.role : [values?.role];
      tempData = tempData.filter((user) => selectedRole.includes(user?.role));
    }
    if (values?.lastLogin) {
      tempData = tempData.filter((user) => dayjs(user?.lastLogin).isSame(values?.lastLogin, "day"));
    }
    if (values?.createdAt) {
      tempData = tempData.filter((user) => dayjs(user?.createdAt).isSame(values?.createdAt, "day"));
    }

    setFilteredData(tempData);
  };

  return (
    <TitleBar
      title="User Management"
      description="Manage and oversee all user accounts within the system."
      extraContent={
        <div>
          <Button icon={<IoMdRefresh />} loading={false} type="primary" onClick={() => {}}>
            Refresh
          </Button>
        </div>
      }
    >
      <div className="w-full h-full flex flex-col gap-4">
        {/* <Filter<Filters>
          fields={filterFields}
          initialValues={filters}
          onChange={setFilters}
        /> */}
        <AdvancedFilters filterFields={fields} applyFilters={applyFilters} />
        <AppliedFilters<Filters>
          filters={filters}
          setFilters={setFilters}
          labels={{
            role: "Role",
            status: "Status",
            lastLogin: "Last Login",
            createdAt: "Created At",
          }}
          colors={{
            role: "blue",
            status: "green",
            lastLogin: "purple",
            createdAt: "orange",
          }}
        />

        <div className="flex-grow overflow-auto rounded-lg border border-gray-300">
          <UserTable data={filteredData} />
        </div>
      </div>
    </TitleBar>
  );
};

export default Users;
