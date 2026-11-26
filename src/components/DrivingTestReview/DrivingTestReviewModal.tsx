import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Modal,
  Button,
  Tag,
  Radio,
  Input,
  InputNumber,
  Spin,
  message,
  Card,
  Progress,
  Divider,
  Alert,
} from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  VideoCameraOutlined,
  SoundOutlined,
  AudioMutedOutlined,
  WarningOutlined,
  EditOutlined,
} from "@ant-design/icons";
import axiosIns from "../../api/axios";

const { TextArea } = Input;

export interface DrivingTestReviewModalProps {
  open: boolean;
  sessionId: string;
  onClose: () => void;
  onDecisionSubmitted: () => void;
}

interface RecordingItem {
  id?: string;
  segmentIndex?: number;
  durationMs?: number;
  s3Key?: string;
  fileSizeBytes?: number;
  actualFileSizeBytes?: number;
  available?: boolean;
  error?: string;
  playbackUrl?: string | null;
}

interface ScoreBreakdown {
  braking: number;
  acceleration: number;
  turning: number;
  speed: number;
  route: number;
  parking: number;
  signal: number;
}

interface InfractionsCount {
  harshBrakes: number;
  rapidAccels: number;
  overspeeds: number;
  signalViolations: number;
}

interface FlaggedEvent {
  timestamp: number;
  event?: string;
  speedKmh?: number;
}

interface TelemetryPoint {
  timestamp?: number;
  speedKmh?: number;
  lat?: number;
  lng?: number;
}

type ReviewDecision = "APPROVED" | "REJECTED" | "RETEST_REQUESTED";
type SessionDecision = ReviewDecision | "PENDING";

interface SessionReportData {
  id?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  t2driver?: string;
  started_at?: string;
  total_duration_seconds?: number;
  drive_score?: number | null;
  score_override?: number | null;
  auto_verdict?: string | null;
  admin_decision?: SessionDecision | string | null;
  admin_notes?: string | null;
  notes?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  reviewed_by_name?: string | null;
  attempt_number?: number | null;
  is_retest?: boolean;
  simultaneous_camera_supported?: boolean;
  score_breakdown?: Partial<ScoreBreakdown> | string | null;
  infractions_count?: Partial<InfractionsCount> | string | null;
}

const getStatusBadgeProps = (
  rawDecision?: string | null
): { color: string; label: string } => {
  switch (rawDecision) {
    case "APPROVED":
      return { color: "success", label: "Approved" };
    case "RETEST_REQUESTED":
      return { color: "warning", label: "Retest Requested" };
    case "REJECTED":
      return { color: "error", label: "Rejected" };
    case "PENDING":
    case "PENDING_REVIEW":
    default:
      return { color: "processing", label: "Pending Verification" };
  }
};

const formatDateTime = (iso?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const DrivingTestReviewModal: React.FC<DrivingTestReviewModalProps> = ({
  open,
  sessionId,
  onClose,
  onDecisionSubmitted,
}) => {
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<SessionReportData | null>(null);
  const [mediaData, setMediaData] = useState<{
    frontVideos?: RecordingItem[];
    rearVideos?: RecordingItem[];
    totalSegments?: number;
  } | null>(null);
  const [scrubberData, setScrubberData] = useState<TelemetryPoint[]>([]);
  const [flaggedEvents, setFlaggedEvents] = useState<FlaggedEvent[]>([]);

  // Video Sync Playback Controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [totalDurationSec, setTotalDurationSec] = useState(0);
  const [rearSegmentIdx, setRearSegmentIdx] = useState(0);
  const [frontSegmentIdx, setFrontSegmentIdx] = useState(0);
  const [rearVideoError, setRearVideoError] = useState<string | null>(null);
  const [frontVideoError, setFrontVideoError] = useState<string | null>(null);
  const [rearResolution, setRearResolution] = useState<string>("Road View");
  const [frontResolution, setFrontResolution] = useState<string>("Cabin View");

  const frontVideoRef = useRef<HTMLVideoElement>(null);
  const rearVideoRef = useRef<HTMLVideoElement>(null);

  // Decision Form State
  const [decision, setDecision] = useState<ReviewDecision>("APPROVED");
  const [notes, setNotes] = useState("");
  const [scoreOverride, setScoreOverride] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [isEditingDecision, setIsEditingDecision] = useState(false);

  const playableRearVideos = useMemo(
    () => (mediaData?.rearVideos || []).filter((v) => v.available !== false && Boolean(v.playbackUrl)),
    [mediaData]
  );

  const playableFrontVideos = useMemo(
    () => (mediaData?.frontVideos || []).filter((v) => v.available !== false && Boolean(v.playbackUrl)),
    [mediaData]
  );

  const activeRearVideo = playableRearVideos[rearSegmentIdx] || null;
  const activeFrontVideo = playableFrontVideos[frontSegmentIdx] || null;
  const activeRearUrl = activeRearVideo?.playbackUrl || null;
  const activeFrontUrl = activeFrontVideo?.playbackUrl || null;

  const hasPlayableRear = Boolean(activeRearUrl && !rearVideoError);
  const hasPlayableFront = Boolean(activeFrontUrl && !frontVideoError);
  const primaryDriver: "rear" | "front" | null = hasPlayableRear
    ? "rear"
    : hasPlayableFront
      ? "front"
      : null;

  const fetchSessionReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosIns.get(`/api/admin/driving-tests/admin/sessions/${sessionId}/report`);
      if (res.data?.success) {
        const session: SessionReportData = res.data.session || {};
        setSessionData(session);
        setMediaData(res.data.media || null);
        setScrubberData(res.data.scrubber?.telemetry || []);
        setFlaggedEvents(res.data.scrubber?.flaggedEvents || []);

        if (session.total_duration_seconds) {
          setTotalDurationSec(session.total_duration_seconds);
        }

        const effectiveScore = session.score_override ?? session.drive_score;
        setScoreOverride(effectiveScore != null ? effectiveScore : undefined);

        const existingDecision = session.admin_decision || "PENDING";
        if (
          existingDecision === "APPROVED" ||
          existingDecision === "RETEST_REQUESTED" ||
          existingDecision === "REJECTED"
        ) {
          setDecision(existingDecision);
          setIsEditingDecision(false);
        } else {
          setDecision("APPROVED");
          setIsEditingDecision(true);
        }
        setNotes(session.admin_notes || session.notes || "");
      }
    } catch (err) {
      console.error("Failed to load session report:", err);
      message.error("Could not load driving test recordings & report.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (open && sessionId) {
      setIsPlaying(false);
      setCurrentTimeSec(0);
      setTotalDurationSec(0);
      setRearSegmentIdx(0);
      setFrontSegmentIdx(0);
      setRearVideoError(null);
      setFrontVideoError(null);
      setRearResolution("Road View");
      setFrontResolution("Cabin View");
      setSessionData(null);
      setNotes("");
      setScoreOverride(undefined);
      setDecision("APPROVED");
      setIsEditingDecision(false);
      fetchSessionReport();
    } else if (!open) {
      frontVideoRef.current?.pause();
      rearVideoRef.current?.pause();
      setIsPlaying(false);
    }
  }, [open, sessionId, fetchSessionReport]);

  // Continue playback seamlessly when advancing across multi-part video segments
  useEffect(() => {
    if (!isPlaying) return;
    if (hasPlayableRear && rearVideoRef.current?.paused) {
      rearVideoRef.current.play().catch(() => {});
    }
    if (hasPlayableFront && frontVideoRef.current?.paused) {
      frontVideoRef.current.play().catch(() => {});
    }
  }, [activeRearUrl, activeFrontUrl, isPlaying, hasPlayableRear, hasPlayableFront]);

  // Synchronized Play / Pause
  const togglePlayPause = () => {
    if (!hasPlayableRear && !hasPlayableFront) {
      return;
    }

    if (isPlaying) {
      frontVideoRef.current?.pause();
      rearVideoRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    const promises: Promise<void>[] = [];
    if (hasPlayableRear && rearVideoRef.current) {
      promises.push(rearVideoRef.current.play());
    }
    if (hasPlayableFront && frontVideoRef.current) {
      promises.push(frontVideoRef.current.play());
    }

    Promise.allSettled(promises).then((results) => {
      const anyPlaying = results.some((r) => r.status === "fulfilled");
      setIsPlaying(anyPlaying);
      if (!anyPlaying) {
        message.warning("Unable to start video playback. Try reloading recordings.");
      }
    });
  };

  const handleCameraEnded = (camera: "rear" | "front") => {
    if (camera === "rear" && rearSegmentIdx < playableRearVideos.length - 1) {
      setRearSegmentIdx((i) => i + 1);
      if (frontSegmentIdx < playableFrontVideos.length - 1) {
        setFrontSegmentIdx((i) => i + 1);
      }
      return;
    }
    if (
      camera === "front" &&
      primaryDriver === "front" &&
      frontSegmentIdx < playableFrontVideos.length - 1
    ) {
      setFrontSegmentIdx((i) => i + 1);
      return;
    }

    if (camera === primaryDriver) {
      setIsPlaying(false);
      if (rearVideoRef.current) rearVideoRef.current.currentTime = 0;
      if (frontVideoRef.current) frontVideoRef.current.currentTime = 0;
      setCurrentTimeSec(0);
    }
  };

  // Video Time Update Sync driven by whichever camera is primary
  const handleTimeUpdate = (source: "rear" | "front") => {
    if (source !== primaryDriver) return;
    const primaryEl = source === "rear" ? rearVideoRef.current : frontVideoRef.current;
    const secondaryEl = source === "rear" ? frontVideoRef.current : rearVideoRef.current;
    const secondaryReady = source === "rear" ? hasPlayableFront : hasPlayableRear;

    if (!primaryEl) return;
    const cur = primaryEl.currentTime;
    setCurrentTimeSec(cur);

    if (secondaryReady && secondaryEl && !secondaryEl.ended) {
      if (Math.abs(secondaryEl.currentTime - cur) > 0.3) {
        const target =
          secondaryEl.duration && !isNaN(secondaryEl.duration)
            ? Math.min(cur, secondaryEl.duration)
            : cur;
        secondaryEl.currentTime = target;
      }
    }
  };

  const handleMetadataLoaded = (source: "rear" | "front", el: HTMLVideoElement) => {
    if (el.videoWidth && el.videoHeight) {
      const label = `${el.videoWidth}x${el.videoHeight}`;
      if (source === "rear") setRearResolution(label);
      else setFrontResolution(label);
    }

    if (source === primaryDriver || totalDurationSec === 0 || totalDurationSec === 900) {
      const dur = el.duration;
      if (dur && !isNaN(dur) && isFinite(dur) && dur > 0) {
        setTotalDurationSec(dur);
      }
    }
  };

  // Timeline Scrubber Seek
  const handleSeek = (newTime: number) => {
    setCurrentTimeSec(newTime);
    if (rearVideoRef.current && hasPlayableRear) {
      const d = rearVideoRef.current.duration;
      rearVideoRef.current.currentTime = d && isFinite(d) ? Math.min(newTime, d) : newTime;
    }
    if (frontVideoRef.current && hasPlayableFront) {
      const d = frontVideoRef.current.duration;
      frontVideoRef.current.currentTime = d && isFinite(d) ? Math.min(newTime, d) : newTime;
    }
  };

  const handleDecisionSubmit = async () => {
    if (!notes.trim() || notes.trim().length < 5) {
      message.warning("Please provide detailed review remarks for the audit trail.");
      return;
    }

    setSubmitting(true);
    try {
      await axiosIns.post(`/api/admin/driving-tests/admin/sessions/${sessionId}/decision`, {
        decision,
        notes: notes.trim(),
        scoreOverride,
      });

      message.success(`Driving test successfully ${decision.toLowerCase().replace(/_/g, " ")}!`);
      onDecisionSubmitted();
      onClose();
    } catch (err: unknown) {
      console.error("Decision submission error:", err);
      const apiMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      message.error(apiMsg || "Failed to submit decision.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const safeSec = Math.max(0, sec || 0);
    const m = Math.floor(safeSec / 60);
    const s = Math.floor(safeSec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return "";
    if (bytes < 1024 * 1024) return `• ${(bytes / 1024).toFixed(0)} KB`;
    return `• ${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const rawBreakdown = (() => {
    if (!sessionData?.score_breakdown) return null;
    if (typeof sessionData.score_breakdown === "string") {
      try {
        return JSON.parse(sessionData.score_breakdown) as Partial<ScoreBreakdown>;
      } catch {
        return null;
      }
    }
    return sessionData.score_breakdown;
  })();

  const scoreBreakdown: ScoreBreakdown = {
    braking: rawBreakdown?.braking ?? 0,
    acceleration: rawBreakdown?.acceleration ?? 0,
    turning: rawBreakdown?.turning ?? 0,
    speed: rawBreakdown?.speed ?? 0,
    route: rawBreakdown?.route ?? 0,
    parking: rawBreakdown?.parking ?? 0,
    signal: rawBreakdown?.signal ?? 0,
  };

  const rawInfractions = (() => {
    if (!sessionData?.infractions_count) return null;
    if (typeof sessionData.infractions_count === "string") {
      try {
        return JSON.parse(sessionData.infractions_count) as Partial<InfractionsCount>;
      } catch {
        return null;
      }
    }
    return sessionData.infractions_count;
  })();

  const infractions: InfractionsCount = {
    harshBrakes: rawInfractions?.harshBrakes ?? 0,
    rapidAccels: rawInfractions?.rapidAccels ?? 0,
    overspeeds: rawInfractions?.overspeeds ?? 0,
    signalViolations: rawInfractions?.signalViolations ?? 0,
  };

  const rearMissingReason =
    mediaData?.rearVideos?.[0]?.error || "No Rear Camera recording uploaded for this session";
  const frontMissingReason =
    mediaData?.frontVideos?.[0]?.error || "No Front Camera recording uploaded for this session";

  const currentDecision = sessionData?.admin_decision || "PENDING";
  const isPending = currentDecision === "PENDING" || currentDecision === "PENDING_REVIEW";
  const isRetestRequested = currentDecision === "RETEST_REQUESTED";
  const isApproved = currentDecision === "APPROVED";
  const statusBadge = getStatusBadgeProps(currentDecision);
  const existingRemarks = sessionData?.admin_notes || sessionData?.notes;

  return (
    <Modal
      title={
        <div className="flex items-center justify-between pr-8 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <VideoCameraOutlined className="text-blue-600 text-lg" />
            <span className="font-semibold text-base">
              Driving Assessment Review: Session #{sessionId?.substring(0, 8)}
            </span>
            {(sessionData?.is_retest || (sessionData?.attempt_number ?? 1) > 1) && (
              <Tag color="purple" className="m-0">
                {sessionData?.attempt_number ? `Retest #${sessionData.attempt_number}` : "Retest"}
              </Tag>
            )}
          </div>
          {sessionData?.drive_score != null && (
            <Tag
              color={
                sessionData.drive_score >= 80
                  ? "success"
                  : sessionData.drive_score >= 60
                    ? "warning"
                    : "error"
              }
              className="text-sm px-3 py-1 font-bold m-0"
            >
              Auto Score: {sessionData.drive_score} / 100
            </Tag>
          )}
        </div>
      }
      open={open}
      onCancel={onClose}
      width={1100}
      footer={null}
      destroyOnClose
    >
      {loading ? (
        <div className="p-12 text-center">
          <Spin size="large" />
          <div className="mt-4 text-gray-500">Loading synchronized recordings & telemetry...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* TOP DRIVER & SESSION INFO */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-slate-800/60 p-3 rounded-lg border border-gray-200 dark:border-slate-700 text-xs">
            <div>
              <span className="text-gray-500 dark:text-slate-400 block">Driver Name</span>
              <span className="font-medium text-gray-900 dark:text-slate-100">
                {[sessionData?.first_name, sessionData?.last_name].filter(Boolean).join(" ") ||
                  "Driver"}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-slate-400 block">Contact Phone</span>
              <span className="font-medium text-gray-900 dark:text-slate-100">
                {sessionData?.phone_number || "—"}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-slate-400 block">Hardware Concurrency</span>
              <span className="font-medium text-gray-900 dark:text-slate-100">
                {sessionData?.simultaneous_camera_supported ? (
                  <Tag color="green">Hardware Dual Cam</Tag>
                ) : (
                  <Tag color="orange">Single Cam Mode</Tag>
                )}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-slate-400 block">Current Status</span>
              <Tag color={statusBadge.color} className="mt-0.5 font-medium">
                {statusBadge.label}
              </Tag>
            </div>
          </div>

          {/* DUAL SYNCHRONIZED VIDEO PLAYERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* REAR CAMERA (ROAD VIEW) */}
            <div className="bg-black rounded-lg overflow-hidden border border-gray-300 dark:border-slate-700">
              <div className="bg-gray-800 text-white text-xs px-3 py-1.5 flex justify-between items-center">
                <span className="font-semibold flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      hasPlayableRear ? "bg-red-500 animate-pulse" : "bg-gray-500"
                    }`}
                  ></span>
                  REAR CAMERA (Road View)
                </span>
                <span className="text-gray-400">
                  {rearResolution}{" "}
                  {formatBytes(activeRearVideo?.actualFileSizeBytes || activeRearVideo?.fileSizeBytes)}
                </span>
              </div>
              <div
                className="aspect-video bg-neutral-900 flex items-center justify-center relative cursor-pointer group"
                onClick={hasPlayableRear ? togglePlayPause : undefined}
              >
                {activeRearUrl && !rearVideoError ? (
                  <>
                    <video
                      key={activeRearUrl}
                      ref={rearVideoRef}
                      className="w-full h-full object-contain bg-black"
                      src={activeRearUrl}
                      preload="metadata"
                      onTimeUpdate={() => handleTimeUpdate("rear")}
                      onEnded={() => handleCameraEnded("rear")}
                      onLoadedMetadata={(e) => handleMetadataLoaded("rear", e.currentTarget)}
                      onError={() => {
                        setRearVideoError("Unable to stream recorded rear video from storage.");
                        setIsPlaying(false);
                      }}
                      muted={isMuted}
                      playsInline
                    />
                    {!isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/35 group-hover:bg-black/15 transition-all pointer-events-none">
                        <PlayCircleOutlined className="text-5xl text-white/90 drop-shadow-lg" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-6 text-center text-gray-400 flex flex-col items-center gap-2">
                    <WarningOutlined className="text-2xl text-amber-400" />
                    <span className="text-xs">{rearVideoError || rearMissingReason}</span>
                    {activeRearUrl && (
                      <Button
                        size="small"
                        onClick={() => {
                          setRearVideoError(null);
                          fetchSessionReport();
                        }}
                      >
                        Reload Video
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {playableRearVideos.length > 1 && (
                <div className="bg-gray-900 px-3 py-1 flex items-center gap-1.5 flex-wrap border-t border-gray-800">
                  <span className="text-[11px] text-gray-400">Segments:</span>
                  {playableRearVideos.map((_, idx) => (
                    <Tag
                      key={idx}
                      color={rearSegmentIdx === idx ? "blue" : "default"}
                      className="cursor-pointer m-0 text-[11px]"
                      onClick={() => setRearSegmentIdx(idx)}
                    >
                      Part {idx + 1}
                    </Tag>
                  ))}
                </div>
              )}
            </div>

            {/* FRONT CAMERA (CABIN VIEW) */}
            <div className="bg-black rounded-lg overflow-hidden border border-gray-300 dark:border-slate-700">
              <div className="bg-gray-800 text-white text-xs px-3 py-1.5 flex justify-between items-center">
                <span className="font-semibold flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      hasPlayableFront ? "bg-red-500 animate-pulse" : "bg-gray-500"
                    }`}
                  ></span>
                  FRONT CAMERA (Driver Cabin)
                </span>
                <span className="text-gray-400">
                  {frontResolution}{" "}
                  {formatBytes(activeFrontVideo?.actualFileSizeBytes || activeFrontVideo?.fileSizeBytes)}
                </span>
              </div>
              <div
                className="aspect-video bg-neutral-900 flex items-center justify-center relative cursor-pointer group"
                onClick={hasPlayableFront ? togglePlayPause : undefined}
              >
                {activeFrontUrl && !frontVideoError ? (
                  <>
                    <video
                      key={activeFrontUrl}
                      ref={frontVideoRef}
                      className="w-full h-full object-contain bg-black"
                      src={activeFrontUrl}
                      preload="metadata"
                      onTimeUpdate={() => handleTimeUpdate("front")}
                      onEnded={() => handleCameraEnded("front")}
                      onLoadedMetadata={(e) => handleMetadataLoaded("front", e.currentTarget)}
                      onError={() => {
                        setFrontVideoError("Unable to stream recorded cabin video from storage.");
                      }}
                      muted={isMuted}
                      playsInline
                    />
                    {!isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/35 group-hover:bg-black/15 transition-all pointer-events-none">
                        <PlayCircleOutlined className="text-5xl text-white/90 drop-shadow-lg" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-6 text-center text-gray-400 flex flex-col items-center gap-2">
                    <WarningOutlined className="text-2xl text-amber-400" />
                    <span className="text-xs">{frontVideoError || frontMissingReason}</span>
                    {activeFrontUrl && (
                      <Button
                        size="small"
                        onClick={() => {
                          setFrontVideoError(null);
                          fetchSessionReport();
                        }}
                      >
                        Reload Video
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {playableFrontVideos.length > 1 && (
                <div className="bg-gray-900 px-3 py-1 flex items-center gap-1.5 flex-wrap border-t border-gray-800">
                  <span className="text-[11px] text-gray-400">Segments:</span>
                  {playableFrontVideos.map((_, idx) => (
                    <Tag
                      key={idx}
                      color={frontSegmentIdx === idx ? "blue" : "default"}
                      className="cursor-pointer m-0 text-[11px]"
                      onClick={() => setFrontSegmentIdx(idx)}
                    >
                      Part {idx + 1}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SYNCHRONIZED SCRUBBER TIMELINE */}
          <div className="bg-gray-900 text-white p-3 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Button
                  type="text"
                  disabled={!hasPlayableRear && !hasPlayableFront}
                  icon={
                    isPlaying ? (
                      <PauseCircleOutlined className="text-2xl text-blue-400" />
                    ) : (
                      <PlayCircleOutlined className="text-2xl text-blue-400" />
                    )
                  }
                  onClick={togglePlayPause}
                  className="p-0 hover:bg-transparent"
                />
                <Button
                  type="text"
                  icon={
                    isMuted ? (
                      <AudioMutedOutlined className="text-base text-gray-400" />
                    ) : (
                      <SoundOutlined className="text-base text-blue-400" />
                    )
                  }
                  onClick={() => setIsMuted((m) => !m)}
                  title={isMuted ? "Unmute Video" : "Mute Video"}
                  className="p-0 hover:bg-transparent"
                />
                <span className="font-mono text-sm">
                  {formatSeconds(currentTimeSec)} / {formatSeconds(totalDurationSec)}
                </span>
                {scrubberData.length > 0 && (
                  <span className="text-xs text-gray-400">
                    • {scrubberData.length} telemetry points
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">Flagged Events:</span>
                {flaggedEvents.length > 0 ? (
                  flaggedEvents.map((ev, i) => {
                    const startMs = sessionData?.started_at
                      ? new Date(sessionData.started_at).getTime()
                      : 0;
                    const safeDur = Math.max(1, totalDurationSec);
                    const relSec =
                      startMs && ev.timestamp > startMs
                        ? Math.min(safeDur, Math.floor((ev.timestamp - startMs) / 1000))
                        : Math.min(safeDur, (i + 1) * 5);
                    const isHarsh = ev.event?.includes("BRAKE") || ev.event?.includes("SIGNAL");
                    return (
                      <Tag
                        key={i}
                        color={isHarsh ? "error" : "warning"}
                        className="cursor-pointer"
                        onClick={() => handleSeek(relSec)}
                      >
                        {formatSeconds(relSec)} {ev.event?.replace(/_/g, " ")}{" "}
                        {ev.speedKmh ? `(${Math.round(ev.speedKmh)} km/h)` : ""}
                      </Tag>
                    );
                  })
                ) : (
                  <Tag color="success">✓ Zero Infractions Detected</Tag>
                )}
              </div>
            </div>

            {/* Slider bar */}
            <input
              type="range"
              min={0}
              max={Math.max(1, totalDurationSec)}
              step={0.1}
              value={Math.min(currentTimeSec, Math.max(1, totalDurationSec))}
              disabled={!hasPlayableRear && !hasPlayableFront}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* SCORE BREAKDOWN & SENSOR AUDIT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              title="Score Breakdown (100 Max)"
              size="small"
              className="md:col-span-2"
              extra={
                !rawBreakdown ? (
                  <span className="text-xs text-gray-400">Breakdown unavailable</span>
                ) : null
              }
            >
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Braking Control</span>
                    <span className="font-semibold">{scoreBreakdown.braking} / 15</span>
                  </div>
                  <Progress
                    percent={(scoreBreakdown.braking / 15) * 100}
                    size="small"
                    status={isPending ? "active" : "normal"}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Acceleration Smoothness</span>
                    <span className="font-semibold">{scoreBreakdown.acceleration} / 10</span>
                  </div>
                  <Progress percent={(scoreBreakdown.acceleration / 10) * 100} size="small" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Turning & Lane Discipline</span>
                    <span className="font-semibold">{scoreBreakdown.turning} / 15</span>
                  </div>
                  <Progress percent={(scoreBreakdown.turning / 15) * 100} size="small" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Speed Limit Adherence</span>
                    <span className="font-semibold">{scoreBreakdown.speed} / 15</span>
                  </div>
                  <Progress percent={(scoreBreakdown.speed / 15) * 100} size="small" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Route & Waypoint Compliance</span>
                    <span className="font-semibold">{scoreBreakdown.route} / 15</span>
                  </div>
                  <Progress percent={(scoreBreakdown.route / 15) * 100} size="small" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Reverse Parking Test</span>
                    <span className="font-semibold">{scoreBreakdown.parking} / 15</span>
                  </div>
                  <Progress percent={(scoreBreakdown.parking / 15) * 100} size="small" />
                </div>
                <div className="col-span-2">
                  <div className="flex justify-between mb-1">
                    <span>Traffic Signal Stop Line Discipline</span>
                    <span className="font-semibold">{scoreBreakdown.signal} / 15</span>
                  </div>
                  <Progress percent={(scoreBreakdown.signal / 15) * 100} size="small" />
                </div>
              </div>
            </Card>

            <Card title="Sensor Infractions Log" size="small">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-1.5 bg-red-50 dark:bg-red-950/30 rounded">
                  <span className="text-red-700 dark:text-red-300 font-medium">
                    Harsh Braking Events:
                  </span>
                  <Tag color="red">{infractions.harshBrakes}</Tag>
                </div>
                <div className="flex justify-between items-center p-1.5 bg-yellow-50 dark:bg-yellow-950/30 rounded">
                  <span className="text-yellow-700 dark:text-yellow-300 font-medium">
                    Speed Limit Violations:
                  </span>
                  <Tag color="gold">{infractions.overspeeds}</Tag>
                </div>
                <div className="flex justify-between items-center p-1.5 bg-orange-50 dark:bg-orange-950/30 rounded">
                  <span className="text-orange-700 dark:text-orange-300 font-medium">
                    Rapid Accelerations:
                  </span>
                  <Tag color="orange">{infractions.rapidAccels}</Tag>
                </div>
                <div className="flex justify-between items-center p-1.5 bg-green-50 dark:bg-green-950/30 rounded">
                  <span className="text-green-700 dark:text-green-300 font-medium">
                    Signal Stop Line Breaches:
                  </span>
                  <Tag color="green">{infractions.signalViolations}</Tag>
                </div>
              </div>
            </Card>
          </div>

          <Divider className="my-2" />

          {/* STATUS-AWARE AUDIT / DECISION SECTION */}
          {!isPending && !isEditingDecision ? (
            <div
              className={`p-4 rounded-lg border ${
                isApproved
                  ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                  : isRetestRequested
                    ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                    : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
              }`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100 text-sm m-0 flex items-center gap-2">
                    <span>
                      {isApproved
                        ? "Approved Clearance Record"
                        : isRetestRequested
                          ? "Retest Assessment Request"
                          : "Rejection Audit Record"}
                    </span>
                    <Tag color={statusBadge.color} className="m-0">
                      {statusBadge.label}
                    </Tag>
                  </h4>
                  {isRetestRequested && (
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 mb-0">
                      This driver was requested to retake the driving test. Any newly submitted
                      attempt appears under Pending Verification.
                    </p>
                  )}
                </div>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => setIsEditingDecision(true)}
                >
                  {isRetestRequested ? "Override Decision" : "Amend Decision"}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
                <div>
                  <span className="text-gray-500 dark:text-slate-400 block">Final Score</span>
                  <span className="font-semibold text-gray-900 dark:text-slate-100">
                    {sessionData?.score_override ?? sessionData?.drive_score ?? "—"} / 100
                    {sessionData?.score_override != null &&
                      sessionData?.drive_score != null &&
                      sessionData.score_override !== sessionData.drive_score && (
                        <span className="text-gray-500 font-normal ml-1">
                          (Auto: {sessionData.drive_score})
                        </span>
                      )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400 block">Reviewed By</span>
                  <span className="font-semibold text-gray-900 dark:text-slate-100">
                    {sessionData?.reviewed_by_name || sessionData?.reviewed_by || "Admin"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400 block">Reviewed At</span>
                  <span className="font-semibold text-gray-900 dark:text-slate-100">
                    {formatDateTime(sessionData?.reviewed_at)}
                  </span>
                </div>
              </div>

              <div className="text-xs bg-white/80 dark:bg-slate-900/60 p-3 rounded border border-gray-200 dark:border-slate-700">
                <span className="text-gray-500 dark:text-slate-400 block mb-1 font-medium">
                  Audit Review Remarks
                </span>
                <p className="text-gray-800 dark:text-slate-200 m-0 whitespace-pre-wrap">
                  {existingRemarks || "No remarks recorded."}
                </p>
              </div>

              <div className="flex justify-end mt-3">
                <Button onClick={onClose} size="middle">
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-slate-800/70 p-4 rounded-lg border border-blue-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-slate-100 text-sm m-0">
                  Admin Final Decision & Clearance
                </h4>
                {!isPending && (
                  <Button size="small" onClick={() => setIsEditingDecision(false)}>
                    Cancel Override
                  </Button>
                )}
              </div>

              {!isPending && (
                <Alert
                  type="warning"
                  showIcon
                  className="mb-3 text-xs"
                  message={`You are modifying an existing "${statusBadge.label}" decision. Submitting will overwrite the current audit status.`}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Clearance Decision
                  </label>
                  <Radio.Group
                    value={decision}
                    onChange={(e) => setDecision(e.target.value as ReviewDecision)}
                    buttonStyle="solid"
                  >
                    <Radio.Button value="APPROVED" className="text-xs">
                      <CheckCircleOutlined className="mr-1" /> Approve Driver
                    </Radio.Button>
                    <Radio.Button value="RETEST_REQUESTED" className="text-xs">
                      <ReloadOutlined className="mr-1" /> Request Retest
                    </Radio.Button>
                    <Radio.Button value="REJECTED" className="text-xs">
                      <CloseCircleOutlined className="mr-1" /> Reject
                    </Radio.Button>
                  </Radio.Group>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Score Override (Optional)
                  </label>
                  <InputNumber
                    min={0}
                    max={100}
                    value={scoreOverride}
                    onChange={(val) => setScoreOverride(val ?? undefined)}
                    className="w-32 text-xs"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Audit Review Remarks <span className="text-red-500">*</span>
                </label>
                <TextArea
                  rows={2}
                  placeholder="State reason for approval, retest requirement, or score adjustments..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button onClick={onClose} size="middle">
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={handleDecisionSubmit}
                  loading={submitting}
                  className={decision === "APPROVED" ? "bg-green-600 hover:bg-green-700" : ""}
                  size="middle"
                >
                  Submit Decision & Update Driver Status
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default DrivingTestReviewModal;
