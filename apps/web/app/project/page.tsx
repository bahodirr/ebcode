"use client";

import { useSearchParams } from "next/navigation";
import { useProjectQuery, useResumeProject } from "@/app/queries/projects";
import { useSendMessage, useSession } from "@/app/queries/chats";
import { useState, useRef, useEffect, Suspense } from "react";
import { RefreshCw, Play, Minimize2, Maximize2, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useAgentStream from "@/lib/use-agent-stream";
import { AgentThread } from "@/components/agent/agent-thread";
import ChatInput from "@/components/agent/chat-input";
import type { FilePart } from "@/lib/upload";

const checkPreviewStatus = async (url: string) => {
  const res = await fetch(`/api/proxy-status?url=${encodeURIComponent(url)}`);
  const data = await res.json();
  return data.status >= 200 && data.status < 300;
};

function ProjectContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [iframeKey, setIframeKey] = useState(0);
  const [isThreadExpanded, setIsThreadExpanded] = useState(false);
  const [mode, setMode] = useState<"plan" | "build">("plan");
  const threadContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useProjectQuery(projectId ?? undefined);
  const { data: session } = useSession(project?.id, project?.sandboxId);
  const { mutate: resume, isPending: isResuming } = useResumeProject();
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();

  const { data: isPreviewReady = false } = useQuery({
    queryKey: ["preview-status", project?.previewUrl],
    queryFn: () => checkPreviewStatus(project!.previewUrl),
    enabled: !!project?.previewUrl,
    refetchInterval: (query) => (query.state.data ? false : 1000),
    staleTime: Infinity,
  });

  const sessionId = session?.id;
  const { messages, parts: partsMap } = useAgentStream({
    sessionId,
    projectId: project?.id,
    sandboxId: project?.sandboxId,
  });

  useEffect(() => {
    if (isThreadExpanded && threadContainerRef.current) {
      threadContainerRef.current.scrollTop = threadContainerRef.current.scrollHeight;
    }
  }, [isThreadExpanded]);

  const handleSubmit = (text: string, files?: FilePart[], model?: string, providerID?: string) => {
    if (!text.trim() && !files?.length) return;
    if (!project || !sessionId) return;

    sendMessage({
      projectId: project.id,
      sandboxId: project.sandboxId,
      sessionId,
      text,
      agent: mode,
      files,
      model,
      providerID,
    });
  };

  const handleWakeUp = () => {
    if (!project) return;
    queryClient.setQueryData(["preview-status", project.previewUrl], false);
    resume(
      { projectId: project.id, sandboxId: project.sandboxId, devScript: project.devScript, processName: "dev-server" },
      { onSuccess: () => setIframeKey(k => k + 1) },
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <p className="text-zinc-500">Project not found</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-white dark:bg-zinc-950">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={handleWakeUp}
          disabled={isResuming}
          className="flex items-center gap-2 rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-sm transition-all hover:bg-white dark:bg-zinc-900/90 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
        >
          {isResuming ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          {isResuming ? "Waking up..." : "Wake up Sandbox"}
        </button>
        <button
          onClick={() => setIframeKey(k => k + 1)}
          className="flex items-center gap-2 rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-sm transition-all hover:bg-white dark:bg-zinc-900/90 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
        >
          <RefreshCw className="h-3 w-3" />
          Reload Preview
        </button>
      </div>

      {isPreviewReady ? (
        <iframe
          key={iframeKey}
          src={project.previewUrl}
          className="h-full w-full border-0 bg-white"
          title="Project Preview"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-white dark:bg-zinc-950">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          <p className="text-sm text-zinc-500">Starting application...</p>
        </div>
      )}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 transform z-20 w-full max-w-2xl px-4 flex flex-col items-center">
        {/* Agent Thread - narrower, above input */}
        <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-b-0 border-zinc-200 dark:border-zinc-700 w-[75%] rounded-t-xl">
          <button
            onClick={() => setIsThreadExpanded(e => !e)}
            className="absolute top-2 right-2 z-30 flex items-center justify-center size-6 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-400 transition-colors"
          >
            {isThreadExpanded ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
          </button>
          <div ref={threadContainerRef} className={isThreadExpanded ? "h-[40vh] overflow-y-auto p-4 pr-10 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800" : "px-4 py-2 pr-10"}>
            <AgentThread
              messages={messages}
              partsMap={partsMap}
              sessionId={sessionId ?? ""}
              compact={!isThreadExpanded}
              onToggleCompact={() => setIsThreadExpanded(e => !e)}
            />
          </div>
        </div>

        {/* Chat Input - full width */}
        <ChatInput
          onSubmit={handleSubmit}
          disabled={!project || !sessionId}
          placeholder="Ask the agent to make changes..."
          mode={mode}
          onToggleMode={() => setMode(m => (m === "plan" ? "build" : "plan"))}
          isWorking={isSending}
        />
      </div>
    </div>
  );
}

export default function ProjectPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <p className="text-zinc-500">Loading...</p>
      </div>
    }>
      <ProjectContent />
    </Suspense>
  );
}
