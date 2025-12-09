import { Hono } from 'hono'
import { Sandbox } from 'e2b'

const agent = new Hono()

// Proxy all OpenCode endpoints: /api/agent/:projectId/:sandboxId/*
agent.all('/:projectId/:sandboxId/*', async (c) => {
  const projectId = c.req.param('projectId')
  const sandboxId = c.req.param('sandboxId')

  try {
    const sbx = await Sandbox.connect(sandboxId)
    const host = sbx.getHost(4096)
    const previewUrl = `https://${host}`

    const url = new URL(c.req.url)
    const path = url.pathname.replace(`/api/agent/${projectId}/${sandboxId}`, '')
    const targetUrl = new URL(previewUrl)
    targetUrl.pathname = path || '/'
    targetUrl.search = url.search

    const headers = new Headers(c.req.raw.headers)
    headers.delete('host')

    console.log('proxied request to', targetUrl.toString())

    return await fetch(new Request(targetUrl.toString(), {
      method: c.req.method,
      headers,
      body: c.req.raw.body,
    }))
  } catch (err) {
    console.error('Agent proxy error:', err)
    return c.text('Upstream unavailable', 502)
  }
})

export default agent
