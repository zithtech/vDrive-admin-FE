import React, { useState } from "react";
import {
  Button,
  Tag,
  TimePicker,
  Space,
  Table,
  Modal,
  Form,
  message,
  Tooltip,
} from "antd";
import {
  ClockCircleOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { TimeSlotOption } from "./ScheduleKycAppointmentModal";

interface AdminAvailabilityManagerProps {
  slots: TimeSlotOption[];
  onSlotsChange: (newSlots: TimeSlotOption[]) => void;
}

export const AdminAvailabilityManager: React.FC<AdminAvailabilityManagerProps> = ({
  slots,
  onSlotsChange,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleAddSlot = async () => {
    try {
      const values = await form.validateFields();
      const [start, end] = values.timeRange;
      const startTime = start.format("HH:mm");
      const endTime = end.format("HH:mm");
      const startFormatted = start.format("hh:mm A");
      const endFormatted = end.format("hh:mm A");
      const label = `${startFormatted} – ${endFormatted}`;

      // Check collision / duplicate
      const exists = slots.some(
        (s) => s.startTime === startTime && s.endTime === endTime,
      );
      if (exists) {
        message.warning("A time slot with the exact same time range already exists!");
        return;
      }

      const newSlot: TimeSlotOption = {
        id: `slot_${startTime.replace(":", "")}_${endTime.replace(":", "")}`,
        label,
        startTime,
        endTime,
        isBooked: false,
      };

      onSlotsChange([...slots, newSlot]);
      message.success(`Added new availability time slot: ${label}`);
      form.resetFields();
      setIsAddModalOpen(false);
    } catch {
      // validation error
    }
  };

  const handleDeleteSlot = (slotId: string) => {
    const target = slots.find((s) => s.id === slotId);
    if (target?.isBooked) {
      message.error("Cannot delete a slot that already has a confirmed booking!");
      return;
    }
    const filtered = slots.filter((s) => s.id !== slotId);
    onSlotsChange(filtered);
    message.info("Time slot removed");
  };

  const columns = [
    {
      title: "TIME RANGE",
      key: "range",
      render: (_: any, r: TimeSlotOption) => (
        <div className="flex items-center gap-2">
          <ClockCircleOutlined className="text-blue-500" />
          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
            {r.label}
          </span>
          <span className="text-xs font-mono text-slate-400">
            ({r.startTime} - {r.endTime})
          </span>
        </div>
      ),
    },
    {
      title: "BOOKING STATUS",
      key: "status",
      width: 220,
      render: (_: any, r: TimeSlotOption) => {
        if (r.isBooked) {
          return (
            <div className="flex items-center gap-2">
              <Tag color="red" className="font-semibold text-xs">
                BOOKED
              </Tag>
              <span className="text-xs text-slate-600 dark:text-slate-300 truncate font-medium">
                {r.bookedDriverName ? `Driver: ${r.bookedDriverName}` : "Reserved"}
              </span>
            </div>
          );
        }
        return (
          <Tag color="green" className="font-semibold text-xs">
            AVAILABLE (OPEN)
          </Tag>
        );
      },
    },
    {
      title: "DOUBLE-BOOKING PROTECTION",
      key: "protection",
      width: 240,
      render: () => (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <SafetyCertificateOutlined />
          <span>Locked to 1 Driver / Admin</span>
        </div>
      ),
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 120,
      align: "right" as const,
      render: (_: any, r: TimeSlotOption) => (
        <Space size="small">
          <Tooltip title={r.isBooked ? "Cannot delete booked slot" : "Delete Slot"}>
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              disabled={r.isBooked}
              onClick={() => handleDeleteSlot(r.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/40 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CalendarOutlined className="text-blue-600" />
            <span>Admin Availability & Working Time Slots</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Define available appointment ranges for Video KYC. Slots shown here are offered to drivers who require scheduling after the 4-minute wait.
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
          size="middle"
        >
          Add Custom Time Slot
        </Button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Configured Slots</span>
            <div className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {slots.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold">
            <ClockCircleOutlined className="text-lg" />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-slate-400 font-medium">Available (Open)</span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {slots.filter((s) => !s.isBooked).length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircleOutlined className="text-lg" />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-slate-400 font-medium">Confirmed Bookings</span>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
              {slots.filter((s) => s.isBooked).length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center font-bold">
            <SafetyCertificateOutlined className="text-lg" />
          </div>
        </div>
      </div>

      {/* Slots Table */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <Table
          columns={columns}
          dataSource={slots}
          rowKey="id"
          pagination={false}
          size="middle"
        />
      </div>

      {/* Add Slot Modal */}
      <Modal
        open={isAddModalOpen}
        title="Add Available Time Slot"
        onCancel={() => setIsAddModalOpen(false)}
        onOk={handleAddSlot}
        okText="Add Slot"
        centered
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="timeRange"
            label="Time Slot Range (Start & End Time)"
            rules={[{ required: true, message: "Please select start and end time" }]}
          >
            <TimePicker.RangePicker
              format="hh:mm A"
              minuteStep={15}
              use12Hours
              className="w-full"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminAvailabilityManager;
