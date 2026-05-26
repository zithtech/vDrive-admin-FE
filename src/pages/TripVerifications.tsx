import React, { useEffect, useState } from "react";
import {
  Table,
  Card,
  Button,
  Tag,
  Space,
  Modal,
  Image,
  message,
  Typography,
  Form,
  Input,
  Row,
  Col,
} from "antd";
import { CheckOutlined, CloseOutlined, EyeOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import axiosIns from "../api/axios";
import dayjs from "dayjs";

const { Text, Title } = Typography;
const { TextArea } = Input;

export interface TripVerification {
  id: string;
  driver_id: string;
  trip_id: string;
  driver_name: string;
  driver_phone: string;
  selfie_url: string;
  car_image_url: string;
  status: string;
  selfie_status: string;
  car_image_status: string;
  attempt_number: number;
  created_at: string;
}

const TripVerifications: React.FC = () => {
  const [data, setData] = useState<TripVerification[]>([]);
  const [loading, setLoading] = useState(false);
  const [comparisonModalVisible, setComparisonModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [verificationHistory, setVerificationHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [rejectingImage, setRejectingImage] = useState<"selfie" | "car" | null>(null);
  const [form] = Form.useForm();

  const fetchPendingVerifications = async () => {
    setLoading(true);
    try {
      const res = await axiosIns.get("/api/trip-verification/pending");
      if (res.data?.success) {
        setData(res.data.data || []);
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to fetch verifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const openComparisonModal = async (record: TripVerification) => {
    try {
      const res = await axiosIns.get(`/api/trip-verification/details/${record.id}`);
      if (res.data?.success) {
        setSelectedVerification({
          ...res.data.data.verification,
          profileSelfie: res.data.data.profileSelfie,
          driver: res.data.data.driver,
        });
        setComparisonModalVisible(true);
      }
    } catch (error: any) {
      message.error("Failed to fetch verification details");
    }
  };

  const openHistoryModal = async (record: TripVerification) => {
    setHistoryLoading(true);
    try {
      const res = await axiosIns.get(`/api/trip-verification/history/${record.id}`);
      if (res.data?.success) {
        setVerificationHistory(res.data.data || []);
        setHistoryModalVisible(true);
      }
    } catch (error: any) {
      message.error("Failed to fetch verification history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleGranularVerify = async (
    selfie_status: "approved" | "rejected" | undefined,
    car_status: "approved" | "rejected" | undefined,
    selfie_remarks?: string,
    car_remarks?: string
  ) => {
    if (!selectedVerification) return;
    
    try {
      const res = await axiosIns.put(`/api/trip-verification/verify-granular/${selectedVerification.id}`, {
        selfie_status,
        car_image_status: car_status,
        selfie_remarks,
        car_image_remarks: car_remarks,
      });

      if (res.data?.success) {
        message.success("Verification status updated");
        const updatedVerification = res.data.data;
        
        if (updatedVerification.status === "pending") {
          // Keep modal open and update the local state to reflect the partial approval
          setSelectedVerification({
            ...selectedVerification,
            ...updatedVerification
          });
          setRejectingImage(null);
          form.resetFields();
        } else {
          // Both verified or overall rejected -> close modal
          setComparisonModalVisible(false);
          setRejectingImage(null);
          form.resetFields();
          fetchPendingVerifications();
        }
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to update verification");
    }
  };

  // Single-click approve both selfie + car
  const handleApproveAll = async () => {
    if (!selectedVerification) return;

    try {
      const res = await axiosIns.put(`/api/trip-verification/verify-granular/${selectedVerification.id}`, {
        selfie_status: "approved",
        car_image_status: "approved",
      });

      if (res.data?.success) {
        message.success("✅ Both selfie & vehicle approved — trip starting!");
        setComparisonModalVisible(false);
        setRejectingImage(null);
        form.resetFields();
        fetchPendingVerifications();
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to approve verification");
    }
  };

  const onRejectSubmit = (values: any) => {
    if (rejectingImage === "selfie") {
      handleGranularVerify("rejected", undefined, values.reason, undefined);
    } else if (rejectingImage === "car") {
      handleGranularVerify(undefined, "rejected", undefined, values.reason);
    }
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (text: string) => dayjs(text).format("MMM D, YYYY HH:mm"),
    },
    {
      title: "Driver",
      key: "driver",
      render: (_: any, record: TripVerification) => (
        <div>
          <div className="font-bold">{record.driver_name || "Unknown"}</div>
          <div className="text-xs text-gray-500">{record.driver_phone}</div>
        </div>
      ),
    },
    {
      title: "Trip ID",
      dataIndex: "trip_id",
      key: "trip_id",
      render: (id: string) => <Text copyable>{id}</Text>,
    },
    {
      title: "Attempt",
      dataIndex: "attempt_number",
      key: "attempt_number",
      render: (attempt: number) => (
        <Tag color={attempt > 1 ? "orange" : "blue"}>Attempt #{attempt}</Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: TripVerification) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => openComparisonModal(record)}
          >
            Review
          </Button>
          <Button
            icon={<EyeOutlined />}
            onClick={() => openHistoryModal(record)}
          >
            History
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Title level={3} className="m-0">Trip Verifications</Title>
          <Text type="secondary">Review driver selfies and car images before ride start</Text>
        </div>
        <Button onClick={fetchPendingVerifications} loading={loading}>
          Refresh
        </Button>
      </div>

      <Card className="flex-1 shadow-sm overflow-hidden" bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Comparison Modal */}
      <Modal
        title="Verification Review"
        open={comparisonModalVisible}
        onCancel={() => {
          setComparisonModalVisible(false);
          setRejectingImage(null);
          form.resetFields();
        }}
        width={800}
        footer={null}
      >
        {selectedVerification && (
          <div>
            <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Driver:</Text> {selectedVerification.driver?.name} ({selectedVerification.driver?.phone})
                </Col>
                <Col span={12}>
                  <Text strong>Trip ID:</Text> {selectedVerification.trip_id}
                </Col>
              </Row>
            </div>

            {/* Approve All Banner — only when both are still pending */}
            {selectedVerification.selfie_status === "pending" && selectedVerification.car_image_status === "pending" && (
              <div className="mb-4 p-4 rounded-xl border-2 border-green-200 bg-green-50" style={{ textAlign: 'center' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<SafetyCertificateOutlined />}
                  onClick={handleApproveAll}
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: 12,
                    height: 48,
                    fontSize: 16,
                    fontWeight: 600,
                    paddingInline: 40,
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  }}
                >
                  Approve Both &amp; Start Trip
                </Button>
                <div style={{ marginTop: 8, color: '#6B7280', fontSize: 12 }}>Or review individually below</div>
              </div>
            )}

            <Row gutter={24}>
              {/* Identity Verification (Selfie) */}
              <Col span={12}>
                <Card title="Identity Verification" size="small" className="h-full">
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1 flex flex-col items-center">
                      <Text type="secondary" className="mb-2 text-xs">Profile Photo</Text>
                      {selectedVerification.profileSelfie ? (
                        <Image
                          src={selectedVerification.profileSelfie}
                          alt="Profile"
                          className="rounded-lg object-cover"
                          height={150}
                          width={150}
                        />
                      ) : (
                        <div className="w-[150px] h-[150px] bg-gray-100 flex items-center justify-center rounded-lg text-gray-400">
                          No Profile Photo
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <Text type="secondary" className="mb-2 text-xs">Live Trip Selfie</Text>
                      <Image
                        src={selectedVerification.selfie_url}
                        alt="Live Selfie"
                        className="rounded-lg object-cover"
                        height={150}
                        width={150}
                      />
                    </div>
                  </div>

                  {selectedVerification.selfie_status === "pending" && rejectingImage !== "selfie" ? (
                    <div className="flex gap-2">
                      <Button
                        type="primary"
                        className="bg-green-500 flex-1"
                        icon={<CheckOutlined />}
                        onClick={() => handleGranularVerify("approved", undefined)}
                      >
                        Approve Selfie
                      </Button>
                      <Button
                        danger
                        className="flex-1"
                        icon={<CloseOutlined />}
                        onClick={() => setRejectingImage("selfie")}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : selectedVerification.selfie_status === "pending" && rejectingImage === "selfie" ? (
                    <Form form={form} onFinish={onRejectSubmit} layout="vertical">
                      <Form.Item
                        name="reason"
                        label="Rejection Reason"
                        rules={[{ required: true, message: "Reason is required" }]}
                      >
                        <TextArea rows={2} placeholder="E.g., Face is blurry, not matching profile" />
                      </Form.Item>
                      <Space>
                        <Button danger type="primary" htmlType="submit">Confirm Reject</Button>
                        <Button onClick={() => setRejectingImage(null)}>Cancel</Button>
                      </Space>
                    </Form>
                  ) : (
                    <div className="text-center">
                      <Tag color={selectedVerification.selfie_status === "approved" ? "green" : "red"} className="w-full text-center py-1">
                        Selfie {selectedVerification.selfie_status.toUpperCase()}
                      </Tag>
                    </div>
                  )}
                </Card>
              </Col>

              {/* Vehicle Verification (Car Images) */}
              <Col span={12}>
                <Card title="Vehicle Verification" size="small" className="h-full">
                  <div className="flex flex-col items-center mb-4 w-full">
                    <Text type="secondary" className="mb-2 text-xs">Live Car Images (4 Sides)</Text>
                    {selectedVerification.car_images && selectedVerification.car_images.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 w-full">
                        {selectedVerification.car_images.map((img: string, idx: number) => (
                          <div key={idx} className="flex flex-col items-center w-full">
                            <Text type="secondary" className="mb-1 text-[10px] uppercase">View {idx + 1}</Text>
                            <Image
                              src={img}
                              alt={`Car Image ${idx + 1}`}
                              className="rounded-lg object-cover w-full"
                              height={100}
                              style={{ width: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Image
                        src={selectedVerification.car_image_url}
                        alt="Car Image"
                        className="rounded-lg object-cover"
                        height={150}
                        width={250}
                      />
                    )}
                  </div>

                  {selectedVerification.car_image_status === "pending" && rejectingImage !== "car" ? (
                    <div className="flex gap-2 mt-auto">
                      <Button
                        type="primary"
                        className="bg-green-500 flex-1"
                        icon={<CheckOutlined />}
                        onClick={() => handleGranularVerify(undefined, "approved")}
                      >
                        Approve Car
                      </Button>
                      <Button
                        danger
                        className="flex-1"
                        icon={<CloseOutlined />}
                        onClick={() => setRejectingImage("car")}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : selectedVerification.car_image_status === "pending" && rejectingImage === "car" ? (
                    <Form form={form} onFinish={onRejectSubmit} layout="vertical">
                      <Form.Item
                        name="reason"
                        label="Rejection Reason"
                        rules={[{ required: true, message: "Reason is required" }]}
                      >
                        <TextArea rows={2} placeholder="E.g., License plate not visible" />
                      </Form.Item>
                      <Space>
                        <Button danger type="primary" htmlType="submit">Confirm Reject</Button>
                        <Button onClick={() => setRejectingImage(null)}>Cancel</Button>
                      </Space>
                    </Form>
                  ) : (
                    <div className="text-center mt-auto">
                      <Tag color={selectedVerification.car_image_status === "approved" ? "green" : "red"} className="w-full text-center py-1">
                        Car Image {selectedVerification.car_image_status.toUpperCase()}
                      </Tag>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* History Modal */}
      <Modal
        title="Verification Audit History"
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setHistoryModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        <Table
          dataSource={verificationHistory}
          loading={historyLoading}
          rowKey="id"
          pagination={false}
          columns={[
            {
              title: "Time",
              dataIndex: "event_timestamp",
              key: "event_timestamp",
              width: 180,
              render: (text: string) => dayjs(text).format("MMM D, YYYY HH:mm:ss"),
            },
            {
              title: "Event",
              dataIndex: "event_type",
              key: "event_type",
              render: (type: string) => (
                <Tag color={
                  type === 'initial_submission' ? 'blue' : 
                  type === 'reupload' ? 'orange' : 
                  'purple'
                }>
                  {type.replace('_', ' ').toUpperCase()}
                </Tag>
              ),
            },
            {
              title: "Images",
              key: "images",
              render: (_: any, record: any) => (
                <Space>
                  <Image src={record.selfie_url} width={50} height={50} className="rounded object-cover" />
                  {record.car_images && record.car_images.length > 0 ? (
                    <Space size={4}>
                      {record.car_images.map((img: string, i: number) => (
                        <Image key={i} src={img} width={40} height={40} className="rounded object-cover" />
                      ))}
                    </Space>
                  ) : record.car_image_url ? (
                    <Image src={record.car_image_url} width={80} height={50} className="rounded object-cover" />
                  ) : null}
                </Space>
              ),
            },
            {
              title: "Status",
              key: "status",
              render: (_: any, record: any) => (
                <div>
                  <div className="flex gap-1 mb-1">
                    <Tag color={record.selfie_status === 'approved' ? 'green' : record.selfie_status === 'rejected' ? 'red' : 'default'}>
                      S: {record.selfie_status}
                    </Tag>
                    <Tag color={record.car_image_status === 'approved' ? 'green' : record.car_image_status === 'rejected' ? 'red' : 'default'}>
                      C: {record.car_image_status}
                    </Tag>
                  </div>
                  {record.remarks && <div className="text-xs text-gray-500 italic">"{record.remarks}"</div>}
                </div>
              ),
            },
            {
              title: "Reviewer",
              dataIndex: "admin_id",
              key: "admin_id",
              render: (id: string) => id ? <Text type="secondary" style={{ fontSize: '12px' }}>Admin ID: {id.split('-')[0]}...</Text> : '-',
            }
          ]}
        />
      </Modal>
    </div>
  );
};

export default TripVerifications;
