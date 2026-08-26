"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  FileText,
  Headphones,
  Lock,
  LoaderCircle,
  Mic,
  Mic2,
  MonitorUp,
  RotateCcw,
  Square,
  Video,
} from "lucide-react";
import { hasFeature, type PlanId } from "@/lib/billing/plans";
import { PremiumBadge, UpgradeModal } from "@/components/app/upgrade-modal";
import { showAppToast } from "@/lib/client-toast";
import { createClient } from "@/lib/supabase/client";

type Role = { id: string; name: string };
type InitialCapture = {
  title: string;
  description: string;
  coachingPrompt: string;
  recommendationId: string;
};
const textStages = [
  "Reading your explanation",
  "Finding steps and rules",
  "Preparing your process",
];

export function CaptureProcess({
  roles,
  initial,
  returnTo,
  plan,
}: {
  roles: Role[];
  initial?: InitialCapture;
  returnTo: string;
  plan: PlanId;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const secondaryStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const discardRecordingRef = useRef(false);
  const [mode, setMode] = useState<
    "text" | "voice" | "audio" | "video" | "screen"
  >("text");
  const [file, setFile] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    roleId: "",
    explanation: "",
  });
  const [working, setWorking] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const [retryJob, setRetryJob] = useState<{
    processId: string;
    mediaId: string;
    isVideo: boolean;
  } | null>(null);
  const mediaStages = [
    "Uploading recording",
    ...(file?.type.startsWith("video/") ? ["Extracting audio"] : []),
    "Transcribing recording",
    ...(file?.type.startsWith("video/")
      ? ["Understanding the visual workflow"]
      : []),
    "Finding steps and rules",
    "Preparing your process",
  ];
  const stages = mode === "text" ? textStages : mediaStages;

  useEffect(() => {
    return () => releaseRecorder();
  }, []);

  function releaseRecorder() {
    if (recordingTimerRef.current)
      window.clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    secondaryStreamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    secondaryStreamRef.current = null;
  }

  function changeMode(
    nextMode: "text" | "voice" | "audio" | "video" | "screen",
  ) {
    if (
      (nextMode === "video" && !hasFeature(plan, "videoLearning")) ||
      (nextMode === "screen" && !hasFeature(plan, "screenRecording"))
    ) {
      setUpgradeOpen(true);
      return;
    }
    if (recording) cancelVoiceRecording();
    setMode(nextMode);
    setError("");
    setRetryJob(null);
    setFile(null);
    setRecordingSeconds(0);
  }

  async function startVoiceRecording() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError(
        "Voice recording isn't supported in this browser. Upload an audio recording instead.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/webm",
      ];
      const selectedType = preferredTypes.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      const recorder = new MediaRecorder(
        stream,
        selectedType ? { mimeType: selectedType } : undefined,
      );
      streamRef.current = stream;
      recorderRef.current = recorder;
      recordingChunksRef.current = [];
      discardRecordingRef.current = false;
      setFile(null);
      setRecordingSeconds(0);
      recorder.ondataavailable = (event) => {
        if (event.data.size) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const chunks = recordingChunksRef.current;
        const discard = discardRecordingRef.current;
        releaseRecorder();
        setRecording(false);
        if (discard || !chunks.length) return;
        const mimeType = recorder.mimeType.split(";")[0] || "audio/webm";
        const extension = mimeType === "audio/mp4" ? "m4a" : "webm";
        const blob = new Blob(chunks, { type: mimeType });
        setFile(
          new File([blob], `voice-explanation.${extension}`, {
            type: mimeType,
            lastModified: Date.now(),
          }),
        );
      };
      recorder.onerror = () => {
        releaseRecorder();
        setRecording(false);
        setError("Opryn couldn't finish this recording. Please try again.");
      };
      recorder.start(250);
      setRecording(true);
      recordingTimerRef.current = window.setInterval(
        () => setRecordingSeconds((seconds) => seconds + 1),
        1000,
      );
    } catch {
      releaseRecorder();
      setError(
        "Microphone access was blocked. Allow microphone access, then try again.",
      );
    }
  }

  async function startScreenRecording() {
    setError("");
    if (!navigator.mediaDevices?.getDisplayMedia || !window.MediaRecorder) {
      setError(
        "Screen recording isn't supported in this browser. Upload a video instead.",
      );
      return;
    }
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      let microphone: MediaStream | null = null;
      if (!display.getAudioTracks().length) {
        microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      streamRef.current = display;
      secondaryStreamRef.current = microphone;
      const combined = new MediaStream([
        ...display.getVideoTracks(),
        ...(display.getAudioTracks().length
          ? display.getAudioTracks()
          : (microphone?.getAudioTracks() ?? [])),
      ]);
      const preferredTypes = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/mp4",
        "video/webm",
      ];
      const selectedType = preferredTypes.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      const recorder = new MediaRecorder(
        combined,
        selectedType ? { mimeType: selectedType } : undefined,
      );
      recorderRef.current = recorder;
      recordingChunksRef.current = [];
      discardRecordingRef.current = false;
      setFile(null);
      setRecordingSeconds(0);
      recorder.ondataavailable = (event) => {
        if (event.data.size) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const chunks = recordingChunksRef.current;
        const discard = discardRecordingRef.current;
        releaseRecorder();
        setRecording(false);
        if (discard || !chunks.length) return;
        const mimeType = recorder.mimeType.split(";")[0] || "video/webm";
        const extension = mimeType === "video/mp4" ? "mp4" : "webm";
        setFile(
          new File(chunks, `screen-workflow.${extension}`, {
            type: mimeType,
            lastModified: Date.now(),
          }),
        );
      };
      recorder.onerror = () => {
        releaseRecorder();
        setRecording(false);
        setError("Opryn couldn't finish this screen recording. Try again.");
      };
      display.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (recorder.state === "recording") recorder.stop();
      });
      recorder.start(250);
      setRecording(true);
      recordingTimerRef.current = window.setInterval(
        () => setRecordingSeconds((seconds) => seconds + 1),
        1000,
      );
    } catch {
      releaseRecorder();
      setError(
        "Screen or microphone access was canceled. Allow access, then try again.",
      );
    }
  }

  function stopVoiceRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  function cancelVoiceRecording() {
    discardRecordingRef.current = true;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    else releaseRecorder();
    setRecording(false);
    setFile(null);
    setRecordingSeconds(0);
  }

  function finish(processId: string) {
    showAppToast(
      "Process ready for review!",
      "Check the steps and approve it before your team uses it.",
    );
    router.replace(
      `/app/processes/${processId}?returnTo=${encodeURIComponent(returnTo)}`,
    );
  }

  async function learnRecording(job: {
    processId: string;
    mediaId: string;
    isVideo: boolean;
  }) {
    const jobStages = [
      "Uploading recording",
      ...(job.isVideo ? ["Extracting audio"] : []),
      "Transcribing recording",
      ...(job.isVideo ? ["Understanding the visual workflow"] : []),
      "Finding steps and rules",
      "Preparing your process",
    ];
    setStage(1);
    const progress = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, jobStages.length - 2));
    }, 2800);
    try {
      const response = await fetch(`/api/processes/${job.processId}/learn`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mediaId: job.mediaId }),
      });
      const body = await response.json();
      if (!response.ok) {
        if (body.canRetry) setRetryJob(job);
        throw new Error(body.error ?? "Opryn could not learn this recording.");
      }
      setRetryJob(null);
      setStage(jobStages.length - 1);
      return body.processId as string;
    } finally {
      window.clearInterval(progress);
    }
  }

  async function retryProcessing() {
    if (!retryJob || working) return;
    setError("");
    setWorking(true);
    try {
      finish(await learnRecording(retryJob));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Something went wrong.",
      );
      setWorking(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setWorking(true);
    setStage(0);
    try {
      if (mode !== "text" && !file)
        throw new Error(
          mode === "voice" || mode === "screen"
            ? "Record your explanation before continuing."
            : "Choose a recording to upload.",
        );
      const response = await fetch("/api/processes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          roleId: form.roleId || null,
          inputType: mode === "text" ? "text" : "media",
          recommendationId: initial?.recommendationId ?? null,
          file:
            mode !== "text" && file
              ? { name: file.name, type: file.type, size: file.size }
              : undefined,
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Unable to create process.");
      if (body.ready) {
        setStage(textStages.length - 1);
        finish(body.processId);
        return;
      }
      setStage(0);
      const { error: uploadError } = await createClient()
        .storage.from("process-media")
        .upload(body.storagePath, file!, {
          contentType: file!.type,
          upsert: false,
        });
      if (uploadError) throw uploadError;
      finish(
        await learnRecording({
          processId: body.processId,
          mediaId: body.mediaId,
          isVideo: file!.type.startsWith("video/"),
        }),
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Something went wrong.",
      );
      setWorking(false);
    }
  }
  if (working)
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-[#dfe5ed] bg-white p-8 shadow-sm">
        <div className="mx-auto grid size-12 place-items-center rounded-xl bg-[#edf2ff] text-[#3158d8]">
          <LoaderCircle className="size-5 animate-spin" />
        </div>
        <h2 className="mt-5 text-center text-xl font-semibold">
          Opryn is learning this process
        </h2>
        <div className="mt-8 space-y-3">
          {stages.map((label, index) => (
            <div
              key={label}
              className={`flex items-center gap-3 rounded-xl border p-3.5 text-sm ${index <= stage ? "border-[#cdd9fa] bg-[#f5f7ff] text-[#284bbf]" : "border-[#e7ebf0] text-[#9aa3b0]"}`}
            >
              <span
                className={`grid size-6 place-items-center rounded-full text-xs font-bold ${index < stage ? "bg-[#3158d8] text-white" : index === stage ? "border-2 border-[#3158d8]" : "border border-[#d6dce5]"}`}
              >
                {index < stage ? "✓" : index + 1}
              </span>
              {label}
              {index === stage ? (
                <LoaderCircle className="ml-auto size-4 animate-spin" />
              ) : null}
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-[#7b8798]">
          Keep this page open while Opryn prepares the review.
        </p>
      </div>
    );
  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-2xl border border-[#dfe5ed] bg-white p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Process title"
            value={form.title}
            onChange={(title) => setForm({ ...form, title })}
            placeholder="New Customer Intake"
            className="sm:col-span-2"
          />
          <Field
            label="Description (optional)"
            value={form.description}
            onChange={(description) => setForm({ ...form, description })}
            placeholder="What this process covers"
            className="sm:col-span-2"
          />
          <label className="block text-sm font-medium text-[#354157] sm:col-span-2">
            Assign to role (optional)
            <select
              value={form.roleId}
              onChange={(event) =>
                setForm({ ...form, roleId: event.target.value })
              }
              className="mt-2 h-11 w-full rounded-xl border border-[#d9e0e9] bg-white px-3.5 outline-none focus:border-[#7190ee]"
            >
              <option value="">Everyone</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
      {initial?.coachingPrompt ? (
        <section className="rounded-2xl border border-[#dce4f2] bg-[#f5f8ff] p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[.1em] text-[#3158d8]">
            What to show or explain
          </p>
          <p className="mt-2 text-sm leading-6 text-[#53627a]">
            {initial.coachingPrompt}
          </p>
        </section>
      ) : null}
      <section className="rounded-2xl border border-[#dfe5ed] bg-white p-5 sm:p-7">
        <h2 className="font-semibold">How do you want to teach Opryn?</h2>
        <p className="mt-1 text-sm text-[#718095]">
          Type it, say it out loud, or upload a recording you already made.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ModeButton
            active={mode === "text"}
            onClick={() => changeMode("text")}
            icon={<FileText className="size-5" />}
            title="Explain with text"
            note="Type it naturally"
          />
          <ModeButton
            active={mode === "voice"}
            onClick={() => changeMode("voice")}
            icon={<Mic className="size-5" />}
            title="Explain with voice"
            note="Talk Opryn through it"
          />
          <ModeButton
            active={mode === "audio"}
            onClick={() => changeMode("audio")}
            icon={<Headphones className="size-5" />}
            title="Upload audio"
            note="MP3, WAV, M4A, or WEBM"
          />
          <ModeButton
            active={mode === "video"}
            onClick={() => changeMode("video")}
            icon={<Video className="size-5" />}
            title="Upload video"
            note="Let Opryn watch the workflow"
            premium
            locked={!hasFeature(plan, "videoLearning")}
          />
          <ModeButton
            active={mode === "screen"}
            onClick={() => changeMode("screen")}
            icon={<MonitorUp className="size-5" />}
            title="Record my screen"
            note="Capture a workflow as it happens"
            premium
            locked={!hasFeature(plan, "screenRecording")}
          />
        </div>
        {mode === "audio" || mode === "video" ? (
          <div className="mt-5">
            <input
              ref={fileRef}
              className="sr-only"
              type="file"
              accept={
                mode === "video"
                  ? ".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
                  : ".mp3,.wav,.m4a,.webm,audio/*"
              }
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setRetryJob(null);
                setError("");
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex min-h-40 w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#bcc8d7] bg-[#fafbfd] px-5 text-center hover:border-[#7893e5] hover:bg-[#f7f9ff]"
            >
              {mode === "video" ? (
                <Video className="size-6 text-[#3158d8]" />
              ) : (
                <Mic2 className="size-6 text-[#3158d8]" />
              )}
              <span className="mt-3 text-sm font-semibold">
                {file
                  ? file.name
                  : mode === "video"
                    ? "Choose a process video"
                    : "Choose an audio explanation"}
              </span>
              <span className="mt-1 text-xs text-[#7a8698]">
                {mode === "video"
                  ? "MP4, MOV, or WEBM · up to 25 MB"
                  : "MP3, WAV, M4A, or WEBM · up to 25 MB"}
              </span>
              {file ? (
                <span className="mt-2 text-xs font-medium text-[#3158d8]">
                  {(file.size / 1024 / 1024).toFixed(1)} MB · Choose another
                </span>
              ) : null}
            </button>
          </div>
        ) : mode === "text" ? (
          <label className="mt-5 block text-sm font-medium text-[#354157]">
            Explain how you do this
            <textarea
              required
              value={form.explanation}
              onChange={(event) =>
                setForm({ ...form, explanation: event.target.value })
              }
              rows={10}
              placeholder="Start as if you were training someone: First, I open the customer record…"
              className="mt-2 w-full resize-y rounded-xl border border-[#d9e0e9] p-3.5 leading-6 outline-none focus:border-[#7190ee] focus:ring-4 focus:ring-[#3158d8]/10"
            />
          </label>
        ) : (
          <div className="mt-5 overflow-hidden rounded-2xl border border-[#dfe5ed] bg-[#f8fafd]">
            <div className="flex flex-col items-center px-5 py-7 text-center sm:px-8">
              <button
                type="button"
                onClick={() =>
                  recording
                    ? stopVoiceRecording()
                    : mode === "screen"
                      ? void startScreenRecording()
                      : void startVoiceRecording()
                }
                aria-label={
                  recording
                    ? "Stop recording"
                    : mode === "screen"
                      ? "Start screen recording"
                      : "Start recording"
                }
                className={`grid size-16 place-items-center rounded-full text-white shadow-[0_12px_28px_rgba(49,88,216,.24)] transition hover:scale-105 active:scale-95 ${recording ? "bg-[#c14c55]" : "bg-[#3158d8]"}`}
              >
                {recording ? (
                  <Square className="size-5" fill="currentColor" />
                ) : mode === "screen" ? (
                  <MonitorUp className="size-6" />
                ) : (
                  <Mic className="size-6" />
                )}
              </button>
              <p className="mt-4 text-sm font-semibold text-[#334055]">
                {recording
                  ? "Explain the process as if you were training someone"
                  : file
                    ? mode === "screen"
                      ? "Your screen recording is ready"
                      : "Your voice explanation is ready"
                    : mode === "screen"
                      ? "Share a screen or browser tab"
                      : "Tap to start explaining"}
              </p>
              <p className="mt-1 text-xs text-[#7a8698]">
                {recording
                  ? "Include the steps, decisions, exceptions, and approvals."
                  : file
                    ? "Opryn will transcribe this and prepare a process for review."
                    : mode === "screen"
                      ? "Explain what you are doing while Opryn watches the workflow."
                      : "Speak naturally. You do not need a script."}
              </p>
              <div className="mt-6 flex h-12 w-full max-w-lg items-center justify-center gap-[3px] overflow-hidden rounded-xl bg-white px-4 shadow-sm">
                {Array.from({ length: 36 }).map((_, index) => (
                  <i
                    key={index}
                    className={`w-[2px] rounded-full ${recording ? "animate-pulse bg-[#7189df]" : file ? "bg-[#9aace4]" : "bg-[#d8dee8]"}`}
                    style={{
                      height: `${recording || file ? 8 + ((index * 11) % 28) : 5}px`,
                      animationDelay: `${(index % 8) * 70}ms`,
                    }}
                  />
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span
                  className={`font-mono text-xs font-semibold ${recording ? "text-[#c14c55]" : "text-[#687487]"}`}
                >
                  {formatDuration(recordingSeconds)}
                </span>
                {recording ? (
                  <button
                    type="button"
                    onClick={cancelVoiceRecording}
                    className="text-xs font-semibold text-[#718095] hover:text-[#344052]"
                  >
                    Cancel
                  </button>
                ) : file ? (
                  <>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#177257]">
                      <CheckCircle2 className="size-3.5" /> Recorded
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        mode === "screen"
                          ? void startScreenRecording()
                          : void startVoiceRecording()
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#718095] hover:text-[#344052]"
                    >
                      <RotateCcw className="size-3.5" /> Record again
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </section>
      {error ? (
        <div
          role="alert"
          className="rounded-xl bg-[#fff0f1] p-4 text-sm text-[#a83f49]"
        >
          <p>{error}</p>
          {retryJob ? (
            <button
              type="button"
              onClick={() => void retryProcessing()}
              className="mt-3 rounded-lg bg-[#a83f49] px-3.5 py-2 text-xs font-semibold text-white"
            >
              Retry processing
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="flex justify-end">
        <button
          disabled={recording}
          className="flex min-h-12 items-center gap-2 rounded-xl bg-[#3158d8] px-6 text-sm font-semibold text-white shadow-[0_9px_22px_rgba(49,88,216,.2)] hover:bg-[#2446b8] disabled:cursor-not-allowed disabled:bg-[#aeb9d7]"
        >
          {recording ? "Finish recording first" : "Teach Opryn"}
        </button>
      </div>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </form>
  );
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
function ModeButton({
  active,
  onClick,
  icon,
  title,
  note,
  premium = false,
  locked = false,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  note: string;
  premium?: boolean;
  locked?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-xl border p-4 text-left transition ${active ? "border-[#7390e8] bg-[#f3f6ff] ring-2 ring-[#3158d8]/10" : "border-[#dfe5ed] hover:bg-[#fafbfd]"}`}
    >
      {premium ? <PremiumBadge className="absolute right-3 top-3" /> : null}
      <span className={active ? "text-[#3158d8]" : "text-[#69758a]"}>
        {locked ? <Lock className="size-5" /> : icon}
      </span>
      <span className="mt-3 block text-sm font-semibold">{title}</span>
      <span className="mt-1 block text-xs text-[#7a8698]">{note}</span>
    </button>
  );
}
function Field({
  label,
  value,
  onChange,
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-medium text-[#354157] ${className}`}>
      {label}
      <input
        required={label === "Process title"}
        className="mt-2 h-11 w-full rounded-xl border border-[#d9e0e9] px-3.5 outline-none placeholder:text-[#a7afbb] focus:border-[#7190ee] focus:ring-4 focus:ring-[#3158d8]/10"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
