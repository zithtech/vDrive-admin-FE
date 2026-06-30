import React, { useState } from "react";
import { Card, Form, Input, Button, Avatar, Divider, message, Modal } from "antd";
import { UserOutlined, MailOutlined, LockOutlined, SafetyCertificateOutlined, PhoneOutlined, EditOutlined } from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { fetchCurrentUser } from "../store/slices/authSlice";
import axiosIns from "../api/axios";

const Profile: React.FC = () => {
  const { currentUser, role } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [form] = Form.useForm();
  const [profileForm] = Form.useForm();

  const handlePasswordChange = async (values: any) => {
    setLoading(true);
    try {
      const response = await axiosIns.post("/api/auth/change-password", {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      if (response.data?.success) {
        message.success("Password updated successfully!");
        form.resetFields();
      } else {
        message.error(response.data?.message || "Failed to update password");
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Error updating password");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (values: any) => {
    setProfileLoading(true);
    try {
      const response = await axiosIns.post("/api/auth/update-profile", {
        contact: values.contact,
      });
      if (response.data?.success) {
        message.success("Profile updated successfully!");
        setIsModalVisible(false);
        dispatch(fetchCurrentUser());
      } else {
        message.error(response.data?.message || "Failed to update profile");
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Error updating profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const showEditModal = () => {
    profileForm.setFieldsValue({
      contact: currentUser?.contact || currentUser?.mobile_number || currentUser?.phone_number || currentUser?.mobile || "",
    });
    setIsModalVisible(true);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            User Profile
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your account settings and preferences</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-4">
          <Card 
            className="overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
            styles={{ body: { padding: 0 } }}
          >
            {/* Gradient Banner */}
            <div className="h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative">
              <div className="absolute inset-0 bg-black/10"></div>
            </div>
            
            <div className="px-6 pb-6 relative">
              {/* Avatar floating over banner */}
              <div className="flex justify-center -mt-16 mb-4">
                <div className="p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-lg">
                  <Avatar 
                    size={110} 
                    icon={<UserOutlined />} 
                    className="bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-4xl shadow-inner border-2 border-white dark:border-slate-800" 
                  />
                </div>
              </div>
              
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                  {currentUser?.name || "Member User"}
                </h2>
                <div className="inline-flex items-center justify-center px-3 py-1 mt-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider border border-indigo-100 dark:border-indigo-800/50">
                  {role === "super_admin" ? "Super Admin" : "Admin"}
                </div>
              </div>
              
              <Divider className="my-4 border-slate-200 dark:border-slate-700/60" />
              
              <div className="space-y-5 pt-2">
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-indigo-500 transition-colors group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600">
                    <MailOutlined className="text-lg" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Email Address</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate" title={currentUser?.email}>{currentUser?.email || "N/A"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-purple-500 transition-colors group-hover:bg-purple-50 dark:group-hover:bg-purple-900/50 group-hover:text-purple-600">
                    <SafetyCertificateOutlined className="text-lg" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Role Access</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 uppercase">{role?.replace('_', ' ')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 group justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-emerald-500 transition-colors group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/50 group-hover:text-emerald-600">
                      <PhoneOutlined className="text-lg" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Mobile Number</p>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{currentUser?.contact || currentUser?.mobile_number || currentUser?.phone_number || currentUser?.mobile || "N/A"}</p>
                    </div>
                  </div>
                  <Button 
                    type="text" 
                    icon={<EditOutlined />} 
                    onClick={showEditModal}
                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Password Form */}
        <div className="lg:col-span-8">
          <Card 
            className="h-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl"
          >
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-700/50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <LockOutlined className="text-xl" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white m-0">Change Password</h2>
            </div>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handlePasswordChange}
              className="max-w-md"
              requiredMark={false}
            >
              <Form.Item
                name="oldPassword"
                label={<span className="text-slate-700 dark:text-slate-300 font-semibold">Current Password</span>}
                rules={[{ required: true, message: "Please enter your current password" }]}
              >
                <Input.Password 
                  prefix={<LockOutlined className="text-slate-400 mr-1" />} 
                  className="h-12 rounded-xl border-slate-200 hover:border-indigo-400 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.2)] transition-all bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700" 
                  placeholder="Enter current password" 
                />
              </Form.Item>
              
              <Form.Item
                name="newPassword"
                label={<span className="text-slate-700 dark:text-slate-300 font-semibold mt-2 block">New Password</span>}
                rules={[
                  { required: true, message: "Please enter your new password" },
                  { min: 6, message: "Password must be at least 6 characters" }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined className="text-slate-400 mr-1" />} 
                  className="h-12 rounded-xl border-slate-200 hover:border-indigo-400 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.2)] transition-all bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700" 
                  placeholder="Enter new password" 
                />
              </Form.Item>
              
              <Form.Item
                name="confirmPassword"
                label={<span className="text-slate-700 dark:text-slate-300 font-semibold mt-2 block">Confirm New Password</span>}
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: "Please confirm your new password" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The two passwords do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined className="text-slate-400 mr-1" />} 
                  className="h-12 rounded-xl border-slate-200 hover:border-indigo-400 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.2)] transition-all bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700" 
                  placeholder="Confirm new password" 
                />
              </Form.Item>
              
              <Form.Item className="mt-8 mb-0">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading} 
                  className="h-12 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-none font-bold shadow-md hover:shadow-lg transition-all duration-300 w-full sm:w-auto"
                >
                  Update Securely
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </div>
      
      <Modal
        title={
          <div className="flex items-center gap-2">
            <EditOutlined className="text-indigo-500" />
            <span>Edit Mobile Number</span>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnClose
        className="rounded-xl overflow-hidden"
      >
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleUpdateProfile}
          className="mt-6"
        >
          <Form.Item
            name="contact"
            label={<span className="text-slate-700 dark:text-slate-300 font-semibold">Mobile Number</span>}
            rules={[
              { required: true, message: "Please enter your mobile number" },
            ]}
          >
            <Input 
              prefix={<PhoneOutlined className="text-slate-400 mr-1" />} 
              className="h-12 rounded-xl border-slate-200 hover:border-indigo-400 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.2)] transition-all bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700" 
              placeholder="Enter mobile number" 
            />
          </Form.Item>
          
          <div className="flex justify-end gap-3 mt-8">
            <Button 
              onClick={() => setIsModalVisible(false)}
              className="h-10 px-6 rounded-lg font-medium"
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={profileLoading}
              className="h-10 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 border-none font-medium shadow-md"
            >
              Save Changes
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
