import React, { useState, useEffect, useMemo } from "react";
import { Table, Checkbox, Button, Card, Input, Space, message, Select, Modal } from "antd";
import { SaveOutlined, ReloadOutlined, PlusOutlined } from "@ant-design/icons";
import axiosIns from "../../api/axios";

interface PermissionRow {
  key: string;
  module: string;
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  manage: boolean;
  verify: boolean;
  assign: boolean;
}

interface Role {
  id: number | string;
  name: string;
  description: string;
  is_system: boolean;
  role_type?: string;
}

interface RoleMatrixEditorProps {
  height?: number;
}

export const RoleMatrixEditor: React.FC<RoleMatrixEditorProps> = ({ height }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(false);
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [catalog, setCatalog] = useState<{ module: string; actions: string[] }[]>([]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  // The grid is driven entirely by the DB permission catalog (single source of
  // truth) — new permissions appear automatically with no config edits here.
  const systemModules = useMemo(() => catalog.map((c) => c.module), [catalog]);
  const actionsByModule = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const c of catalog) map[c.module] = c.actions;
    return map;
  }, [catalog]);
  const getSupportedActions = (modName: string): string[] => actionsByModule[modName] ?? [];

  // New role inputs
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchCatalog = async () => {
    try {
      const response = await axiosIns.get("/api/roles/catalog");
      if (response.data && response.data.success) {
        setCatalog(response.data.data);
      } else {
        throw new Error("Unexpected /api/roles/catalog response");
      }
    } catch (err) {
      console.error("Failed to load permission catalog:", err);
      setCatalog([]);
      message.error("Could not load the permission catalog. The matrix is unavailable.");
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axiosIns.get("/api/roles");
      if (response.data && response.data.success) {
        setRoles(response.data.data);
        if (response.data.data.length > 0 && !selectedRoleId) {
          setSelectedRoleId(response.data.data[0].id);
        }
      } else {
        throw new Error("Unexpected /api/roles response");
      }
    } catch (err) {
      // Fail safe — never fabricate roles (placeholder ids corrupt admin_users.role_id).
      console.error("Failed to load roles:", err);
      setRoles([]);
      message.error("Could not load roles.");
    }
  };

  const fetchRolePermissions = async (roleId: number | string) => {
    setLoading(true);
    try {
      const response = await axiosIns.get(`/api/roles/${roleId}/permissions`);
      if (response.data && response.data.success) {
        setMatrix(response.data.data.permissions);
      } else {
        throw new Error("Unexpected response");
      }
    } catch (err) {
      // Fail safe — show nothing rather than fabricated/cached permissions.
      console.error("Failed to load role permissions:", err);
      setMatrix({});
      message.error("Could not load this role's permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
    fetchRoles();
  }, []);

  useEffect(() => {
    if (selectedRoleId) {
      fetchRolePermissions(selectedRoleId);
    }
  }, [selectedRoleId]);

  const handleCheckboxChange = (
    module: string,
    action: "read" | "create" | "update" | "delete" | "manage" | "verify" | "assign",
    checked: boolean,
  ) => {
    setMatrix((prev) => ({
      ...prev,
      [module]: {
        ...(prev[module] || {}),
        [action]: checked,
      },
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;
    setLoading(true);
    const payload = systemModules.map((moduleName) => {
      const actionsObj = matrix[moduleName] || {};
      const activeActions = Object.keys(actionsObj).filter(
        (act) => actionsObj[act] && getSupportedActions(moduleName).includes(act),
      );
      return {
        module: moduleName,
        actions: activeActions,
      };
    });

    try {
      const res = await axiosIns.put(`/api/roles/${selectedRoleId}/permissions`, {
        permissions: payload,
      });
      if (res.data && res.data.success) {
        message.success("Role permissions updated successfully.");
      } else {
        throw new Error("Unexpected response");
      }
    } catch (err) {
      // Fail safe — do not pretend a server save succeeded via local cache.
      console.error("Failed to save role permissions:", err);
      message.error("Failed to save role permissions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      return message.warning("Please enter a valid role name.");
    }
    const cleanName = newRoleName.toLowerCase().replace(/\s+/g, "_");

    try {
      const response = await axiosIns.post("/api/roles", {
        name: cleanName,
        description: newRoleDesc,
      });
      if (response.data && response.data.success) {
        message.success("New role created! Configure its permissions below.");
        setNewRoleName("");
        setNewRoleDesc("");
        setIsCreateModalOpen(false);
        fetchRoles();
        setSelectedRoleId(response.data.data.id);
      } else {
        throw new Error("Unexpected response");
      }
    } catch (err) {
      // Fail safe — never fabricate a role with a placeholder id locally.
      console.error("Failed to create role:", err);
      message.error("Failed to create role. Please try again.");
    }
  };

  const handleRoleTypeChange = async (roleId: any, roleType: string) => {
    try {
      const res = await axiosIns.patch(`/api/roles/${roleId}/type`, { roleType });
      if (res.data && res.data.success) {
        message.success("Role type updated successfully!");
        fetchRoles();
      } else {
        throw new Error("Unexpected response");
      }
    } catch (err) {
      console.error("Failed to update role type:", err);
      message.error("Failed to update role type. Please try again.");
    }
  };

  const renderCheckbox = (
    record: PermissionRow,
    action: "read" | "create" | "update" | "delete" | "manage" | "verify" | "assign",
  ) => {
    const supported = getSupportedActions(record.module);
    if (!supported.includes(action)) {
      return <span className="text-slate-300">-</span>;
    }
    return (
      <Checkbox
        checked={record[action]}
        disabled={selectedRole?.is_system}
        onChange={(e) => handleCheckboxChange(record.module, action, e.target.checked)}
      />
    );
  };

  const getModulesSupportingAction = (
    action: "read" | "create" | "update" | "delete" | "manage" | "verify" | "assign",
  ) => {
    return systemModules.filter((mod) => getSupportedActions(mod).includes(action));
  };

  const isAllChecked = (
    action: "read" | "create" | "update" | "delete" | "manage" | "verify" | "assign",
  ) => {
    const supportingModules = getModulesSupportingAction(action);
    if (supportingModules.length === 0) return false;
    return supportingModules.every((mod) => !!matrix[mod]?.[action]);
  };

  const isIndeterminate = (
    action: "read" | "create" | "update" | "delete" | "manage" | "verify" | "assign",
  ) => {
    const supportingModules = getModulesSupportingAction(action);
    if (supportingModules.length === 0) return false;
    const checkedCount = supportingModules.filter((mod) => !!matrix[mod]?.[action]).length;
    return checkedCount > 0 && checkedCount < supportingModules.length;
  };

  const handleHeaderCheckboxChange = (
    action: "read" | "create" | "update" | "delete" | "manage" | "verify" | "assign",
    checked: boolean,
  ) => {
    const supportingModules = getModulesSupportingAction(action);
    setMatrix((prev) => {
      const updated = { ...prev };
      for (const mod of supportingModules) {
        updated[mod] = {
          ...(updated[mod] || {}),
          [action]: checked,
        };
      }
      return updated;
    });
  };

  const renderHeaderCheckbox = (
    action: "read" | "create" | "update" | "delete" | "manage" | "verify" | "assign",
    label: string,
  ) => {
    return (
      <Space size={4}>
        <Checkbox
          checked={isAllChecked(action)}
          indeterminate={isIndeterminate(action)}
          disabled={selectedRole?.is_system}
          onChange={(e) => handleHeaderCheckboxChange(action, e.target.checked)}
        />
        <span>{label}</span>
      </Space>
    );
  };

  const columns = [
    {
      title: "Module Name",
      dataIndex: "module",
      key: "module",
      render: (text: string) => (
        <strong className="capitalize text-slate-700">{text.replace(/_/g, " ")}</strong>
      ),
    },
    {
      title: renderHeaderCheckbox("read", "Read (View)"),
      key: "read",
      render: (_: any, record: PermissionRow) => renderCheckbox(record, "read"),
    },
    {
      title: renderHeaderCheckbox("create", "Create (Add)"),
      key: "create",
      render: (_: any, record: PermissionRow) => renderCheckbox(record, "create"),
    },
    {
      title: renderHeaderCheckbox("update", "Update (Edit)"),
      key: "update",
      render: (_: any, record: PermissionRow) => renderCheckbox(record, "update"),
    },
    {
      title: renderHeaderCheckbox("delete", "Delete (Remove)"),
      key: "delete",
      render: (_: any, record: PermissionRow) => renderCheckbox(record, "delete"),
    },
    {
      title: renderHeaderCheckbox("manage", "Manage (Custom)"),
      key: "manage",
      render: (_: any, record: PermissionRow) => renderCheckbox(record, "manage"),
    },
    {
      title: renderHeaderCheckbox("verify", "Verify (Doc)"),
      key: "verify",
      render: (_: any, record: PermissionRow) => renderCheckbox(record, "verify"),
    },
    {
      title: renderHeaderCheckbox("assign", "Assign (Role)"),
      key: "assign",
      render: (_: any, record: PermissionRow) => renderCheckbox(record, "assign"),
    },
  ];

  const tableData: PermissionRow[] = systemModules.map((modName) => {
    const modObj = matrix[modName] || {};
    return {
      key: modName,
      module: modName,
      read: !!modObj.read,
      create: !!modObj.create,
      update: !!modObj.update,
      delete: !!modObj.delete,
      manage: !!modObj.manage,
      verify: !!modObj.verify,
      assign: !!modObj.assign,
    };
  });

  const alertBannerHeight = selectedRole?.is_system ? 60 : 0;
  const tableScrollHeight = height ? height - 300 - alertBannerHeight : 350;

  return (
    <Card
      className="rounded-3xl border border-slate-100 shadow-sm mt-6 flex flex-col overflow-hidden"
      style={height ? { height: height - 24 } : undefined}
      styles={{
        body: {
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          minHeight: 0,
          overflow: "hidden",
          padding: "16px",
        },
      }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 flex-shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-800">Dynamic Role Customizer</h2>
          <p className="text-slate-400 text-sm">
            Select any role, configure access rules across modules, and save changes.
          </p>
        </div>

        <Space size="middle">
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl font-bold border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            New Role
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => selectedRoleId && fetchRolePermissions(selectedRoleId)}
            className="rounded-xl font-semibold border-slate-200"
          >
            Reset
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={loading}
            onClick={handleSavePermissions}
            className="rounded-xl font-bold bg-blue-600 border-none shadow-md hover:opacity-90"
            disabled={selectedRole?.is_system}
          >
            Save Permissions
          </Button>
        </Space>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow min-h-0 overflow-hidden">
        {/* Sidebar: Role Picker & Creation Box */}
        <div className="lg:col-span-1 flex flex-col gap-4 h-full min-h-0 overflow-hidden">
          <Card
            size="small"
            title="Roles List"
            className="rounded-2xl border-slate-100 shadow-none flex flex-col min-h-0 overflow-hidden flex-grow"
            styles={{
              body: {
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
                minHeight: 0,
                overflow: "hidden",
                padding: "12px",
              },
            }}
          >
            <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar flex-grow min-h-0">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all font-semibold ${
                    selectedRoleId === r.id
                      ? "bg-blue-50 text-blue-700 border border-blue-100/50"
                      : "text-slate-600 hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <div className="truncate capitalize">{r.name.replace(/_/g, " ")}</div>
                  {r.is_system ? (
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      System Role
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider block">
                      Customizable
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Card>

        </div>

        {/* Permission Grid Matrix Table */}
        <div className="lg:col-span-3 flex flex-col h-full min-h-0 overflow-hidden">
          {selectedRole && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 border border-slate-100/50 p-4 rounded-2xl mb-4 shadow-sm flex-shrink-0">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">
                  Role Configuration
                </span>
                <strong className="text-base text-slate-800 capitalize">
                  {selectedRole.name.replace(/_/g, " ")}
                </strong>
                <span className="text-xs text-slate-400 font-medium">
                  {selectedRole.description || "No description provided"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Role Type
                </span>
                <Select
                  value={
                    selectedRole.role_type || (selectedRole.is_system ? "system" : "customizable")
                  }
                  onChange={(val) => handleRoleTypeChange(selectedRole.id, val)}
                  className="w-40 font-bold"
                  options={[
                    { value: "system", label: "System Locked" },
                    { value: "customizable", label: "Customizable" },
                  ]}
                />
              </div>
            </div>
          )}

          {selectedRole?.is_system && (
            <div className="bg-amber-50 border border-amber-200/50 text-amber-800 p-4 rounded-2xl mb-4 text-xs font-semibold flex-shrink-0">
              ⚠️ Note: <strong>{selectedRole.name.toUpperCase()}</strong> is currently a
              platform-locked system role. Change it to "Customizable" above to edit its
              permissions.
            </div>
          )}

          <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            loading={loading}
            className="border border-slate-100 rounded-2xl overflow-hidden shadow-none flex-grow"
            scroll={{ y: tableScrollHeight }}
            size="small"
          />
        </div>
      </div>
      <Modal
        title={
          <div className="flex flex-col">
            <span className="text-lg font-black text-slate-800">Create Custom Role</span>
            <span className="text-xs text-slate-400 font-medium">Define a new role before setting permissions</span>
          </div>
        }
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false);
          setNewRoleName("");
          setNewRoleDesc("");
        }}
        onOk={handleCreateRole}
        okText="Create Role"
        okButtonProps={{ className: "bg-blue-600 font-bold rounded-xl border-none shadow-md" }}
        cancelButtonProps={{ className: "rounded-xl font-semibold" }}
      >
        <Space direction="vertical" className="w-full mt-4 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Role Name</label>
            <Input
              placeholder="e.g. support_lead"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="rounded-lg py-2"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Description</label>
            <Input.TextArea
              placeholder="Description of authority and responsibilities..."
              value={newRoleDesc}
              onChange={(e) => setNewRoleDesc(e.target.value)}
              rows={3}
              className="rounded-lg"
            />
          </div>
        </Space>
      </Modal>
    </Card>
  );
};
export default RoleMatrixEditor;
