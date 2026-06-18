import { useEffect, useRef } from "react";
import {
  Button,
  Form,
  Input,
  Drawer,
  Popconfirm,
  Select,
  Table,
  Space,
  Tabs,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { EditOutlined, DeleteOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { RoleMatrixEditor } from "../components/Admins/RoleMatrixEditor";
import { IoPersonAddOutline } from "react-icons/io5";
import { IoMdRefresh } from "react-icons/io";
import { format } from "date-fns";
import TitleBar from "../components/TitleBarCommon/TitleBar";
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
import { useState } from "react";
import axiosIns from "../api/axios";
import { useHasPermission } from "../hooks/usePermission";

type ModalMode = "create" | "edit";

const passwordRegex =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{5,18}$/;
const phoneRegex = /^\+?[0-9]{6,15}$/;

export default function AdminPage() {
  const dispatch = useAppDispatch();
  const { admins, loading, submitting } = useAppSelector(
    (state) => state.admin
  );
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

  const fetchRoles = async () => {
    try {
      const response = await axiosIns.get("/api/roles");
      if (response.data && response.data.success) {
        setRoles(response.data.data);
      } else {
        throw new Error();
      }
    } catch (err) {
      console.log("Roles Endpoint not available yet. Using in-memory fallback.");
      const saved = localStorage.getItem("vdrive_custom_roles");
      const loadedRoles = saved
        ? JSON.parse(saved)
        : [
            { id: "1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a", name: "super_admin", description: "Complete system authority bypass", is_system: true },
            { id: "2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b", name: "admin", description: "Platform level operation manager", is_system: true },
            { id: "3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c", name: "ops_manager", description: "Operations manager focusing on fleet and driver metrics", is_system: true },
            { id: "4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d", name: "finance_viewer", description: "Read-only view for financial models and payouts", is_system: true },
          ];
      setRoles(loadedRoles);
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
    form.setFieldsValue({
      name: admin.name,
      email: admin.email,
      contact: admin.contact ?? "",
      role: admin.role,
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

        const result = await dispatch(
          updateAdminUser({ id: editingAdmin.id, data: payload })
        );
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

  // const roleTagColor: Record<string, string> = {
  //   super_admin: "purple",
  //   admin: "blue",
  // };

  const roleLabel: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
  };

  const roleStyles: Record<string, { color: string, bg: string, border: string }> = {
    super_admin: { color: "#6366f1", bg: "#eef2ff", border: "#e0e7ff" },
    admin: { color: "#3b82f6", bg: "#eff6ff", border: "#dbeafe" },
  };

  const columns: ColumnsType<AdminUser> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      minWidth: 160,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      minWidth: 200,
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: "Contact",
      dataIndex: "contact",
      key: "contact",
      minWidth: 140,
      render: (contact: string | null) => contact || "—",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      minWidth: 120,
      render: (role: string) => (
        <span
          style={{
            color: roleStyles[role]?.color || "#4b5563",
            backgroundColor: roleStyles[role]?.bg || "#f3f4f6",
            borderColor: roleStyles[role]?.border || "#e5e7eb"
          }}
          className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border whitespace-nowrap"
        >
          {roleLabel[role] ?? role.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      minWidth: 180,
      render: (text: string) => format(new Date(text), "MMM d, yyyy h:mm a"),
      sorter: (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: "Updated At",
      dataIndex: "updated_at",
      key: "updated_at",
      minWidth: 180,
      render: (text: string) => format(new Date(text), "MMM d, yyyy h:mm a"),
      sorter: (a, b) =>
        new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
    },
    ...((canUpdateAdmin || canDeleteAdmin)
      ? [
        {
          title: "Action",
          key: "action",
          width: 140,
          render: (_: unknown, admin: AdminUser) => (
            <div className="flex items-center gap-1">
              {canUpdateAdmin && (
                <Button
                  type="text"
                  size="small"
                  className="!text-indigo-600 hover:!bg-indigo-50 !flex items-center justify-center !p-1 !h-8 !w-8 rounded-lg transition-all"
                  icon={<EditOutlined className="text-lg" />}
                  onClick={() => openEditModal(admin)}
                />
              )}
              {canDeleteAdmin && (
                <Popconfirm
                  title="Delete admin user"
                  description="Are you sure you want to delete this admin user?"
                  onConfirm={() => handleDelete(admin.id)}
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                  cancelText="Cancel"
                >
                  <Button
                    type="text"
                    danger
                    size="small"
                    className="hover:!bg-rose-50 !flex items-center justify-center !p-1 !h-8 !w-8 rounded-lg transition-all"
                    icon={<DeleteOutlined className="text-lg" />}
                  />
                </Popconfirm>
              )}
            </div>
          ),
        } as ColumnsType<AdminUser>[number],
      ]
      : []),
  ];

  return (
    <TitleBar
      title="Admin Management"
      description="Manage and orchestrate administrative access and platform permissions."
      icon={
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center">
          <SafetyCertificateOutlined className="text-white text-2xl" />
        </div>
      }
      extraContent={
        <div className="flex items-center gap-3">
          <Button
            icon={<IoMdRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />}
            onClick={() => dispatch(fetchAdminUsers())}
            className="rounded-full h-11 w-11 flex items-center justify-center border border-gray-100 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all bg-white dark:bg-slate-800"
          />
          {canCreateAdmin && (
            <Button
              icon={<IoPersonAddOutline className="text-lg" />}
              type="primary"
              onClick={openCreateModal}
              className="rounded-full h-11 px-8 font-bold !bg-gradient-to-r !from-indigo-600 !to-blue-500 border-none transition-all active:scale-95 flex items-center gap-2"
            >
              Create Admin
            </Button>
          )}
        </div>
      }
    >
      <div ref={contentRef} className="h-full w-full px-6 pb-6">
        <Tabs defaultActiveKey="1" className="premium-tabs">
          <Tabs.TabPane tab={<span className="font-bold text-sm">Administrators</span>} key="1">
            <Table
              key={tableHeight}
              dataSource={admins}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={false}
              showSorterTooltip={false}
              tableLayout="auto"
              scroll={{ y: Math.max(Math.floor(tableHeight || 0) - 100, 250) }}
            />
          </Tabs.TabPane>
          {isSuperAdmin && (
            <Tabs.TabPane tab={<span className="font-bold text-sm">Role Customizer</span>} key="2">
              <div style={{ height: Math.max(Math.floor(tableHeight || 0) - 10, 400), overflow: 'hidden' }}>
                <RoleMatrixEditor height={Math.max(Math.floor(tableHeight || 0) - 10, 400)} />
              </div>
            </Tabs.TabPane>
          )}
        </Tabs>        <Drawer
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
                  {modalMode === "create" ? "Grant system-wide access permissions" : "Update user credentials and authority level"}
                </div>
              </div>
            </div>
          }
          width={560}
          open={isModalOpen}
          onClose={handleCancel}
          extra={
            <Space>
              <Button onClick={handleCancel} className="rounded-xl px-6 font-bold h-10">Cancel</Button>
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
                label={<span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Full Name</span>}
                rules={[
                  { required: true, message: "Name is required" },
                  { min: 2, message: "Name must be at least 2 characters" },
                  { max: 100, message: "Name must not exceed 100 characters" },
                ]}
              >
                <Input placeholder="Enter full name" className="premium-input-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100" />
              </Form.Item>

              <Form.Item
                name="email"
                label={<span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Email Address</span>}
                rules={[
                  { required: true, message: "Email is required" },
                  { type: "email", message: "Enter a valid email address" },
                ]}
              >
                <Input placeholder="Enter email address" className="premium-input-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100" />
              </Form.Item>

              <Form.Item
                name="role"
                label={<span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Authority Level</span>}
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
                        : r.name.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
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
                label={<span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Phone Contact</span>}
                rules={[
                  {
                    pattern: phoneRegex,
                    message: "Enter valid phone number",
                  },
                ]}
              >
                <Input placeholder="+91 00000 00000" className="premium-input-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100" />
              </Form.Item>

              {modalMode === "create" && (
                <>
                  <Form.Item
                    name="password"
                    label={<span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Access Key</span>}
                    rules={[
                      { required: true, message: "Password is required" },
                      {
                        pattern: passwordRegex,
                        message: "Must be 5–18 chars with Upper, Num, Special",
                      },
                    ]}
                    hasFeedback
                  >
                    <Input.Password placeholder="Create secure password" title="At least one uppercase, number, and special character" className="premium-input-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100" />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    label={<span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Verify Key</span>}
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
                    <Input.Password placeholder="Confirm access key" className="premium-input-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100" />
                  </Form.Item>
                </>
              )}
            </div>
          </Form>
        </Drawer>
      </div>
    </TitleBar>
  );
}
