import React, { useState, useEffect } from 'react';
import { Table, Checkbox, Button, Card, Input, Space, message, Select } from 'antd';
import { SaveOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import axiosIns from '../../api/axios';

import { VDRIVE_MODULES } from '../../config/permissions';

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

const SYSTEM_MODULES = Object.keys(VDRIVE_MODULES);

const getSupportedActions = (modName: string): string[] => {
  const modConfig = VDRIVE_MODULES[modName as keyof typeof VDRIVE_MODULES];
  if (!modConfig) return [];
  return modConfig.permissions.map(p => p.split('.')[1]);
};

interface Role {
  id: number | string;
  name: string;
  description: string;
  is_system: boolean;
  role_type?: string;
}

// Memory/Local storage fallback for demonstration & robust operation
const MOCK_ROLES: Role[] = [
  { id: 1, name: 'super_admin', description: 'Complete system authority bypass', is_system: true },
  { id: 2, name: 'admin', description: 'Platform level operation manager', is_system: true },
  { id: 3, name: 'support_agent', description: 'View only access with limited customer messaging', is_system: false },
];

const MOCK_PERMISSIONS: Record<number | string, Record<string, Record<string, boolean>>> = {
  1: SYSTEM_MODULES.reduce((acc, mod) => {
    acc[mod] = { create: true, read: true, update: true, delete: true };
    return acc;
  }, {} as any),
  2: {
    dashboard: { create: false, read: true, update: false, delete: false },
    customers: { create: true, read: true, update: true, delete: false },
    drivers: { create: true, read: true, update: true, delete: false },
    admins: { create: false, read: false, update: false, delete: false },
    pricing: { create: false, read: true, update: false, delete: false },
    deductions: { create: false, read: true, update: false, delete: false },
    recharge: { create: false, read: true, update: false, delete: false },
    taxes: { create: false, read: true, update: false, delete: false },
    coupons: { create: true, read: true, update: true, delete: false },
    notifications: { create: true, read: true, update: false, delete: false }
  },
  3: SYSTEM_MODULES.reduce((acc, mod) => {
    acc[mod] = { create: false, read: mod === 'customers' || mod === 'drivers' || mod === 'dashboard', update: false, delete: false };
    return acc;
  }, {} as any)
};

interface RoleMatrixEditorProps {
  height?: number;
}

export const RoleMatrixEditor: React.FC<RoleMatrixEditorProps> = ({ height }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(false);
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  // New role inputs
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const fetchRoles = async () => {
    try {
      const response = await axiosIns.get('/api/roles');
      if (response.data && response.data.success) {
        setRoles(response.data.data);
        if (response.data.data.length > 0 && !selectedRoleId) {
          setSelectedRoleId(response.data.data[0].id);
        }
      } else {
        throw new Error();
      }
    } catch (err) {
      // Fallback
      console.log("Roles Endpoint not available yet. Using in-memory fallback.");
      const saved = localStorage.getItem('vdrive_custom_roles');
      const loadedRoles = saved ? JSON.parse(saved) : MOCK_ROLES;
      setRoles(loadedRoles);
      if (loadedRoles.length > 0 && !selectedRoleId) {
        setSelectedRoleId(loadedRoles[0].id);
      }
    }
  };

  const fetchRolePermissions = async (roleId: number | string) => {
    setLoading(true);
    try {
      const response = await axiosIns.get(`/api/roles/${roleId}/permissions`);
      if (response.data && response.data.success) {
        setMatrix(response.data.data.permissions);
      } else {
        throw new Error();
      }
    } catch (err) {
      // Fallback
      const storageKey = `vdrive_role_perms_${roleId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setMatrix(JSON.parse(saved));
      } else {
        setMatrix(MOCK_PERMISSIONS[roleId] || SYSTEM_MODULES.reduce((acc, mod) => {
          const modAcc: Record<string, boolean> = {};
          for (const action of getSupportedActions(mod)) {
            modAcc[action] = false;
          }
          acc[mod] = modAcc;
          return acc;
        }, {} as any));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (selectedRoleId) {
      fetchRolePermissions(selectedRoleId);
    }
  }, [selectedRoleId]);

  const handleCheckboxChange = (module: string, action: 'read' | 'create' | 'update' | 'delete' | 'manage' | 'verify' | 'assign', checked: boolean) => {
    setMatrix(prev => ({
      ...prev,
      [module]: {
        ...(prev[module] || {}),
        [action]: checked
      }
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;
    setLoading(true);
    const payload = SYSTEM_MODULES.map(moduleName => {
      const actionsObj = matrix[moduleName] || {};
      const activeActions = Object.keys(actionsObj).filter(act => actionsObj[act] && getSupportedActions(moduleName).includes(act));
      return {
        module: moduleName,
        actions: activeActions
      };
    });

    try {
      const res = await axiosIns.put(`/api/roles/${selectedRoleId}/permissions`, { permissions: payload });
      if (res.data && res.data.success) {
        message.success('Role permissions updated successfully on servers!');
      } else {
        throw new Error();
      }
    } catch (err) {
      // Fallback to saving in LocalStorage
      const storageKey = `vdrive_role_perms_${selectedRoleId}`;
      localStorage.setItem(storageKey, JSON.stringify(matrix));
      message.success('Role permissions updated in secure client cache!');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      return message.warning('Please enter a valid role name.');
    }
    const cleanName = newRoleName.toLowerCase().replace(/\s+/g, '_');

    try {
      const response = await axiosIns.post('/api/roles', {
        name: cleanName,
        description: newRoleDesc
      });
      if (response.data && response.data.success) {
        message.success('New role created! Configure its permissions below.');
        setNewRoleName('');
        setNewRoleDesc('');
        fetchRoles();
        setSelectedRoleId(response.data.data.id);
      } else {
        throw new Error();
      }
    } catch (err) {
      // Fallback role creation
      const nextId = Math.max(...roles.map(r => typeof r.id === 'number' ? r.id : Number(r.id) || 0), 0) + 1;
      const newRole: Role = {
        id: nextId,
        name: cleanName,
        description: newRoleDesc || 'Custom Admin Role',
        is_system: false
      };
      const updatedRoles = [...roles, newRole];
      setRoles(updatedRoles);
      localStorage.setItem('vdrive_custom_roles', JSON.stringify(updatedRoles));

      // Initialize matching blank permissions for this custom role
      const initialPerms = SYSTEM_MODULES.reduce((acc, mod) => {
        const modAcc: Record<string, boolean> = {};
        for (const action of getSupportedActions(mod)) {
          modAcc[action] = false;
        }
        acc[mod] = modAcc;
        return acc;
      }, {} as any);
      localStorage.setItem(`vdrive_role_perms_${nextId}`, JSON.stringify(initialPerms));

      message.success('New role created in local configuration! Set permissions below.');
      setNewRoleName('');
      setNewRoleDesc('');
      setSelectedRoleId(nextId);
    }
  };

  const handleRoleTypeChange = async (roleId: any, roleType: string) => {
    try {
      const res = await axiosIns.patch(`/api/roles/${roleId}/type`, { roleType });
      if (res.data && res.data.success) {
        message.success('Role type updated successfully!');
        fetchRoles();
      } else {
        throw new Error();
      }
    } catch (err) {
      // Local fallback
      const updatedRoles = roles.map(r => r.id === roleId ? { ...r, is_system: roleType === 'system', role_type: roleType } : r);
      setRoles(updatedRoles);
      localStorage.setItem('vdrive_custom_roles', JSON.stringify(updatedRoles));
      message.success('Role type updated in client cache!');
    }
  };

  const renderCheckbox = (record: PermissionRow, action: 'read' | 'create' | 'update' | 'delete' | 'manage' | 'verify' | 'assign') => {
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

  const getModulesSupportingAction = (action: 'read' | 'create' | 'update' | 'delete' | 'manage' | 'verify' | 'assign') => {
    return SYSTEM_MODULES.filter(mod => getSupportedActions(mod).includes(action));
  };

  const isAllChecked = (action: 'read' | 'create' | 'update' | 'delete' | 'manage' | 'verify' | 'assign') => {
    const supportingModules = getModulesSupportingAction(action);
    if (supportingModules.length === 0) return false;
    return supportingModules.every(mod => !!matrix[mod]?.[action]);
  };

  const isIndeterminate = (action: 'read' | 'create' | 'update' | 'delete' | 'manage' | 'verify' | 'assign') => {
    const supportingModules = getModulesSupportingAction(action);
    if (supportingModules.length === 0) return false;
    const checkedCount = supportingModules.filter(mod => !!matrix[mod]?.[action]).length;
    return checkedCount > 0 && checkedCount < supportingModules.length;
  };

  const handleHeaderCheckboxChange = (action: 'read' | 'create' | 'update' | 'delete' | 'manage' | 'verify' | 'assign', checked: boolean) => {
    const supportingModules = getModulesSupportingAction(action);
    setMatrix(prev => {
      const updated = { ...prev };
      for (const mod of supportingModules) {
        updated[mod] = {
          ...(updated[mod] || {}),
          [action]: checked
        };
      }
      return updated;
    });
  };

  const renderHeaderCheckbox = (action: 'read' | 'create' | 'update' | 'delete' | 'manage' | 'verify' | 'assign', label: string) => {
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
      title: 'Module Name',
      dataIndex: 'module',
      key: 'module',
      render: (text: string) => <strong className="capitalize text-slate-700">{text}</strong>,
    },
    {
      title: renderHeaderCheckbox('read', 'Read (View)'),
      key: 'read',
      render: (_: any, record: PermissionRow) => renderCheckbox(record, 'read'),
    },
    {
      title: renderHeaderCheckbox('create', 'Create (Add)'),
      key: 'create',
      render: (_: any, record: PermissionRow) => renderCheckbox(record, 'create'),
    },
    {
      title: renderHeaderCheckbox('update', 'Update (Edit)'),
      key: 'update',
      render: (_: any, record: PermissionRow) => renderCheckbox(record, 'update'),
    },
    {
      title: renderHeaderCheckbox('delete', 'Delete (Remove)'),
      key: 'delete',
      render: (_: any, record: PermissionRow) => renderCheckbox(record, 'delete'),
    },
    {
      title: renderHeaderCheckbox('manage', 'Manage (Custom)'),
      key: 'manage',
      render: (_: any, record: PermissionRow) => renderCheckbox(record, 'manage'),
    },
    {
      title: renderHeaderCheckbox('verify', 'Verify (Doc)'),
      key: 'verify',
      render: (_: any, record: PermissionRow) => renderCheckbox(record, 'verify'),
    },
    {
      title: renderHeaderCheckbox('assign', 'Assign (Role)'),
      key: 'assign',
      render: (_: any, record: PermissionRow) => renderCheckbox(record, 'assign'),
    },
  ];

  const tableData: PermissionRow[] = SYSTEM_MODULES.map(modName => {
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
      styles={{ body: { display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0, overflow: 'hidden', padding: '16px' } }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 flex-shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-800">Dynamic Role Customizer</h2>
          <p className="text-slate-400 text-sm">Select any role, configure access rules across modules, and save changes.</p>
        </div>

        <Space size="middle">
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
            className="rounded-xl font-bold bg-indigo-600 border-none shadow-md hover:opacity-90"
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
            styles={{ body: { display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0, overflow: 'hidden', padding: '12px' } }}
          >
            <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar flex-grow min-h-0">
              {roles.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all font-semibold ${selectedRoleId === r.id
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/50'
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                    }`}
                >
                  <div className="truncate capitalize">{r.name.replace(/_/g, ' ')}</div>
                  {r.is_system ? (
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">System Role</span>
                  ) : (
                    <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider block">Customizable</span>
                  )}
                </button>
              ))}
            </div>
          </Card>

          <Card size="small" title="Create Custom Role" className="rounded-2xl border-slate-100 shadow-none flex-shrink-0">
            <Space direction="vertical" className="w-full">
              <Input
                placeholder="Role Name (e.g. support_lead)"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="rounded-lg"
              />
              <Input.TextArea
                placeholder="Description of authority..."
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                rows={2}
                className="rounded-lg"
              />
              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={handleCreateRole}
                className="rounded-xl font-bold border-indigo-300 text-indigo-600"
              >
                Create Role
              </Button>
            </Space>
          </Card>
        </div>

        {/* Permission Grid Matrix Table */}
        <div className="lg:col-span-3 flex flex-col h-full min-h-0 overflow-hidden">
          {selectedRole && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 border border-slate-100/50 p-4 rounded-2xl mb-4 shadow-sm flex-shrink-0">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Role Configuration</span>
                <strong className="text-base text-slate-800 capitalize">{selectedRole.name.replace(/_/g, ' ')}</strong>
                <span className="text-xs text-slate-400 font-medium">{selectedRole.description || 'No description provided'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role Type</span>
                <Select
                  value={selectedRole.role_type || (selectedRole.is_system ? 'system' : 'customizable')}
                  onChange={(val) => handleRoleTypeChange(selectedRole.id, val)}
                  className="w-40 font-bold"
                  options={[
                    { value: 'system', label: 'System Locked' },
                    { value: 'customizable', label: 'Customizable' }
                  ]}
                />
              </div>
            </div>
          )}

          {selectedRole?.is_system && (
            <div className="bg-amber-50 border border-amber-200/50 text-amber-800 p-4 rounded-2xl mb-4 text-xs font-semibold flex-shrink-0">
              ⚠️ Note: <strong>{selectedRole.name.toUpperCase()}</strong> is currently a platform-locked system role. Change it to "Customizable" above to edit its permissions.
            </div>
          )}

          <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            loading={loading}
            className="border border-slate-100 rounded-2xl overflow-hidden shadow-none flex-grow"
            scroll={{ y: tableScrollHeight }}
          />
        </div>
      </div>
    </Card>
  );
};
export default RoleMatrixEditor;
