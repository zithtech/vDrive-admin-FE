import React, { useState, useEffect } from "react";
import { Button, Modal, notification, Tabs, Segmented } from "antd";
import {
  PlusOutlined,
  ExclamationCircleOutlined,
  BellOutlined,
} from "@ant-design/icons";
import TitleBar from "../components/TitleBarCommon/TitleBar";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchCoupons } from "../store/slices/couponSlice";
import { fetchPromos } from "../store/slices/promoSlice";
import { fetchCustomers } from "../store/slices/customerSlice";
import { fetchDrivers } from "../store/slices/driverSlice";
import NotificationTable from "../components/Notifications/NotificationTable";
import NotificationDrawer from "../components/Notifications/NotificationDrawer";
import NotificationNotifyModal from "../components/Notifications/NotificationNotifyModal";
import { fetchNotifications, createNotification, updateNotification, deleteNotification } from "../store/slices/notificationSlice";

const { confirm } = Modal;

const NotificationsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { role } = useAppSelector((state) => state.auth);
  const isSuperAdmin = role === 'super_admin';

  const [mainTab, setMainTab] = useState<"CUSTOMER" | "DRIVER">("CUSTOMER");
  const [subTab, setSubTab] = useState<"NOTIFICATIONS">("NOTIFICATIONS");

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [notifyModalVisible, setNotifyModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [editingNotification, setEditingNotification] = useState<any>(null);

  const { notifications: data, isLoading: loading } = useAppSelector((state) => state.notification);

  useEffect(() => {
    dispatch(fetchCoupons());
    dispatch(fetchPromos());
    dispatch(fetchCustomers());
    dispatch(fetchDrivers());
    dispatch(fetchNotifications(mainTab));
  }, [dispatch, mainTab]);

  const handleCreateNew = () => {
    setEditingNotification(null);
    setDrawerVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingNotification(record);
    setDrawerVisible(true);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: "Delete Notification?",
      icon: <ExclamationCircleOutlined />,
      content: "This will remove the notification record from the system.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await dispatch(deleteNotification({ id, target_type: mainTab })).unwrap();
          notification.success({ message: "Notification deleted" });
        } catch (err: any) {
          notification.error({ message: err || "Failed to delete notification" });
        }
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingNotification?.id) {
        await dispatch(updateNotification({
          id: editingNotification.id,
          notificationData: { ...values, target_type: mainTab }
        })).unwrap();
        notification.success({ message: "Notification template updated successfully" });
      } else {
        await dispatch(createNotification({ ...values, target_type: mainTab })).unwrap();
        notification.success({ message: "Notification template created successfully" });
      }
      setDrawerVisible(false);
    } catch (err: any) {
      notification.error({ message: err || "Failed to save notification" });
    }
  };

  const handleOpenNotifyModal = (record: any) => {
    setSelectedNotification(record);
    setNotifyModalVisible(true);
  };

  return (
    <TitleBar
      title="Notification Center"
      icon={
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center">
          <BellOutlined className="text-white" />
        </div>
      }
      iconBgColor="bg-indigo-600"
      description="Design and dispatch push notifications to engage your customers and drivers"
      extraContent={
        isSuperAdmin && (
          <div className="flex items-center gap-3">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={handleCreateNew}
              className="rounded-xl h-12 px-6 font-bold border-none !bg-gradient-to-r !from-indigo-600 !to-blue-600 hover:scale-[1.02] transition-transform flex items-center"
            >
              Compose New Notification
            </Button>
          </div>
        )
      }
    >
      <div className="w-full h-full flex flex-col p-6 bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar gap-6">
        {/* ─── Control Header ─────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
          <div className="flex items-center gap-6">
            <Tabs
              activeKey={mainTab}
              onChange={(key) => setMainTab(key as any)}
              className="premium-tabs border-none"
              items={[
                { key: "CUSTOMER", label: <span className="px-4 font-black uppercase tracking-widest text-[11px]">Customers Only</span> },
                { key: "DRIVER", label: <span className="px-4 font-black uppercase tracking-widest text-[11px]">Drivers Only</span> },
              ]}
            />

            <div className="h-8 w-[1px] bg-gray-200 dark:bg-slate-700 hidden md:block" />

            <div className="p-1 bg-gray-100 dark:bg-slate-700/50 rounded-xl w-fit">
              <Segmented
                value={subTab}
                onChange={(value) => setSubTab(value as any)}
                className="premium-segmented-alt"
                options={[
                  {
                    label: (
                      <div className={`px-5 py-0.5 flex items-center gap-2 font-black text-[10px] uppercase tracking-wider ${subTab === "NOTIFICATIONS" ? "text-indigo-600 dark:text-indigo-400" : "text-black dark:text-slate-200"}`}>
                        <BellOutlined /> Notifications
                      </div>
                    ),
                    value: "NOTIFICATIONS",
                  }
                ]}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-black leading-none mb-1">Active Ledger</p>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 font-bold">Broadcast History</p>
            </div>
          </div>
        </div>

        <div className="flex-grow min-h-0 px-2 transition-all duration-300">
          <NotificationTable
            data={data}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onOpenNotifyModal={handleOpenNotifyModal}
          />
        </div>
      </div>

      <NotificationDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onSubmit={handleSubmit}
        initialValues={editingNotification}
        defaultTarget={mainTab}
        loading={loading}
      />

      {selectedNotification && (
        <NotificationNotifyModal
          visible={notifyModalVisible}
          onCancel={() => setNotifyModalVisible(false)}
          notificationData={selectedNotification}
          targetType={mainTab}
        />
      )}

      <style>{`
        .dark .premium-table-alt .ant-table-thead > tr > th {
          background: #1e293b;
          color: #94a3b8;
          border-bottom: 2px solid #334155;
        }
        .dark .premium-table-alt .ant-table-tbody > tr > td {
          border-bottom: 1px solid #334155;
        }
        .dark .premium-table-alt .ant-table-wrapper .ant-table-pagination.ant-pagination {
          color: #cbd5e1;
        }
        .dark .premium-table-alt .ant-table-cell-row-hover {
          background: transparent !important;
        }
        .dark .ant-segmented {
          background-color: transparent !important;
        }
        .dark .ant-segmented-item-selected {
          background-color: #1e293b !important;
        }
        .dark .ant-segmented-item {
          color: #94a3b8;
        }
      `}</style>
    </TitleBar>
  );
};

export default NotificationsPage;
