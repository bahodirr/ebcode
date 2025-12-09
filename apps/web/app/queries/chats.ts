import { useMutation, useQuery } from '@tanstack/react-query'
import { agentApi } from '@/lib/http'
import type { Message, Session } from '@opencode-ai/sdk'

type FilePartInput = { type: 'file'; mime: string; filename: string; url: string }

type SendMessageArgs = {
  projectId: string
  sandboxId: string
  sessionId: string
  text: string
  agent: 'plan' | 'build'
  files?: FilePartInput[]
  model?: string
  providerID?: string
}

/** Get or create a session for the project */
export function useSession(projectId?: string, sandboxId?: string) {
  return useQuery({
    queryKey: ['session', projectId, sandboxId],
    queryFn: async () => {
      const api = agentApi(projectId!, sandboxId!)
      const sessions = await api.get<Session[]>('session')
      if (sessions.length) return sessions[0]!
      return api.post<Session>('session', {})
    },
    enabled: Boolean(projectId && sandboxId),
    staleTime: Infinity,
  })
}

export function useSendMessage() {
  return useMutation<Message, unknown, SendMessageArgs>({
    mutationFn: async ({ projectId, sandboxId, sessionId, text, agent, files, model, providerID }) => {
      const parts: Array<{ type: string; text?: string; mime?: string; filename?: string; url?: string }> = []
      files?.forEach(f => parts.push({ type: 'file', mime: f.mime, filename: f.filename, url: f.url }))
      if (text) parts.push({ type: 'text', text })

      const body: Record<string, unknown> = { agent, parts }
      if (model?.trim()) body.model = { providerID, modelID: model }

      return agentApi(projectId, sandboxId).post(`session/${sessionId}/message`, body)
    },
  })
}

export function useAbortSession() {
  return useMutation<boolean, unknown, { projectId: string; sandboxId: string; sessionId: string }>({
    mutationFn: ({ projectId, sandboxId, sessionId }) =>
      agentApi(projectId, sandboxId).post(`session/${sessionId}/abort`),
  })
}
