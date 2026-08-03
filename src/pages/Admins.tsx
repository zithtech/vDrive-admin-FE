import { useEffect, useRef, useState } from "react";
import { Button, Form, Input, Drawer, Select, Table, Space, Spin, Pagination, Avatar, Dropdown, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, DeleteOutlined, SafetyCertificateOutlined, SearchOutlined, UsergroupAddOutlined, AppstoreAddOutlined, EllipsisOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { RoleMatrixEditor } from "../components/Admins/RoleMatrixEditor";
import AdminStats from "../components/Admins/AdminStats";
import { IoPersonAddOutline } from "react-icons/io5";
import { IoMdRefresh } from "react-icons/io";
import { format } from "date-fns";
import { ShieldCheck } from "lucide-react";
import { useGetHeight } from "../utilities/customheightWidth";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  type AdminUser,
} from "../store/slices/adminSlice";
import { messageApi } from "../utilities/antdStaticHolder";
import axiosIns from "../api/axios";
import { useHasPermission } from "../hooks/usePermission";

type ModalMode = "create" | "edit";

const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{5,18}$/;
const phoneRegex = /^\+?[0-9]{6,15}$/;

export default function AdminPage() {
  const dispatch = useAppDispatch();
  const { admins, loading, submitting } = useAppSelector((state) => state.admin);
  const currentRole = useAppSelector((state) => state.auth.role);
  const isSuperAdmin = currentRole === "super_admin";
  const canCreateAdmin = useHasPermission("admins", "create");
  const canUpdateAdmin = useHasPermission("admins", "update");
  const canDeleteAdmin = useHasPermission("admins", "delete");

  const contentRef = useRef<HTMLDivElement>(null);
  const tableHeight = useGetHeight(contentRef);

  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [form] = Form.useForm();
  const [roles, setRoles] = useState<any[]>([]);

  const [currentView, setCurrentView] = useState<"administrators" | "roles">("administrators");
  const [globalSearch, setGlobalSearch] = useState("");
  const [filters, setFilters] = useState({
    name: "",
    mobile: "",
    email: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    setCurrentPage(1);
  }, [currentView, globalSearch, filters]);

  const fetchRoles = async () => {
    try {
      const response = await axiosIns.get("/api/roles");
      if (response.data && response.data.success) {
        setRoles(response.data.data);
      } else {
        throw new Error();
      }
    } catch (err) {
      // NEVER fabricate roles with placeholder UUIDs — assigning one writes an
      // invalid role_id into admin_users (a real source of corruption). Fail safe:
      // empty list + surface the error so no bogus role can be assigned.
      console.error("Failed to load roles from /api/roles:", err);
      setRoles([]);
      messageApi.error("Could not load roles. Role assignment is unavailable until roles load.");
    }
  };

  useEffect(() => {
    dispatch(fetchAdminUsers());
    fetchRoles();
  }, [dispatch]);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingAdmin(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEditModal = (admin: AdminUser) => {
    setModalMode("edit");
    setEditingAdmin(admin);
    // The `role` string is only a coarse bypass flag (admin/super_admin). The real
    // role lives in role_id — resolve it so the dropdown shows the actual role.
    const roleObj = roles.find((r) => String(r.id) === String(admin.role_id));
    form.setFieldsValue({
      name: admin.name,
      email: admin.email,
      contact: admin.contact ?? "",
      role: roleObj?.name ?? admin.role,
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = () => {
    form.validateFields().then(async (values) => {
      const selectedRoleObj = roles.find((r) => r.name === values.role);
      const role_id = selectedRoleObj ? String(selectedRoleObj.id) : undefined;

      if (modalMode === "create") {
        const payload: {
          name: string;
          email: string;
          password: string;
          role: string;
          role_id?: string;
          contact?: string;
        } = {
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
          role_id,
        };
        if (values.contact) payload.contact = values.contact;

        const result = await dispatch(createAdminUser(payload));
        if (createAdminUser.fulfilled.match(result)) {
          messageApi?.success("Admin user created successfully");
          setIsModalOpen(false);
          form.resetFields();
        }
      } else if (editingAdmin) {
        const payload: {
          name?: string;
          email?: string;
          contact?: string;
          role?: string;
          role_id?: string;
        } = {};
        if (values.name !== editingAdmin.name) payload.name = values.name;
        if (values.email !== editingAdmin.email) payload.email = values.email;
        if ((values.contact || null) !== editingAdmin.contact)
          payload.contact = values.contact || undefined;
        if (values.role !== editingAdmin.role) {
          payload.role = values.role;
          payload.role_id = role_id;
        }

        if (Object.keys(payload).length === 0) {
          setIsModalOpen(false);
          return;
        }

        const result = await dispatch(updateAdminUser({ id: editingAdmin.id, data: payload }));
        if (updateAdminUser.fulfilled.match(result)) {
          messageApi?.success("Admin user updated successfully");
          setIsModalOpen(false);
          form.resetFields();
        }
      }
    });
  };

  const handleDelete = async (id: string) => {
    const result = await dispatch(deleteAdminUser(id));
    if (deleteAdminUser.fulfilled.match(result)) {
      messageApi?.success("Admin user deleted successfully");
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const roleLabel: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
  };

  // const roleStyles: Record<string, { color: string; bg: string; border: string }> = {
  //   super_admin: { color: "#6366f1", bg: "#eef2ff", border: "#e0e7ff" },
  //   admin: { color: "#3b82f6", bg: "#eff6ff", border: "#dbeafe" },
  // };

  const columns: ColumnsType<AdminUser> = [
    {
      title: "Administrator",
      dataIndex: "name",
      key: "admin",
      width: 200,
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (_, record) => (
        <div className="customer-avatar-wrapper">
          <Avatar
            icon={<ShieldCheck size={16} />}
            size={32}
            className="customer-avatar"
          >
            {record.name.charAt(0)}
          </Avatar>
          <div className="customer-name-wrapper">
            <Typography.Text className="customer-name-text">{record.name}</Typography.Text>
            {/* <Typography.Text className="customer-id-text">
              ADM-{record.id.substring(0, 6).toUpperCase()}
            </Typography.Text> */}
          </div>
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 220,
      sorter: (a, b) => a.email.localeCompare(b.email),
      render: (email: string) => (
        <Typography.Text className="customer-phone-text" style={{ textTransform: "none" }}>
          {email}
        </Typography.Text>
      ),
    },
    {
      title: "Contact",
      dataIndex: "contact",
      key: "contact",
      width: 160,
      render: (contact: string | null) => (
        <div className="customer-contact-wrapper">
          <Typography.Text className="customer-phone-text">
            {contact || "No Phone Info"}
          </Typography.Text>
          <div className="customer-contact-separator" />
          <Typography.Text className="customer-email-text">
            {contact ? "Verified" : "Unverified"}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 140,
      render: (_role: string, record: AdminUser) => {
        // Display the real role from role_id, not the coarse `role` bypass flag.
        const roleObj = roles.find((r) => String(r.id) === String(record.role_id));
        const role = roleObj?.name ?? record.role;

        let colorClass = "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20"; // admin
        if (role === "super_admin")
          colorClass = "text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20";
        else if (role !== "admin")
          colorClass = "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20";

        return (
          <span
            className={`customer-status-tag border ${colorClass}`}
          >
            {roleLabel[role] ?? role.replace(/_/g, " ")}
          </span>
        );
      },
    },
    {
      title: "Added Date",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (text: string) => (
        <div className="customer-updated-wrapper">
          <Typography.Text className="customer-updated-date">
            {text ? format(new Date(text), "MMM dd, yyyy") : "-"}
          </Typography.Text>
          <div className="customer-contact-separator" />
          <Typography.Text className="customer-updated-time">
            {text ? format(new Date(text), "hh:mm a") : "-"}
          </Typography.Text>
        </div>
      ),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    ...(canUpdateAdmin || canDeleteAdmin
      ? [
        {
          title: "Action",
          key: "action",
          fixed: "right" as const,
          width: 80,
          render: (_: unknown, admin: AdminUser) => {
            const menuItems = [
              ...(canUpdateAdmin
                ? [
                  {
                    key: "edit",
                    icon: <EditOutlined className="customer-menu-icon" />,
                    label: <span className="customer-menu-label">Edit Admin</span>,
                  },
                ]
                : []),
              ...(canDeleteAdmin
                ? [
                  {
                    key: "delete",
                    icon: <DeleteOutlined />,
                    label: <span className="customer-menu-label-bold">Delete Admin</span>,
                    danger: true,
                  },
                ]
                : []),
            ];
            return (
              <Space className="customer-action">
                <Dropdown
                  menu={{
                    items: menuItems,
                    onClick: ({ key }) => {
                      if (key === "edit") openEditModal(admin);
                      if (key === "delete") handleDelete(admin.id);
                    },
                  }}
                  trigger={["click"]}
                  placement="bottomRight"
                >
                  <Button type="text" className="customer-action-ellipsis" icon={<EllipsisOutlined />} />
                </Dropdown>
              </Space>
            );
          },
        } as ColumnsType<AdminUser>[number],
      ]
      : []),
  ];

  const filteredAdmins = admins.filter((admin) => {
    if (globalSearch) {
      const lowerSearch = globalSearch.toLowerCase();
      const matchesGlobal = admin.name.toLowerCase().includes(lowerSearch) ||
        admin.email.toLowerCase().includes(lowerSearch) ||
        (admin.contact && admin.contact.includes(lowerSearch));
      if (!matchesGlobal) return false;
    }

    if (filters.name && !admin.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
    if (filters.mobile && (!admin.contact || !admin.contact.includes(filters.mobile))) return false;
    if (filters.email && !admin.email.toLowerCase().includes(filters.email.toLowerCase())) return false;

    return true;
  });

  const ViewItem = ({ icon, label, count, isActive, onClick, activeColorClass = "text-blue-600 dark:text-blue-400", bgActiveColorClass = "bg-blue-50/80 dark:bg-blue-500/10", badgeColorClass = "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300" }: any) => (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${isActive
        ? `${bgActiveColorClass} ${activeColorClass} font-bold`
        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
        }`}
    >
      <div className="flex items-center gap-2 text-xs">
        <span className="text-xs">{icon}</span>
        <span>{label}</span>
      </div>
      {count !== undefined && (
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isActive
          ? badgeColorClass
          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
          }`}>
          {count}
        </span>
      )}
    </div>
  );

  return (
    <>
      <div className="flex flex-col h-full w-full overflow-hidden bg-white dark:bg-slate-900">
        {/* Top Navbar */}
        <div className="bg-white dark:bg-slate-800  h-12 px-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 z-0 flex-shrink-0 w-full">
          {/* Title & Description */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <ShieldCheck size={16} strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 !m-0 !mb-1 leading-none">Administrators</h1>
            <div className="w-px h-5 bg-slate-300 dark:bg-slate-600"></div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 m-0">View and manage administrators</p>
          </div>

          <div className="relative flex-1 max-w-xl mx-auto flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all h-9">
            <SearchOutlined className="absolute left-3 text-slate-400 text-[16px]" />
            <input
              type="text"
              placeholder="Search administrators..."
              className="w-full pl-10 pr-4 py-1.5 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
            <div className="absolute right-3">
              <span className="text-[11px] font-bold text-slate-400 border border-slate-200 dark:border-slate-600 rounded-[4px] px-1.5 py-[1px] bg-slate-50/50 dark:bg-slate-800 tracking-wide">
                ⌘K
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-2 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-500/20">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-[11px] font-black tracking-widest uppercase">
                {currentView === "administrators" ? filteredAdmins.length : Object.keys(roles).length} RESULTS
              </span>
            </div>

            <button
              onClick={() => {
                dispatch(fetchAdminUsers());
                fetchRoles();
              }}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all shrink-0"
            >
              <IoMdRefresh className={`text-lg ${loading ? "animate-spin" : ""}`} />
            </button>

            {canCreateAdmin && (
              <Button
                type="primary"
                icon={<IoPersonAddOutline className="text-lg" />}
                onClick={openCreateModal}
                className="px-4 h-10 rounded-lg font-bold text-xs uppercase tracking-wider border-none !bg-blue-600 hover:!bg-blue-700 text-white shadow-sm flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-all"
              >
                Create Admin
              </Button>
            )}
          </div>
        </div>

        {/* Bottom Content Area */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* LEFT SIDEBAR */}
          <div className="w-[220px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0">
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {/* VIEWS */}
              <div className="px-4 pt-4 pb-6 border-b border-slate-200 dark:border-slate-800/50">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-2 mb-5">
                  Views
                </p>
                <div className="flex flex-col gap-1">
                  <ViewItem
                    icon={<UsergroupAddOutlined />}
                    label="Administrators"
                    count={admins.length}
                    isActive={currentView === "administrators"}
                    onClick={() => setCurrentView("administrators")}
                    activeColorClass="text-blue-500"
                    bgActiveColorClass="bg-blue-50/80 dark:bg-blue-900/30"
                    badgeColorClass="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                  />
                  {isSuperAdmin && (
                    <ViewItem
                      icon={<AppstoreAddOutlined />}
                      label="Role Customizer"
                      isActive={currentView === "roles"}
                      onClick={() => setCurrentView("roles")}
                      activeColorClass="text-blue-500"
                      bgActiveColorClass="bg-blue-50/80 dark:bg-blue-900/30"
                      badgeColorClass="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT MAIN CONTENT */}
          <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0b0f19] relative h-full">

            {/* Main Content */}
            <div className="flex-1 overflow-hidden p-4 bg-slate-50/50 dark:bg-[#0f172a] flex flex-col gap-2 pb-20" ref={contentRef}>
              <style>
                {`
                  .premium-table-flat .ant-table-thead > tr > th {
                      background: #f8fafc !important;
                      color: #64748b !important;
                      font-weight: 700 !important;
                      text-transform: uppercase !important;
                      font-size: 12px !important;
                      letter-spacing: 0.05em !important;
                      border-bottom: 1px solid #f1f5f9 !important;
                      border-top: 1px solid #f1f5f9 !important;
                      padding: 10px 12px !important;
                  }
                  .premium-table-flat .ant-table-thead > tr > th::before {
                      display: block !important;
                      background-color: #e2e8f0 !important;
                      width: 1px !important;
                      height: 1.4em !important;
                      top: 50% !important;
                      transform: translateY(-50%) !important;
                  }
                  .premium-table-flat .ant-table-tbody > tr:not(.ant-table-measure-row) > td {
                      padding: 4px 12px !important;
                      border-bottom: 1px solid #f8fafc !important;
                  }
                  .dark .premium-table-flat .ant-table-thead > tr > th {
                      background: #0f172a !important;
                      color: #64748b !important;
                      border-bottom: 1px solid #1e293b !important;
                  }
                  .dark .premium-table-flat .ant-table-tbody > tr:not(.ant-table-measure-row) > td {
                      border-bottom: 1px solid #1e293b !important;
                      color: #f1f5f9 !important;
                      background: #0f172a !important;
                  }
                  .dark .premium-table-flat .ant-table-cell-fix-left,
                  .dark .premium-table-flat .ant-table-cell-fix-right {
                      background: #0f172a !important;
                  }
                  .dark .premium-table-flat .ant-table-row:hover > td,
                  .dark .premium-table-flat .ant-table-row:hover > td.ant-table-cell-fix-left,
                  .dark .premium-table-flat .ant-table-row:hover > td.ant-table-cell-fix-right {
                      background: #1e293b !important;
                  }
                  .premium-table-flat .ant-table-row {
                      cursor: pointer;
                      transition: all 0.2s ease;
                  }
                  .premium-table-flat.ant-table-wrapper,
                  .premium-table-flat .ant-spin-nested-loading,
                  .premium-table-flat .ant-spin-container {
                      height: 100%;
                      display: flex;
                      flex-direction: column;
                  }
                  .premium-table-flat .ant-table {
                      flex: 1;
                      background: transparent !important;
                  }
                  .premium-table-flat .ant-table-container {
                      height: 100%;
                      overflow: hidden;
                  }
                  .premium-table-flat .ant-pagination {
                      display: none !important;
                  }
                  .customer-avatar-wrapper { display: flex; align-items: center; gap: 0.5rem; }
                  .customer-avatar { border: 2px solid white; flex-shrink: 0; background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); color: white; }
                  .customer-name-wrapper { display: flex; flex-direction: column; justify-content: center; gap: 0.125rem; }
                  .customer-name-text { font-weight: 800; color: #1e293b; letter-spacing: -0.025em; font-size: 13px; line-height: 1; }
                  .dark .customer-name-text { color: #f1f5f9; }
                  .customer-id-wrapper { display: flex; align-items: center; gap: 0.375rem; }
                  .customer-id-text { font-size: 11px; font-weight: 700;  letter-spacing: -0.025em; font-family: monospace; line-height: 1; color: #6b7280; }
                  .dark .customer-id-text { color: #94a3b8; }
                  .customer-contact-wrapper, .customer-updated-wrapper { display: flex; flex-direction: column; gap: 0.125rem; }
                  .customer-phone-text { font-size: 13px; font-weight: 600; color: #475569; }
                  .dark .customer-phone-text { color: #cbd5e1; }
                  .customer-contact-separator { display: none; }
                  .customer-email-text { font-size: 12px; font-weight: 900; color: #94a3b8; }
                  .dark .customer-email-text { color: #64748b; }
                  .customer-no-contacts { color: #9ca3af; font-size: 12px; font-style: italic; font-weight: 500; }
                  .customer-status-tag { margin: 0; border-radius: 6px; padding: 2px 6px; font-weight: 700; font-size: 11px; border-width: 1px; text-transform: uppercase; letter-spacing: 0.025em; display: inline-block; text-align: center; }
                  .customer-updated-date { font-size: 13px; font-weight: 700; color: #1e293b; text-transform: Capitalize; letter-spacing: -0.025em; }
                  .dark .customer-updated-date { color: #e2e8f0; }
                  .customer-updated-time { font-size: 12px; font-weight: 700; color: #818cf8; text-transform: uppercase; letter-spacing: 0.1em; }
                  .dark .customer-updated-time { color: #a5b4fc; }
                  .customer-action-view { color: #2563eb; transition: background-color 0.15s, color 0.15s; }
                  .customer-action-view:hover { background-color: #eff6ff; }
                  .customer-action-ellipsis { color: #9ca3af; font-size: 18px; }
                  .dark .customer-action-ellipsis { color: #64748b; }
                  .customer-action-ellipsis:hover { color: #4b5563; }
                  .dark .customer-action-ellipsis:hover { color: #f1f5f9; }
                  .customer-table-container { flex-grow: 1; background-color: white; border-radius: 6px; border: 1px solid #f1f5f9; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); overflow: hidden; display: flex; flex-direction: column; min-height: 0; padding-bottom: 0.5rem; }
                  .dark .customer-table-container { background-color: #0f172a; border-color: #334155; }
                  .customer-row-even { background-color: rgba(248, 250, 252, 0.5); transition: background-color 0.15s; }
                  .dark .customer-row-even { background-color: #0f172a; }
                  .customer-row-even:hover { background-color: rgba(238, 242, 255, 0.3) !important; }
                  .dark .customer-row-even:hover { background-color: #1e293b !important; }
                  .customer-row-odd { background-color: white; transition: background-color 0.15s; }
                  .dark .customer-row-odd { background-color: #0f172a; }
                  .customer-row-odd:hover { background-color: rgba(238, 242, 255, 0.3) !important; }
                  .dark .customer-row-odd:hover { background-color: #1e293b !important; }
                  .customer-menu-icon { color: #9ca3af; }
                  .customer-menu-label { font-weight: 700; color: #374151; }
                  .dark .customer-menu-label { color: #f1f5f9; }
                  .customer-menu-label-bold { font-weight: 700; }
                  
                  /* Admin filter inputs dark mode override */
                  .dark-theme-input-override .ant-input {
                    border-radius: 8px !important;
                  }
                  .dark .dark-theme-input-override .ant-input {
                    background-color: #0f172a !important;
                    border-color: #334155 !important;
                    color: #f1f5f9 !important;
                  }
                  .dark .dark-theme-input-override .ant-input::placeholder {
                    color: #64748b !important;
                  }
              `}
              </style>

              {currentView === "administrators" && <AdminStats admins={admins} loading={loading} />}

              {currentView === "administrators" && (
                <div className="bg-white dark:bg-slate-800 py-1 px-3 rounded-sm border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4 shadow-sm flex-shrink-0 dark-theme-input-override">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">
                      Name:
                    </span>
                    <Input
                      placeholder="Filter by name..."
                      className="flex-1 text-xs"
                      value={filters.name}
                      onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">
                      Mobile Number:
                    </span>
                    <Input
                      placeholder="Filter by mobile..."
                      className="flex-1 text-xs"
                      value={filters.mobile}
                      onChange={(e) => setFilters(prev => ({ ...prev, mobile: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">
                      Email:
                    </span>
                    <Input
                      placeholder="Filter by email..."
                      className="flex-1 text-xs"
                      value={filters.email}
                      onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  {(filters.name || filters.mobile || filters.email) && (
                    <Button
                      type="text"
                      danger
                      icon={<CloseCircleOutlined />}
                      className="text-[11px] font-bold uppercase tracking-wider"
                      onClick={() => setFilters({ name: "", mobile: "", email: "" })}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              )}
              {loading && admins.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-20 bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700">
                  <Spin size="large" />
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-[400px] bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="flex-grow overflow-hidden">
                    {currentView === "administrators" ? (
                      <div className="customer-table-container h-full w-full">
                        <Table
                          key={tableHeight}
                          dataSource={filteredAdmins}
                          columns={columns}
                          rowKey="id"
                          loading={loading}
                          pagination={{ position: ["none"], current: currentPage, pageSize: pageSize }}
                          showSorterTooltip={false}
                          tableLayout="fixed"
                          className="premium-table-flat"
                          rowClassName={(_, index) => ((index || 0) % 2 === 0 ? "customer-row-even" : "customer-row-odd")}
                          scroll={{ y: tableHeight ? Math.max(0, Math.floor(tableHeight)) : undefined, x: 1200 }}
                          size="small"
                        />
                      </div>
                    ) : (
                      <div style={{ height: Math.max(Math.floor(tableHeight || 0) - 10, 400), overflow: "hidden" }}>
                        <RoleMatrixEditor height={Math.max(Math.floor(tableHeight || 0) - 10, 400)} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Pagination Footer (only for administrators view) */}
            {currentView === "administrators" && (
              <div className="absolute bottom-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-805 px-6 flex items-center justify-between z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  Showing {filteredAdmins.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
                  {Math.min(currentPage * pageSize, filteredAdmins.length)} of {filteredAdmins.length} admins
                </span>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={filteredAdmins.length}
                  onChange={(page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                  }}
                  showSizeChanger
                  pageSizeOptions={[10, 15, 20, 50, 100]}
                  size="small"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <Drawer
        rootClassName="dark-drawer"
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <SafetyCertificateOutlined className="text-xl" />
            </div>
            <div>
              <div className="text-lg font-black text-slate-800 dark:text-slate-200 leading-none mb-1">
                {modalMode === "create" ? "Add New Administrator" : "Refine Admin Profile"}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {modalMode === "create"
                  ? "Grant system-wide access permissions"
                  : "Update user credentials and authority level"}
              </div>
            </div>
          </div>
        }
        width={560}
        open={isModalOpen}
        onClose={handleCancel}
        extra={
          <Space>
            <Button onClick={handleCancel} className="rounded-xl px-6 font-bold h-10">
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleModalSubmit}
              loading={submitting}
              className="rounded-xl px-8 font-bold h-10 !bg-gradient-to-r !from-indigo-600 !to-blue-500 border-none"
            >
              {modalMode === "create" ? "Provision Access" : "Commit Changes"}
            </Button>
          </Space>
        }
        className="premium-drawer"
      >
        <Form form={form} layout="vertical" validateTrigger="onSubmit" className="mt-4">
          <div className="bg-slate-50/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 mb-6">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Identity & Access
            </div>

            <Form.Item
              name="name"
              label={
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Full Name
                </span>
              }
              rules={[
                { required: true, message: "Name is required" },
                { min: 2, message: "Name must be at least 2 characters" },
                { max: 100, message: "Name must not exceed 100 characters" },
              ]}
            >
              <Input
                placeholder="Enter full name"
                className="premium-input-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label={
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Email Address
                </span>
              }
              rules={[
                { required: true, message: "Email is required" },
                { type: "email", message: "Enter a valid email address" },
              ]}
            >
              <Input
                placeholder="Enter email address"
                className="premium-input-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
              />
            </Form.Item>

            <Form.Item
              name="role"
              label={
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Authority Level
                </span>
              }
              rules={[{ required: true, message: "Role is required" }]}
              initialValue="admin"
            >
              <Select placeholder="Select role" className="premium-select-xl">
                {roles.map((r) => (
                  <Select.Option key={r.id} value={r.name}>
                    {r.name === "super_admin"
                      ? "Super Administrator"
                      : r.name === "admin"
                        ? "Platform Admin"
                        : r.name
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <div className="bg-slate-50/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Contact & Security
            </div>

            <Form.Item
              name="contact"
              label={
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Phone Contact
                </span>
              }
              rules={[
                {
                  pattern: phoneRegex,
                  message: "Enter valid phone number",
                },
              ]}
            >
              <Input
                placeholder="+91 00000 00000"
                className="premium-input-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
              />
            </Form.Item>

            {modalMode === "create" && (
              <>
                <Form.Item
                  name="password"
                  label={
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Access Key
                    </span>
                  }
                  rules={[
                    { required: true, message: "Password is required" },
                    {
                      pattern: passwordRegex,
                      message: "Must be 5–18 chars with Upper, Num, Special",
                    },
                  ]}
                  hasFeedback
                >
                  <Input.Password
                    placeholder="Create secure password"
                    title="At least one uppercase, number, and special character"
                    className="premium-input-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label={
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Verify Key
                    </span>
                  }
                  dependencies={["password"]}
                  hasFeedback
                  rules={[
                    { required: true, message: "Please confirm password" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("password") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error("Keys do not match"));
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    placeholder="Confirm access key"
                    className="premium-input-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                  />
                </Form.Item>
              </>
            )}
          </div>
        </Form>
      </Drawer>
    </>
  );
}
