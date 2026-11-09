import React, { useState, useEffect, useRef } from "react";
import AgoraRTC, {
  type IAgoraRTCClient,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
  type IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";
import {
  Modal,
  Button,
  Tag,
  Space,
  Input,
  Tabs,
  Image,
  Typography,
  message,
  Card,
  Row,
  Col,
  Checkbox,
  Popconfirm,
  Badge,
} from "antd";
import {
  VideoCameraOutlined,
  AudioOutlined,
  AudioMutedOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  PhoneOutlined,
  IdcardOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import axiosIns from "../../api/axios";
import { logger } from "../../utils/logger";

const { Text, Title } = Typography;
const { TextArea } = Input;

export interface KycSessionData {
  sessionId: string;
  driverId: string;
  channelName: string;
  driver?: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    profile_pic_url?: string;
    city?: string;
  };
  documents?: Array<{
    id: string;
    document_type: string;
    document_url: string;
    document_number?: string;
    status: string;
  }>;
  token?: string;
  adminUid?: number;
}

interface VideoKycModalProps {
  open: boolean;
  sessionData: KycSessionData | null;
  onClose: () => void;
  onSessionComplete?: (status: "APPROVED" | "REJECTED") => void;
}

const QUICK_PROMPTS = [
  "📄 Please hold your PAN card flat to the camera",
  "🆔 Please show the FRONT of your Aadhaar card",
  "🔄 Please flip your Aadhaar card to the BACK",
  "🚗 Please show your original Driving License",
  "👁️ Please look directly into the camera and blink",
  "👤 Please remove your cap, glasses, or mask",
  "💡 Please move to a brighter area with better lighting",
];

const REJECTION_REASONS = [
  "Document photo or text is blurry / illegible",
  "Physical document not shown or copy/photocopy presented",
  "Face on video does not match document photo",
  "Name or details do not match submitted application",
  "Expired or invalid document",
  "Driver disconnected or failed liveness check",
  "Tampered or suspicious document",
];

const VideoKycModal: React.FC<VideoKycModalProps> = ({
  open,
  sessionData,
  onClose,
  onSessionComplete,
}) => {
  const [isJoined, setIsJoined] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [rejectRemarks, setRejectRemarks] = useState("");

  // Remote driver video track
  const [remoteUser, setRemoteUser] = useState<IAgoraRTCRemoteUser | null>(null);

  // Agora Client & Track references
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const remoteContainerRef = useRef<HTMLDivElement | null>(null);
  const localContainerRef = useRef<HTMLDivElement | null>(null);

  // Concurrency & Sequence tokens to strictly prevent background calls
  const callSeqRef = useRef<number>(0);
  const isConnectingRef = useRef<boolean>(false);
  const isJoinedRef = useRef<boolean>(false);

  const agoraAppId = import.meta.env.VITE_AGORA_APP_ID || "41cadf2ab272451eb97b6b3915f3e016";

  // Comprehensive Agora cleanup — kills all tracks, hardware access & subscriptions
  const cleanupAgora = async () => {
    // Invalidate any in-flight startCall sequence immediately
    callSeqRef.current++;
    isConnectingRef.current = false;
    isJoinedRef.current = false;

    // 1. Capture and nullify track and client refs immediately
    const audioTrack = localAudioTrackRef.current;
    const videoTrack = localVideoTrackRef.current;
    const client = clientRef.current;

    localAudioTrackRef.current = null;
    localVideoTrackRef.current = null;
    clientRef.current = null;

    // 2. Unpublish from Agora room
    if (client) {
      try {
        const tracksToUnpublish = [audioTrack, videoTrack].filter(Boolean) as (IMicrophoneAudioTrack | ICameraVideoTrack)[];
        if (tracksToUnpublish.length > 0) {
          await client.unpublish(tracksToUnpublish).catch(() => {});
        }
      } catch (_) {}

      try {
        if (client.connectionState === "CONNECTED" || client.connectionState === "CONNECTING") {
          await client.leave().catch(() => {});
        }
      } catch (e) {
        logger.warn("[VideoKycModal] Client leave error:", e);
      }

      try {
        client.removeAllListeners();
      } catch (_) {}
    }

    // 3. Stop and close physical camera & microphone hardware streams
    if (audioTrack) {
      try {
        audioTrack.stop();
        audioTrack.close();
      } catch (e) {
        logger.warn("[VideoKycModal] Audio track close error:", e);
      }
    }

    if (videoTrack) {
      try {
        videoTrack.stop();
        videoTrack.close();
      } catch (e) {
        logger.warn("[VideoKycModal] Video track close error:", e);
      }
    }

    // 4. Stop remote streams
    if (remoteUser?.videoTrack) {
      try { remoteUser.videoTrack.stop(); } catch (_) {}
    }
    if (remoteUser?.audioTrack) {
      try { remoteUser.audioTrack.stop(); } catch (_) {}
    }
    setRemoteUser(null);

    setIsJoined(false);
  };

  // Join Agora Channel with abort checks at every async step
  const startCall = async () => {
    if (!sessionData || !open || isConnectingRef.current || isJoinedRef.current) return;

    const currentCallSeq = ++callSeqRef.current;
    isConnectingRef.current = true;
    setIsSubmitting(true);

    try {
      // Clean up previous client if lingering
      if (clientRef.current) {
        await cleanupAgora();
      }

      if (callSeqRef.current !== currentCallSeq || !open) return;

      // 1. Accept KYC session on backend to get Agora token
      const acceptRes = await axiosIns.post(`/api/kyc/video/accept/${sessionData.sessionId}`);
      const { channelName, adminToken, adminUid } = acceptRes.data?.data || acceptRes.data || {};

      // Aborted if user closed or hung up during network request
      if (callSeqRef.current !== currentCallSeq || !open) return;

      const tokenToUse = adminToken || sessionData.token;
      const channelToUse = channelName || sessionData.channelName;
      // Unique random 6-digit UID prevents UID_CONFLICT
      const uidToUse = adminUid || Math.floor(100000 + Math.random() * 900000);

      // 2. Initialize Agora Client
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      // Listen for remote driver stream
      client.on("user-published", async (user, mediaType) => {
        if (callSeqRef.current !== currentCallSeq) return;
        await client.subscribe(user, mediaType);
        logger.info(`[Agora] Subscribed to remote driver ${user.uid} (${mediaType})`);

        if (mediaType === "video") {
          setRemoteUser(user);
          setTimeout(() => {
            if (remoteContainerRef.current && callSeqRef.current === currentCallSeq) {
              user.videoTrack?.play(remoteContainerRef.current);
            }
          }, 300);
        }
        if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      });

      client.on("user-unpublished", (user, mediaType) => {
        logger.info(`[Agora] Remote driver ${user.uid} unpublished ${mediaType}`);
        if (mediaType === "video") {
          setRemoteUser(null);
        }
      });

      client.on("user-left", (user) => {
        logger.info(`[Agora] Driver ${user.uid} left call`);
        setRemoteUser(null);
        message.warning("Driver disconnected from the video room");
      });

      // Join Agora channel
      await client.join(agoraAppId, channelToUse, tokenToUse, uidToUse);

      // Check if aborted during join
      if (callSeqRef.current !== currentCallSeq || !open) {
        await client.leave().catch(() => {});
        return;
      }

      // Create Admin camera & mic tracks
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      const videoTrack = await AgoraRTC.createCameraVideoTrack({
        encoderConfig: "480p_1",
      });

      // CRITICAL CHECK: Did user click Hang Up / Close while camera permission was prompting?
      if (callSeqRef.current !== currentCallSeq || !open) {
        audioTrack.stop();
        audioTrack.close();
        videoTrack.stop();
        videoTrack.close();
        await client.leave().catch(() => {});
        return;
      }

      localAudioTrackRef.current = audioTrack;
      localVideoTrackRef.current = videoTrack;

      // Play local preview in PiP
      if (localContainerRef.current) {
        videoTrack.play(localContainerRef.current);
      }

      // Publish tracks to channel
      await client.publish([audioTrack, videoTrack]);

      if (callSeqRef.current !== currentCallSeq || !open) {
        await cleanupAgora();
        return;
      }

      isJoinedRef.current = true;
      setIsJoined(true);
      message.success("Connected to Live Video KYC room!");
    } catch (err: any) {
      if (callSeqRef.current === currentCallSeq) {
        logger.error("[VideoKycModal] Failed to join call:", err);
        message.error(err?.response?.data?.message || err.message || "Could not start video call");
        await cleanupAgora();
      }
    } finally {
      if (callSeqRef.current === currentCallSeq) {
        isConnectingRef.current = false;
        setIsSubmitting(false);
      }
    }
  };

  useEffect(() => {
    if (open && sessionData) {
      startCall();
    }
    return () => {
      cleanupAgora();
    };
  }, [open, sessionData?.sessionId]);

  // Handle Hang Up - End call cleanly, notify backend and driver app
  const handleHangUp = async () => {
    try {
      setIsSubmitting(true);
      if (sessionData?.sessionId) {
        // Inform backend and driver that officer ended the session
        await axiosIns.post(`/api/kyc/video/cancel/${sessionData.sessionId}`, {
          driverId: sessionData.driverId,
          action: "HANGUP",
        }).catch((err) => {
          logger.warn("[VideoKycModal] Cancel request failed:", err);
        });
      }
    } finally {
      await cleanupAgora();
      setIsSubmitting(false);
      onClose();
    }
  };

  // Handle Mute Audio
  const toggleAudio = async () => {
    if (localAudioTrackRef.current) {
      const nextState = !isAudioMuted;
      await localAudioTrackRef.current.setEnabled(!nextState);
      setIsAudioMuted(nextState);
    }
  };

  // Handle Mute Video
  const toggleVideo = async () => {
    if (localVideoTrackRef.current) {
      const nextState = !isVideoMuted;
      await localVideoTrackRef.current.setEnabled(!nextState);
      setIsVideoMuted(nextState);
    }
  };

  // Send On-Screen Prompt Instruction to Driver
  const handleSendPrompt = async (text: string) => {
    if (!text.trim() || !sessionData) return;
    try {
      await axiosIns.post(`/api/kyc/video/prompt/${sessionData.sessionId}`, {
        promptText: text.trim(),
      });
      message.info(`Sent instruction: "${text.trim()}"`);
      setCustomPrompt("");
    } catch (err: any) {
      message.error("Failed to send instruction to driver");
    }
  };

  // Submit Approval Verdict
  const handleApprove = async () => {
    if (!sessionData) return;
    try {
      setIsSubmitting(true);
      await axiosIns.post(`/api/kyc/video/verdict/${sessionData.sessionId}`, {
        status: "APPROVED",
        remarks: "Verified via Live Video KYC successfully.",
      });
      message.success("Driver KYC verified and approved successfully!");
      await cleanupAgora();
      onSessionComplete?.("APPROVED");
      onClose();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to approve KYC");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Rejection Verdict
  const handleRejectConfirm = async () => {
    if (!sessionData) return;
    if (selectedReasons.length === 0 && !rejectRemarks.trim()) {
      message.error("Please select at least one rejection reason or provide remarks");
      return;
    }

    try {
      setIsSubmitting(true);
      await axiosIns.post(`/api/kyc/video/verdict/${sessionData.sessionId}`, {
        status: "REJECTED",
        rejectionReasons: selectedReasons,
        remarks: rejectRemarks.trim(),
      });
      message.warning("Driver Video KYC rejected.");
      setRejectModalOpen(false);
      await cleanupAgora();
      onSessionComplete?.("REJECTED");
      onClose();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to submit rejection");
    } finally {
      setIsSubmitting(false);
    }
  };

  const driver = sessionData?.driver;
  const docs = sessionData?.documents || [];

  return (
    <>
      <Modal
        open={open}
        title={
          <div className="flex items-center justify-between pr-8">
            <Space>
              <VideoCameraOutlined className="text-blue-500 text-lg" />
              <Title level={4} style={{ margin: 0 }}>
                Live Video KYC Verification
              </Title>
              <Badge status={isJoined ? "success" : "processing"} text={isJoined ? "LIVE" : "CONNECTING"} />
            </Space>
            {driver && (
              <Tag color="blue" className="text-xs">
                {driver.first_name} {driver.last_name} ({driver.phone_number})
              </Tag>
            )}
          </div>
        }
        width={1200}
        style={{ top: 20 }}
        footer={null}
        onCancel={handleHangUp}
        destroyOnClose
      >
        <div className="flex flex-col gap-4">
          <Row gutter={[16, 16]}>
            {/* LEFT COLUMN: LIVE VIDEO STREAM */}
            <Col xs={24} lg={14}>
              <div className="bg-slate-900 rounded-xl overflow-hidden relative shadow-lg flex flex-col justify-between h-[480px]">
                {/* Remote Driver Video Container - dedicated Agora mount target */}
                <div
                  ref={remoteContainerRef}
                  id="agora-remote-video"
                  className="w-full h-full absolute inset-0 bg-black"
                />

                {/* Waiting Placeholder Overlay - cleanly separated from Agora container */}
                {!remoteUser && (
                  <div className="w-full h-full absolute inset-0 flex items-center justify-center bg-black/90 z-10 pointer-events-none">
                    <div className="text-center text-slate-400 p-6">
                      <div className="animate-pulse mb-3">
                        <VideoCameraOutlined style={{ fontSize: 48, color: "#64748b" }} />
                      </div>
                      <Text className="text-slate-300 font-semibold block text-base">
                        Waiting for Driver to connect camera...
                      </Text>
                      <Text className="text-slate-500 text-xs mt-1 block">
                        Channel: {sessionData?.channelName}
                      </Text>
                    </div>
                  </div>
                )}

                {/* Top Status Overlay */}
                <div className="relative z-10 p-3 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
                  <Space>
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <Text className="text-white text-xs font-medium">Driver Feed (Live)</Text>
                  </Space>
                  <Tag color="cyan" className="m-0 text-xs">
                    Session: {sessionData?.sessionId}
                  </Tag>
                </div>

                {/* PiP Local Admin Video Container */}
                <div className="absolute top-14 right-3 w-36 h-28 bg-slate-800 rounded-lg overflow-hidden border-2 border-white/20 shadow-2xl z-20">
                  <div ref={localContainerRef} id="agora-local-video" className="w-full h-full bg-slate-950" />
                  <div className="absolute bottom-1 left-2 text-[10px] text-white/80 bg-black/50 px-1 rounded">
                    You (Admin)
                  </div>
                </div>

                {/* Bottom Control Bar */}
                <div className="relative z-10 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                  <Space>
                    <Button
                      shape="circle"
                      size="large"
                      type={isAudioMuted ? "default" : "primary"}
                      danger={isAudioMuted}
                      icon={isAudioMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
                      onClick={toggleAudio}
                      title={isAudioMuted ? "Unmute Mic" : "Mute Mic"}
                    />
                    <Button
                      shape="circle"
                      size="large"
                      type={isVideoMuted ? "default" : "primary"}
                      danger={isVideoMuted}
                      icon={<CameraOutlined />}
                      onClick={toggleVideo}
                      title={isVideoMuted ? "Enable Camera" : "Disable Camera"}
                    />
                  </Space>

                  <Space>
                    <Popconfirm
                      title="End Live Verification Call?"
                      description="Are you sure you want to hang up this session?"
                      onConfirm={handleHangUp}
                      okText="Hang Up"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true, loading: isSubmitting }}
                    >
                      <Button danger type="primary" loading={isSubmitting}>
                        Hang Up
                      </Button>
                    </Popconfirm>
                  </Space>
                </div>
              </div>

              {/* Quick Prompts Bar */}
              <div className="mt-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <Text strong className="text-xs text-slate-500 uppercase tracking-wider block mb-2">
                  📢 Send Prompt Instruction to Driver Phone
                </Text>
                <div className="flex flex-wrap gap-1.5 mb-2.5 max-h-24 overflow-y-auto">
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <Button
                      key={idx}
                      size="small"
                      className="text-xs"
                      onClick={() => handleSendPrompt(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    size="small"
                    placeholder="Type custom instruction (e.g. Please hold closer)..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    onPressEnter={() => handleSendPrompt(customPrompt)}
                  />
                  <Button
                    size="small"
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => handleSendPrompt(customPrompt)}
                    disabled={!customPrompt.trim()}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </Col>

            {/* RIGHT COLUMN: DRIVER PROFILE & UPLOADED DOCUMENTS */}
            <Col xs={24} lg={10}>
              <Card
                size="small"
                title={
                  <div className="flex items-center gap-2">
                    <IdcardOutlined className="text-blue-500" />
                    <span>Uploaded Documents & Cross-Check</span>
                  </div>
                }
                className="h-[480px] flex flex-col"
                bodyStyle={{ flex: 1, overflowY: "auto", padding: "12px" }}
              >
                {/* Driver Summary Card */}
                {driver && (
                  <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg mb-3 border border-slate-200 dark:border-slate-700">
                    {driver.profile_pic_url ? (
                      <Image
                        src={driver.profile_pic_url}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {driver.first_name?.[0]}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100">
                        {driver.first_name} {driver.last_name}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <PhoneOutlined /> {driver.phone_number} {driver.city ? `• ${driver.city}` : ""}
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents Tabs */}
                {docs.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <IdcardOutlined style={{ fontSize: 32 }} />
                    <div className="mt-2 text-xs">No uploaded documents found</div>
                  </div>
                ) : (
                  <Tabs
                    size="small"
                    items={docs.map((doc, idx) => ({
                      key: String(doc.id || idx),
                      label: (
                        <span className="capitalize">
                          {doc.document_type.replace(/_/g, " ")}
                        </span>
                      ),
                      children: (
                        <div className="flex flex-col items-center gap-2 pt-1">
                          <div className="w-full h-56 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-700">
                            <Image
                              src={doc.document_url}
                              alt={doc.document_type}
                              style={{ maxHeight: 220, objectFit: "contain" }}
                            />
                          </div>
                          <div className="w-full flex items-center justify-between text-xs px-1">
                            <Text type="secondary">
                              Doc No: <strong className="text-slate-700 dark:text-slate-200">{doc.document_number || "N/A"}</strong>
                            </Text>
                            <Tag color={doc.status === "approved" ? "green" : "orange"} className="m-0">
                              {doc.status}
                            </Tag>
                          </div>
                        </div>
                      ),
                    }))}
                  />
                )}
              </Card>

              {/* ACTION VERDICT BUTTONS */}
              <div className="mt-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <Text strong className="text-xs block text-slate-700 dark:text-slate-200">
                    Verification Verdict
                  </Text>
                  <Text type="secondary" className="text-[11px]">
                    Confirm identity and documents
                  </Text>
                </div>

                <Space>
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => setRejectModalOpen(true)}
                    disabled={isSubmitting}
                  >
                    Reject KYC
                  </Button>
                  <Popconfirm
                    title="Approve Driver Video KYC?"
                    description="This will verify the driver's documents and activate their account."
                    onConfirm={handleApprove}
                    okText="Approve"
                    cancelText="Cancel"
                  >
                    <Button
                      type="primary"
                      className="bg-emerald-600 hover:bg-emerald-500"
                      icon={<CheckCircleOutlined />}
                      loading={isSubmitting}
                    >
                      Approve & Verify
                    </Button>
                  </Popconfirm>
                </Space>
              </div>
            </Col>
          </Row>
        </div>
      </Modal>

      {/* REJECTION REASONS MODAL */}
      <Modal
        open={rejectModalOpen}
        title={
          <Space>
            <CloseCircleOutlined className="text-red-500" />
            <span>Reject Video KYC Verification</span>
          </Space>
        }
        onCancel={() => setRejectModalOpen(false)}
        onOk={handleRejectConfirm}
        okText="Confirm Rejection"
        okButtonProps={{ danger: true, loading: isSubmitting }}
      >
        <div className="flex flex-col gap-3 py-2">
          <Text className="text-xs text-slate-600 dark:text-slate-300">
            Select the issues observed during the live video verification:
          </Text>

          <Checkbox.Group
            value={selectedReasons}
            onChange={(checkedValues) => setSelectedReasons(checkedValues as string[])}
            className="flex flex-col gap-2"
          >
            {REJECTION_REASONS.map((reason, idx) => (
              <Checkbox key={idx} value={reason} className="text-xs">
                {reason}
              </Checkbox>
            ))}
          </Checkbox.Group>

          <div className="mt-2">
            <Text strong className="text-xs text-slate-600 dark:text-slate-300 block mb-1">
              Additional Remarks for Driver:
            </Text>
            <TextArea
              rows={3}
              placeholder="Provide specific notes on what needs to be fixed..."
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default VideoKycModal;
