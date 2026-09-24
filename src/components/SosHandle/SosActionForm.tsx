import React from 'react';
import { Select, Input, Button, Form, Modal, message } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAdminUsers } from '../../store/slices/adminSlice';
import { useEffect, useState } from 'react';
import * as sosApi from '../../api/sosApi';
import { ConfigProvider, theme } from 'antd';
import { useTheme } from '../../contexts/ThemeContext';

const { TextArea } = Input;

interface SosActionFormProps {
  sosId?: string | null;
}

const SosActionForm: React.FC<SosActionFormProps> = ({ sosId }) => {
  const [isResolving, setIsResolving] = useState(false);
  const dispatch = useAppDispatch();
  const { admins, loading } = useAppSelector((state) => state.admin);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (admins.length === 0) {
      dispatch(fetchAdminUsers());
    }
  }, [dispatch, admins.length]);

  const adminOptions = admins.map(admin => ({
    value: admin.id,
    label: `${admin.name} (${admin.role})`
  }));
  return (
    <ConfigProvider 
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorBgContainer: isDarkMode ? '#1e293b' : '#ffffff',
          colorBorder: isDarkMode ? '#334155' : '#d9d9d9',
        }
      }}
    >
      <div className="rounded-xl border border-gray-200 dark:border-slate-800 w-full bg-white dark:bg-slate-900">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 dark:text-white text-[16px] m-0">Handle SOS Request</h2>
          <div className="flex gap-3">
            <Button size="middle" className="font-semibold text-gray-700 dark:text-slate-300">
              Cancel
            </Button>
            <Button 
              size="middle" 
              type="primary" 
              danger 
              className="font-semibold flex items-center gap-2"
              loading={isResolving}
              onClick={() => {
                if (!sosId) {
                  message.warning("No SOS alert selected");
                  return;
                }
                Modal.confirm({
                  title: 'Resolve SOS Alert',
                  content: 'Are you sure you want to mark this SOS alert as resolved? This will close the ticket.',
                  okText: 'Yes, Resolve',
                  okType: 'danger',
                  cancelText: 'Cancel',
                  onOk: async () => {
                    setIsResolving(true);
                    try {
                      await sosApi.resolveSos(sosId);
                      message.success("SOS Alert marked as resolved");
                      // The socket event 'SOS_RESOLVED' will handle removing it from the UI list automatically
                    } catch (err) {
                      const error = err as any;
                      console.error("Failed to resolve SOS:", error);
                      message.error(error.response?.data?.message || "Failed to resolve SOS alert. Please try again.");
                    } finally {
                      setIsResolving(false);
                    }
                  }
                });
              }}
            >
              <CheckCircleOutlined /> Mark as Resolved
            </Button>
          </div>
        </div>
        
        <div className="p-4">
          <Form layout="vertical" className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Form.Item 
                label={<span className="font-medium text-slate-700 dark:text-slate-300 text-[13px]">Emergency Reason <span className="text-red-500 text-[12px]">(Required)</span></span>}
                required={false}
                className="mb-0"
              >
                <Select 
                  defaultValue="medical"
                  options={[
                    { value: 'medical', label: 'Medical Emergency' },
                    { value: 'accident', label: 'Accident' },
                    { value: 'security', label: 'Security Threat' },
                    { value: 'breakdown', label: 'Vehicle Breakdown' },
                  ]}
                  className="w-full"
                  popupClassName={isDarkMode ? 'dark-dropdown' : ''}
                />
              </Form.Item>

              <Form.Item 
                label={<span className="font-medium text-slate-700 dark:text-slate-300 text-[13px]">Priority Level</span>}
                className="mb-0"
              >
                <Select 
                  defaultValue="high"
                  options={[
                    { value: 'critical', label: 'Critical Priority' },
                    { value: 'high', label: 'High Priority' },
                    { value: 'medium', label: 'Medium Priority' },
                    { value: 'low', label: 'Low Priority' },
                  ]}
                  className="w-full"
                  popupClassName={isDarkMode ? 'dark-dropdown' : ''}
                />
              </Form.Item>

              <Form.Item 
                label={<span className="font-medium text-slate-700 dark:text-slate-300 text-[13px]">Assign To</span>}
                className="mb-0"
              >
                <Select 
                  placeholder="Select Admin"
                  options={adminOptions}
                  loading={loading}
                  className="w-full"
                  showSearch
                  optionFilterProp="label"
                  popupClassName={isDarkMode ? 'dark-dropdown' : ''}
                />
              </Form.Item>
            </div>

            <Form.Item 
              label={<span className="font-medium text-slate-700 dark:text-slate-300 text-[13px]">Additional Notes / Plan to Handle</span>}
              className="mb-0"
            >
              <TextArea 
                rows={2} 
                defaultValue="Driver reported uneasiness and requested immediate medical assistance. Team 1 is on the way. Nearest hospital identified. Will update shortly."
                className="text-[13px] p-2"
              />
            </Form.Item>
          </Form>
        </div>
      </div>
    </ConfigProvider>
  );
};


export default SosActionForm;
