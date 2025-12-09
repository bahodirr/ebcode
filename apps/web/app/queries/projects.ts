import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { http } from '@/lib/http'

export interface Project {
  id: string
  githubUrl: string
  sandboxId: string
  previewUrl: string
  agentUrl?: string
  initScript?: string
  devScript?: string
  createdAt: number
}

const STORAGE_KEY = 'projects'

function getLocalProjects(): Project[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    console.error('Failed to parse projects from local storage', e)
    return []
  }
}

function saveLocalProject(project: Project) {
  const projects = getLocalProjects()
  // Add to beginning of list
  const updated = [project, ...projects]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export function useProjectsQuery() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: getLocalProjects,
  })
}

export function getLocalProject(id: string): Project | undefined {
  return getLocalProjects().find((p) => p.id === id)
}

export function useProjectQuery(id?: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => getLocalProject(id!),
    enabled: Boolean(id),
  })
}

interface CreateProjectArgs {
  githubUrl: string
  initScript?: string
  devScript?: string
  processName?: string
  env?: Record<string, string | undefined>
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (args: CreateProjectArgs) => {
      const projectId = Math.random().toString(36).substring(7)
      
      const res = await http.post(`api/projects/${projectId}/init`, {
        json: { 
          githubUrl: args.githubUrl,
          initScript: args.initScript,
          devScript: args.devScript,
          processName: args.processName,
          env: args.env
        }
      }).json<{ projectId: string; sandboxId: string; previewUrl: string; agentUrl: string }>()

      const newProject: Project = {
        id: res.projectId,
        sandboxId: res.sandboxId,
        previewUrl: res.previewUrl,
        agentUrl: res.agentUrl,
        githubUrl: args.githubUrl,
        initScript: args.initScript,
        devScript: args.devScript,
        createdAt: Date.now(),
      }

      saveLocalProject(newProject)
      return newProject
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useResumeProject() {
  return useMutation({
    mutationFn: async ({ 
      projectId, 
      sandboxId,
      devScript,
      processName,
      env
    }: { 
      projectId: string
      sandboxId: string
      devScript?: string
      processName?: string
      env?: Record<string, string | undefined>
    }) => {
      const res = await http.post(`api/projects/${projectId}/${sandboxId}/resume`, {
        json: {
          devScript,
          processName,
          env
        }
      }).json<{ projectId: string; sandboxId: string; previewUrl: string; agentUrl: string }>()
      return res
    }
  })
}
