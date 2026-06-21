import { useState, useEffect } from "react";
import {
  Button,
  Card,
  List,
  Typography,
  Drawer,
  Form,
  Input,
  InputNumber,
  Spin,
  Popconfirm,
  Tag,
  Space,
} from "antd";
import { messageApi as message } from "../../utilities/antdStaticHolder";
import { PlusOutlined, EditOutlined, DeleteOutlined, LoadingOutlined } from "@ant-design/icons";
import { LuZap } from "react-icons/lu";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchHotspots,
  createHotspot,
  updateHotspot,
  deleteHotspot,
} from "../../store/slices/hotspotSlice";
import type { Hotspot } from "../../store/slices/hotspotSlice";

const HotspotTypes = () => {
  const dispatch = useAppDispatch();
  const { hotspots, isLoading } = useAppSelector((state) => state.hotspot);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<Hotspot | null>(null);
  const [form] = Form.useForm();

  // Load hotspot types on component mount
  useEffect(() => {
    dispatch(fetchHotspots({ limit: 50 }));
  }, [dispatch]);

  const handleAdd = () => {
    setEditingType(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (hotspot: Hotspot) => {
    setEditingType(hotspot);
    form.setFieldsValue({
      hotspot_name: hotspot.hotspot_name,
      fare: Number(hotspot.fare),
      multiplier: Number(hotspot.multiplier),
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const resultAction = await dispatch(deleteHotspot(id));
      if (deleteHotspot.fulfilled.match(resultAction)) {
        message.success("Hotspot deleted successfully");
      } else {
        message.error((resultAction.payload as string) || "Failed to delete hotspot");
      }
    } catch (error) {
      message.error("Failed to delete hotspot");
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingType) {
        // Update existing
        const resultAction = await dispatch(
          updateHotspot({
            id: editingType.id,
            data: {
              hotspot_name: values.hotspot_name,
              fare: values.fare,
              multiplier: values.multiplier,
            },
          }),
        );

        if (updateHotspot.fulfilled.match(resultAction)) {
          message.success("Hotspot updated successfully");
        } else {
          message.error((resultAction.payload as string) || "Failed to update hotspot");
        }
      } else {
        // Create new
        const resultAction = await dispatch(createHotspot(values));

        if (createHotspot.fulfilled.match(resultAction)) {
          message.success("Hotspot created successfully");
        } else {
          message.error((resultAction.payload as string) || "Failed to create hotspot");
        }
      }

      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error("Failed to save hotspot");
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
  };

  if (isLoading && hotspots.length === 0) {
    return (
      <Card size="small">
        <div className="flex justify-center items-center h-32">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          <span className="ml-2">Loading hotspots...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card size="small">
      <div className="w-full flex flex-col gap-4">
        <div className="flex items-center justify-between w-full">
          <div className="w-full flex items-center gap-2">
            <LuZap className="text-[20px] text-[#0080FF]" />
            <span className="text-[19px] font-semibold p-0 m-0">Hotspot Types Management</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <Typography.Title level={5} className="text-lg sm:text-xl">
            Manage Hotspots
          </Typography.Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            className="w-full sm:w-auto h-8 !rounded-lg font-bold text-xs uppercase tracking-wider !bg-blue-600 hover:!bg-blue-700 border-none shadow-sm"
          >
            Add Hotspot
          </Button>
        </div>

        <List
          loading={isLoading}
          itemLayout="horizontal"
          dataSource={hotspots}
          renderItem={(item) => (
            <List.Item>
              <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 bg-white rounded-md border">
                <div className="flex items-center gap-3 flex-1">
                  <LuZap className="text-lg text-yellow-500" />
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="font-semibold">{item.hotspot_name}</span>
                      <Tag color="blue" className="w-fit">
                        {item.id}
                      </Tag>
                    </div>
                    <span className="text-xs text-gray-600">
                      ₹{Number(item.fare).toFixed(2)} fare • {Number(item.multiplier).toFixed(1)}x
                      multiplier
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 items-center justify-end sm:justify-start">
                  <Button icon={<EditOutlined />} onClick={() => handleEdit(item)} size="small" />
                  <Popconfirm
                    title="Delete hotspot"
                    description="Are you sure you want to delete this hotspot?"
                    onConfirm={() => handleDelete(item.id)}
                    okText="Yes"
                    cancelText="No"
                    okButtonProps={{
                      className: "!bg-blue-600 hover:!bg-blue-700 !rounded-lg font-bold text-xs uppercase tracking-wider border-none shadow-sm h-7",
                    }}
                  >
                    <Button icon={<DeleteOutlined />} danger size="small" />
                  </Popconfirm>
                </div>
              </div>
            </List.Item>
          )}
        />

        <Drawer
          title={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                <LuZap className="text-xl text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-tight leading-none">
                  {editingType ? "Edit Hotspot" : "Add Hotspot"}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
                  Configure demand pricing zone
                </span>
              </div>
            </div>
          }
          placement="right"
          onClose={handleModalCancel}
          open={modalVisible}
          width={400}
          closeIcon={null}
          styles={{
            header: { borderBottom: '1px solid #f1f5f9', padding: '20px 24px' },
            body: { padding: '24px' },
            footer: { borderTop: '1px solid #f1f5f9', padding: '16px 24px' }
          }}
          footer={
            <div className="flex justify-end gap-3">
              <button
                className="px-5 h-10 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 hover:bg-slate-50 transition-all"
                onClick={handleModalCancel}
              >
                Cancel
              </button>
              <Button
                type="primary"
                className="h-10 px-6 !rounded-lg font-bold text-xs uppercase tracking-wider !bg-blue-600 hover:!bg-blue-700 border-none shadow-sm"
                onClick={handleModalOk}
                loading={isLoading}
              >
                {editingType ? "Update" : "Create Hotspot"}
              </Button>
            </div>
          }
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              fare: 0,
              multiplier: 1,
            }}
            className="flex flex-col gap-2"
          >
            <Form.Item
              name="hotspot_name"
              label={<span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hotspot Name</span>}
              rules={[{ required: true, message: "Please enter hotspot name" }]}
            >
              <Input placeholder="e.g., Airport Rush Zone" maxLength={100} className="h-11 rounded-lg" />
            </Form.Item>

            <Form.Item
              name="fare"
              label={<span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Additional Fare (₹)</span>}
              rules={[
                { required: true, message: "Please enter fare" },
                {
                  type: "number",
                  min: 0,
                  message: "Fare must be greater than or equal to 0",
                },
              ]}
            >
              <InputNumber
                min={0}
                placeholder="40"
                className="w-full rounded-lg"
                size="large"
                prefix="₹"
                step={0.01}
                precision={2}
              />
            </Form.Item>

            <Form.Item
              name="multiplier"
              label={<span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Price Multiplier</span>}
              rules={[
                { required: true, message: "Please enter multiplier" },
                {
                  type: "number",
                  min: 0.1,
                  message: "Multiplier must be greater than 0",
                },
              ]}
              extra={<span className="text-xs text-slate-400 mt-1 block">Standard multiplier applies on top of base fare.</span>}
            >
              <InputNumber
                min={0.1}
                step={0.1}
                placeholder="1.0"
                className="w-full rounded-lg"
                size="large"
                addonAfter="x"
                precision={1}
              />
            </Form.Item>
          </Form>
        </Drawer>
      </div>
    </Card>
  );
};

export default HotspotTypes;
