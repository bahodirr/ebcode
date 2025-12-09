"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, ArrowRight, Github, Terminal, Play, Command, Key } from "lucide-react";
import { useCreateProject, useProjectsQuery } from "@/app/queries/projects";
import { cn } from "@/lib/utils";
import { ProjectCard } from "@/components/project-card";

const TEMPLATES = [
  {
    name: "Vite/React Worker",
    url: "https://github.com/bahodirr/worker-vite-react-simple-template",
  },
];

export default function Home() {
  const router = useRouter();
  const [githubUrl, setGithubUrl] = useState("https://github.com/bahodirr/worker-vite-react-simple-template");
  const [initScript, setInitScript] = useState("bun install");
  const [devScript, setDevScript] = useState("bun run dev");
  const [openaiKey, setOpenaiKey] = useState("");
  const [xaiKey, setXaiKey] = useState("");
  const [envVars, setEnvVars] = useState("");

  const { mutateAsync: createProject, isPending } = useCreateProject();
  const { data: projects = [] } = useProjectsQuery();

  const handleStart = async () => {
    if (!githubUrl) return;

    const parsedEnv: Record<string, string> = {};
    
    // Parse manual env vars
    if (envVars) {
        envVars.split('\n').forEach(line => {
            const [key, ...values] = line.split('=');
            if (key && values.length > 0) {
                parsedEnv[key.trim()] = values.join('=').trim();
            }
        });
    }

    // Add API keys if present
    if (openaiKey) parsedEnv.OPENAI_API_KEY = openaiKey;
    if (xaiKey) parsedEnv.XAI_API_KEY = xaiKey;

    try {
      const data = await createProject({
        githubUrl,
        initScript,
        devScript,
        processName: "dev-server",
        env: parsedEnv,
      });

      router.push(`/project?projectId=${data.id}&sandboxId=${data.sandboxId}`);
    } catch (error) {
      console.error(error);
      alert("Failed to start project");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-6 font-sans text-zinc-900 selection:bg-zinc-900 selection:text-white dark:bg-zinc-950 dark:text-zinc-50">
      <div className="w-full max-w-xl space-y-12">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-light tracking-tighter sm:text-5xl">
            ship <span className="font-serif italic text-zinc-400">faster.</span>
          </h1>
          <p className="mx-auto max-w-md text-sm text-zinc-400 font-light">
            Instant dev environments for your GitHub repositories. 
          </p>
        </div>

        {/* Main Input Section */}
        <div className="space-y-6">
            <div className="space-y-3">
                <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-zinc-400 dark:text-zinc-600">
                        <Github className="h-5 w-5" />
                    </div>
                    <Input
                        id="github-url"
                        placeholder="github.com/username/project"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        className="h-16 rounded-2xl border-0 bg-white pl-12 pr-12 text-lg font-mono text-zinc-900 shadow-[0_0_40px_-10px_rgba(0,0,0,0.05)] ring-1 ring-zinc-200 transition-all placeholder:text-zinc-300 focus-visible:ring-2 focus-visible:ring-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800 dark:placeholder:text-zinc-700 dark:focus-visible:ring-zinc-100"
                    />
                     <div className="absolute right-5 top-1/2 -translate-y-1/2 hidden items-center gap-1 rounded bg-zinc-100 px-2 py-1 text-[10px] font-medium text-zinc-400 sm:flex dark:bg-zinc-800">
                        <Command className="h-3 w-3" />
                        <span>K</span>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 px-1">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">Templates:</span>
                    {TEMPLATES.map((t) => (
                         <button
                            key={t.url}
                            onClick={() => setGithubUrl(t.url)}
                            className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-medium text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                        >
                            {t.name}
                        </button>
                    ))}
                </div>
            </div>

            <Accordion type="single" collapsible className="w-full border-none">
                <AccordionItem value="settings" className="border-none">
                    <AccordionTrigger className="group flex justify-center py-0 text-xs text-zinc-400 hover:text-zinc-600 hover:no-underline dark:hover:text-zinc-300">
                         <span className="font-mono uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">Configure Environment</span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <div className="space-y-4">
                            {/* Scripts */}
                            <div className="rounded-xl border border-zinc-200 bg-white/50 p-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-3">Scripts</p>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="init-script" className="flex items-center gap-2 text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-400">
                                            <Terminal className="h-3 w-3" /> Init
                                        </Label>
                                        <Input
                                            id="init-script"
                                            value={initScript}
                                            onChange={(e) => setInitScript(e.target.value)}
                                            className="h-9 font-mono text-xs bg-transparent border-zinc-200 focus-visible:border-zinc-400 focus-visible:ring-0 dark:border-zinc-800 dark:focus-visible:border-zinc-600"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="dev-script" className="flex items-center gap-2 text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-400">
                                            <Play className="h-3 w-3" /> Dev
                                        </Label>
                                        <Input
                                            id="dev-script"
                                            value={devScript}
                                            onChange={(e) => setDevScript(e.target.value)}
                                            className="h-9 font-mono text-xs bg-transparent border-zinc-200 focus-visible:border-zinc-400 focus-visible:ring-0 dark:border-zinc-800 dark:focus-visible:border-zinc-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* API Keys */}
                            <div className="rounded-xl border border-zinc-200 bg-white/50 p-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-3">API Keys</p>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="openai-key" className="flex items-center gap-2 text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-400">
                                            <Key className="h-3 w-3" /> OpenAI
                                        </Label>
                                        <Input
                                            id="openai-key"
                                            type="password"
                                            placeholder="sk-..."
                                            value={openaiKey}
                                            onChange={(e) => setOpenaiKey(e.target.value)}
                                            className="h-9 font-mono text-xs bg-transparent border-zinc-200 focus-visible:border-zinc-400 focus-visible:ring-0 dark:border-zinc-800 dark:focus-visible:border-zinc-600"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="xai-key" className="flex items-center gap-2 text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-400">
                                            <Key className="h-3 w-3" /> xAI
                                        </Label>
                                        <Input
                                            id="xai-key"
                                            type="password"
                                            placeholder="xai-..."
                                            value={xaiKey}
                                            onChange={(e) => setXaiKey(e.target.value)}
                                            className="h-9 font-mono text-xs bg-transparent border-zinc-200 focus-visible:border-zinc-400 focus-visible:ring-0 dark:border-zinc-800 dark:focus-visible:border-zinc-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Custom Environment Variables */}
                            <div className="rounded-xl border border-zinc-200 bg-white/50 p-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-3">Custom Variables <span className="normal-case opacity-60">· one per line</span></p>
                                <textarea
                                    id="env-vars"
                                    value={envVars}
                                    onChange={(e) => setEnvVars(e.target.value)}
                                    placeholder="MY_VAR=value"
                                    rows={2}
                                    className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-xs font-mono placeholder:text-zinc-300 focus-visible:outline-none focus-visible:border-zinc-400 dark:border-zinc-800 dark:placeholder:text-zinc-600 dark:focus-visible:border-zinc-600 resize-y"
                                />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <Button
                className={cn(
                    "group h-14 w-full rounded-2xl bg-zinc-900 text-lg font-medium text-white shadow-xl shadow-zinc-900/20 transition-all hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:shadow-white/10",
                    isPending && "cursor-not-allowed opacity-80"
                )}
                onClick={handleStart}
                disabled={isPending || !githubUrl}
            >
                {isPending ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Initializing...</span>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2">
                        <span>Start Building</span>
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </div>
                )}
            </Button>
        </div>

        {/* Recent Projects Section */}
        {projects.length > 0 && (
          <div className="space-y-4 pt-4">
             <div className="flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-widest text-zinc-400">
                <div className="h-px w-8 bg-zinc-200 dark:bg-zinc-800" />
                <span>Your Projects</span>
                <div className="h-px w-8 bg-zinc-200 dark:bg-zinc-800" />
             </div>
             
             <div className="grid gap-4 sm:grid-cols-2">
               {projects.map((project) => (
                 <ProjectCard key={project.id} project={project} />
               ))}
             </div>
          </div>
        )}
        
        {/* Footer - Minimal */}
        <div className="flex justify-center gap-6 text-xs text-zinc-400 font-light opacity-60 hover:opacity-100 transition-opacity">
             <span className="cursor-pointer hover:underline">Docs</span>
             <span className="cursor-pointer hover:underline">Pricing</span>
             <span className="cursor-pointer hover:underline">About</span>
        </div>
      </div>
    </main>
  );
}
