import React, { useState, useMemo, useEffect } from "react";
import {
  Layout,
  Typography,
  Card,
  Tabs,
  Form,
  InputNumber,
  Button,
  Table,
  Space,
  Statistic,
  Row,
  Col,
  Divider,
  Popconfirm,
  Tag,
  message,
  Modal,
  Input,
} from "antd";
import {
  SettingOutlined,
  TableOutlined,
  DownloadOutlined,
  SaveOutlined,
  DeleteOutlined,
  PlusOutlined,
  EditOutlined,
} from "@ant-design/icons";

import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchPricingCombinations,
  bulkCreatePricingCombinations,
  updatePricingCombination,
  deletePricingCombination,
} from "../store/slices/pricingCombinationSlice";

const { Content } = Layout;
const { Title, Text } = Typography;

export interface PricingRow {
  id?: string;
  key: string;
  tier: number;
  duration: number;
  distance: number;
  type: "Base" | "Extra KM";
  price: number;
  per_km_rate: number;
}

const PricingCombinations: React.FC = () => {
  const dispatch = useAppDispatch();
  const { combinations, isLoading } = useAppSelector((state) => state.pricingCombination);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("1");
  const [matrix, setMatrix] = useState<PricingRow[]>([]);

  useEffect(() => {
    dispatch(fetchPricingCombinations());
  }, [dispatch]);

  // Sync matrix with combinations from store if needed, or just use combinations directly
  const displayMatrix = useMemo(() => {
    if (activeTab === "2" && matrix.length > 0) {
      return matrix;
    }
    return combinations.map((c) => ({
      ...c,
      key: c.id,
    })) as PricingRow[];
  }, [combinations, matrix, activeTab]);

  // Edit Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingRow, setEditingRow] = useState<PricingRow | null>(null);
  const [editForm] = Form.useForm();

  const generateMatrix = (values: any) => {
    const { baseDuration, baseDistance, basePrice, numTiers, extraKmStep, pricePerExtraKm } =
      values;

    const newMatrix: PricingRow[] = [];

    for (let t = 1; t <= numTiers; t++) {
      const tierMultiplier = t;
      const tierBaseDuration = baseDuration * tierMultiplier;
      const tierBaseDistance = baseDistance * tierMultiplier;
      const tierBasePrice = basePrice * tierMultiplier;

      // Base combination for the tier
      newMatrix.push({
        key: `tier-${t}-base`,
        tier: t,
        duration: tierBaseDuration,
        distance: tierBaseDistance,
        type: "Base",
        price: tierBasePrice,
        per_km_rate: tierBaseDistance > 0 ? tierBasePrice / tierBaseDistance : 0,
      });

      // Extra KM steps for the tier (let's generate 4 steps for now, or could be an input)
      for (let s = 1; s <= 4; s++) {
        const extraDist = s * extraKmStep;
        const totalDist = tierBaseDistance + extraDist;
        const extraDuration = (extraDist / baseDistance) * baseDuration;
        const totalDuration = tierBaseDuration + extraDuration;
        const totalPrice = tierBasePrice + s * pricePerExtraKm;

        newMatrix.push({
          key: `tier-${t}-step-${s}`,
          tier: t,
          duration: parseFloat(totalDuration.toFixed(2)),
          distance: totalDist,
          type: "Extra KM",
          price: totalPrice,
          per_km_rate: totalDist > 0 ? totalPrice / totalDist : 0,
        });
      }
    }

    setMatrix(newMatrix);
    setActiveTab("2");
    message.success("Pricing matrix generated successfully!");
  };

  const handleDelete = async (record: PricingRow) => {
    if (record.id) {
      try {
        await dispatch(deletePricingCombination(record.id)).unwrap();
        message.success("Row deleted successfully!");
      } catch (err: any) {
        message.error(err || "Failed to delete row");
      }
    } else {
      setMatrix(matrix.filter((item) => item.key !== record.key));
    }
  };

  const handleEdit = (record: PricingRow) => {
    setEditingRow(record);
    editForm.setFieldsValue({
      tier: record.tier,
      type: record.type,
      duration: record.duration,
      distance: record.distance,
      price: record.price,
    });
    setIsEditModalVisible(true);
  };

  const handleEditSave = async () => {
    try {
      const values = await editForm.validateFields();
      if (editingRow?.id) {
        const newPrice = Number(values.price);
        const currentDistance = Number(editingRow.distance);
        await dispatch(
          updatePricingCombination({
            id: editingRow.id,
            combinationData: {
              tier: editingRow.tier,
              duration: editingRow.duration,
              distance: editingRow.distance,
              type: editingRow.type,
              price: newPrice,
              per_km_rate: currentDistance > 0 ? newPrice / currentDistance : 0,
            },
          }),
        ).unwrap();
        message.success("Row updated successfully!");
      } else {
        const updatedMatrix = matrix.map((item) => {
          if (editingRow && item.key === editingRow.key) {
            const newPrice = Number(values.price);
            const currentDistance = Number(item.distance);
            return {
              ...item,
              price: newPrice,
              per_km_rate: currentDistance > 0 ? newPrice / currentDistance : 0,
            };
          }
          return item;
        });
        setMatrix(updatedMatrix);
        message.success("Local row updated!");
      }
      setIsEditModalVisible(false);
      setEditingRow(null);
    } catch (error: any) {
      console.error("Save failed:", error);
      message.error(error || "Failed to save changes");
    }
  };

  const handleEditCancel = () => {
    setIsEditModalVisible(false);
    setEditingRow(null);
    editForm.resetFields();
  };

  const exportCSV = () => {
    const headers = [
      "Tier",
      "Duration (hr)",
      "Distance (km)",
      "Type",
      "Price (₹)",
      "Per-KM Rate (₹/km)",
    ];
    const rows = matrix.map((item) => [
      item.tier,
      item.duration,
      item.distance,
      item.type,
      Number(item.price || 0),
      Number(item.per_km_rate || 0).toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "pricing_matrix.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveMatrix = async () => {
    if (matrix.length === 0) {
      message.warning("No matrix generated to save!");
      return;
    }

    message.loading({ content: "Saving matrix...", key: "save" });
    try {
      // Use the new bulk create thunk
      const combinationsPayload = matrix.map((row) => {
        const { key, id, ...payload } = row;
        return payload;
      });

      await dispatch(bulkCreatePricingCombinations(combinationsPayload)).unwrap();

      setMatrix([]); // Clear local matrix after saving
      message.success({ content: "Pricing matrix saved successfully!", key: "save", duration: 2 });
    } catch (err: any) {
      message.error({ content: err || "Failed to save matrix", key: "save" });
    }
  };

  const stats = useMemo(() => {
    const data = displayMatrix;
    if (data.length === 0) return { count: 0, min: 0, max: 0, tiers: 0 };
    const prices = data.map((m) => m.price);
    const tiers = new Set(data.map((m) => m.tier)).size;
    return {
      count: data.length,
      min: Math.min(...prices),
      max: Math.max(...prices),
      tiers: tiers,
    };
  }, [displayMatrix]);

  const columns = [
    {
      title: "Tier",
      dataIndex: "tier",
      key: "tier",
      render: (tier: number) => <Tag color="blue">Tier {tier}</Tag>,
    },
    {
      title: "Duration (hr)",
      dataIndex: "duration",
      key: "duration",
    },
    {
      title: "Distance (km)",
      dataIndex: "distance",
      key: "distance",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => <Tag color={type === "Base" ? "green" : "orange"}>{type}</Tag>,
    },
    {
      title: "Price (₹)",
      dataIndex: "price",
      key: "price",
      render: (price: any) => <b>₹{Number(price || 0).toLocaleString()}</b>,
    },
    {
      title: "Per-KM Rate",
      dataIndex: "per_km_rate",
      key: "per_km_rate",
      render: (rate: any) => `₹${Number(rate || 0).toFixed(2)}/km`,
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: PricingRow) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#1890ff" }} />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete this row?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Content style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Title level={2}>Pricing Combinations</Title>
      <Text type="secondary">Generate and manage duration-distance based pricing matrix.</Text>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginTop: "24px" }}
        items={[
          {
            key: "1",
            label: (
              <span>
                <SettingOutlined />
                Configuration
              </span>
            ),
            children: (
              <Card>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={generateMatrix}
                  initialValues={{
                    baseDuration: 1,
                    baseDistance: 15,
                    basePrice: 1000,
                    numTiers: 5,
                    extraKmStep: 5,
                    pricePerExtraKm: 150,
                  }}
                >
                  <Row gutter={24}>
                    <Col span={8}>
                      <Form.Item
                        name="baseDuration"
                        label="Base Duration (hr)"
                        rules={[{ required: true }]}
                      >
                        <InputNumber min={0.5} step={0.5} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name="baseDistance"
                        label="Base Distance (km)"
                        rules={[{ required: true }]}
                      >
                        <InputNumber min={1} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name="basePrice"
                        label="Base Price (₹)"
                        rules={[{ required: true }]}
                      >
                        <InputNumber min={1} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider />

                  <Row gutter={24}>
                    <Col span={8}>
                      <Form.Item
                        name="numTiers"
                        label="Number of Tiers (Multipliers)"
                        rules={[{ required: true }]}
                      >
                        <InputNumber min={1} max={20} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name="extraKmStep"
                        label="Extra KM Step (km)"
                        rules={[{ required: true }]}
                      >
                        <InputNumber min={1} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name="pricePerExtraKm"
                        label="Price per Extra KM Step (₹)"
                        rules={[{ required: true }]}
                      >
                        <InputNumber min={0} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" icon={<PlusOutlined />} size="large">
                      Generate Pricing Matrix
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          {
            key: "2",
            label: (
              <span>
                <TableOutlined />
                Pricing Matrix
              </span>
            ),
            children: (
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <Row gutter={16}>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic title="Total Combinations" value={stats.count} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small">
                      <Statistic title="Active Tiers" value={stats.tiers} />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small">
                      <Statistic
                        title="Price Range"
                        value={`₹${stats.min.toLocaleString()} - ₹${stats.max.toLocaleString()}`}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card
                  title="Generated Matrix"
                  extra={
                    <Space>
                      <Button icon={<DownloadOutlined />} onClick={exportCSV}>
                        Export CSV
                      </Button>
                      <Button type="primary" icon={<SaveOutlined />} onClick={saveMatrix}>
                        Save Matrix
                      </Button>
                    </Space>
                  }
                >
                  <Table
                    columns={columns}
                    dataSource={displayMatrix}
                    loading={isLoading}
                    pagination={{ pageSize: 15 }}
                    scroll={{ y: 500 }}
                  />
                </Card>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title="Edit Pricing Row"
        open={isEditModalVisible}
        onOk={handleEditSave}
        onCancel={handleEditCancel}
        okText="Save"
      >
        <Form form={editForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tier" label="Tier">
                <InputNumber disabled style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="Type">
                <Input disabled style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="duration" label="Duration (hr)">
                <InputNumber disabled style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="distance" label="Distance (km)">
                <InputNumber disabled style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Price (₹)"
                rules={[{ required: true, message: "Please input price" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Content>
  );
};

export default PricingCombinations;
