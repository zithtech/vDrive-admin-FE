import { useState, useEffect } from "react";
import {
  Button,
  Card,
  List,
  // Typography,
  Modal,
  Form,
  Input,
  InputNumber,
  Spin,
  Popconfirm,
  Tag,
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
    <Card size="small" className="w-full bg-white dark:bg-[#0f17255d] border-none shadow-none">
      <div className="w-full flex flex-col gap-4">
        <div className="flex items-center justify-between w-full">
          <div className="w-full flex items-center gap-2">
            <LuZap className="text-[20px] text-blue-500 dark:text-blue-400" />
            <span className="text-[19px] font-semibold p-0 m-0 text-slate-800 dark:text-slate-100">Hotspot Types Management</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 m-0">
            Manage Hotspots
          </h3>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            className="w-full sm:w-auto"
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
              <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 flex-1">
                  <LuZap className="text-lg text-yellow-500" />
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item.hotspot_name}</span>
                      <Tag color="blue" className="w-fit">
                        {item.id}
                      </Tag>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
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
                  >
                    <Button icon={<DeleteOutlined />} danger size="small" />
                  </Popconfirm>
                </div>
              </div>
            </List.Item>
          )}
        />

        <Modal
          title={editingType ? "Edit Hotspot" : "Add Hotspot"}
          open={modalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          okText={editingType ? "Update" : "Create"}
          confirmLoading={isLoading}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              fare: 0,
              multiplier: 1,
            }}
          >
            <Form.Item
              name="hotspot_name"
              label="Hotspot Name"
              rules={[{ required: true, message: "Please enter hotspot name" }]}
            >
              <Input placeholder="e.g., Rush Zone" maxLength={100} />
            </Form.Item>

            <Form.Item
              name="fare"
              label="Fare (₹)"
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
                style={{ width: "100%" }}
                prefix="₹"
                step={0.01}
                precision={2}
              />
            </Form.Item>

            <Form.Item
              name="multiplier"
              label="Multiplier"
              rules={[
                { required: true, message: "Please enter multiplier" },
                {
                  type: "number",
                  min: 0.1,
                  message: "Multiplier must be greater than 0",
                },
              ]}
            >
              <InputNumber
                min={0.1}
                step={0.1}
                placeholder="1.0"
                style={{ width: "100%" }}
                addonAfter="x"
                precision={1}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Card>
  );
};

export default HotspotTypes;
