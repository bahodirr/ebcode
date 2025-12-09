import ky from 'ky'

export const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL

export const http = ky.create({
  prefixUrl: backendBaseUrl,
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  retry: { limit: 2, methods: ['get'] },
  timeout: 30000,
})

/** Scoped API client for agent operations */
export const agentApi = (projectId: string, sandboxId: string) => {
  const base = `api/agent/${projectId}/${sandboxId}`
  return {
    base,
    fullUrl: `${backendBaseUrl}/${base}`,
    get: <T>(path: string) => http.get(`${base}/${path}`).json<T>(),
    post: <T>(path: string, json?: unknown) => http.post(`${base}/${path}`, { json }).json<T>(),
  }
}
