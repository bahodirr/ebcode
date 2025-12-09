import { Hono } from 'hono'
import { Sandbox } from 'e2b'
import { initializeProject, resumeProject } from '../controller/projects'

const projects = new Hono()

// POST /projects/:projectId/init - Create sandbox or connect to existing
projects.post('/:projectId/init', async (c) => {
  const projectId = c.req.param('projectId')
  const body = await c.req.json().catch(() => ({}))

  try {
    const result = await initializeProject({
      projectId,
      ...body
    })

    return c.json(result)
  } catch (err) {
    console.error('Init error:', err)
    return c.json({ error: 'Failed to initialize sandbox' }, 500)
  }
})

// GET /projects/:projectId/:sandboxId - Get sandbox info
projects.get('/:projectId/:sandboxId', async (c) => {
  const projectId = c.req.param('projectId')
  const sandboxId = c.req.param('sandboxId')

  try {
    const sbx = await Sandbox.connect(sandboxId)
    const host = sbx.getHost(3000)
    const agentHost = sbx.getHost(4096)
    const previewUrl = `https://${host}`
    const agentUrl = `https://${agentHost}`

    return c.json({ projectId, sandboxId, previewUrl, agentUrl })
  } catch (err) {
    console.error('Get error:', err)
    return c.json({ error: 'Failed to connect to sandbox' }, 500)
  }
})

// POST /projects/:projectId/:sandboxId/resume - Reconnect to sandbox
projects.post('/:projectId/:sandboxId/resume', async (c) => {
  const projectId = c.req.param('projectId')
  const sandboxId = c.req.param('sandboxId')
  const body = await c.req.json().catch(() => ({}))

  try {
    const result = await resumeProject({
      projectId,
      sandboxId,
      ...body
    })

    return c.json(result)
  } catch (err) {
    console.error('Resume error:', err)
    return c.json({ error: 'Failed to resume sandbox' }, 500)
  }
})

export default projects
