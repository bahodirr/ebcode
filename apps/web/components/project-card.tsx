import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Project } from "@/app/queries/projects";
import { stringToColor } from "@/lib/utils";

export function ProjectCard({ project }: { project: Project }) {
  const [isAlive, setIsAlive] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const checkStatus = async () => {
      if (!project.previewUrl) {
        setIsAlive(false);
        return;
      }
      try {
        const res = await fetch(
          `/api/proxy-status?url=${encodeURIComponent(project.previewUrl)}`
        );
        const data = await res.json();
        if (!cancelled) setIsAlive(data.status >= 200 && data.status < 400);
      } catch {
        if (!cancelled) setIsAlive(false);
      }
    };

    checkStatus();
    return () => {
      cancelled = true;
    };
  }, [project.previewUrl]);

  const fallbackColor = stringToColor(project.id);
  const showPreview = isAlive;
  const initials = project.githubUrl.split("/").pop()?.slice(0, 2).toUpperCase();

  return (
    <Link
      href={`/project?projectId=${project.id}&sandboxId=${project.sandboxId}`}
      className="group relative block overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:shadow-black/50"
    >
      <div className="aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950 relative">
        {showPreview ? (
          <iframe
            src={project.previewUrl}
            className="h-[200%] w-[200%] origin-top-left scale-50 pointer-events-none opacity-80 transition-opacity group-hover:opacity-100 grayscale-20 group-hover:grayscale-0"
            tabIndex={-1}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ backgroundColor: fallbackColor }}
          >
            <span className="select-none text-4xl font-mono font-bold text-black/10">
              {initials}
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate font-mono text-xs font-medium text-zinc-700 dark:text-zinc-300">
            {project.githubUrl.replace("https://github.com/", "")}
          </div>
          <ExternalLink className="h-3 w-3 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-zinc-400">
          <Clock className="h-3 w-3" />
          <span>{formatDistanceToNow(project.createdAt, { addSuffix: true })}</span>
        </div>
      </div>
    </Link>
  );
}

