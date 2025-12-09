import { Sandbox } from 'e2b'
import { templateName } from '../e2b/template'

const ONE_HOUR = 60 * 60 * 1000

export interface InitializeProjectArgs {
  projectId: string
  sandboxId?: string
  githubUrl?: string
  initScript?: string
  devScript?: string
  processName?: string
  workDir?: string
  previewPort?: number
  env?: Record<string, string>
}

export interface ResumeProjectArgs {
  projectId: string
  sandboxId: string
  devScript?: string
  processName?: string
  workDir?: string
  previewPort?: number
  env?: Record<string, string>
}

function logStep(step: string, details?: string) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [STEP] ${step}${details ? `: ${details}` : ''}`)
}

// PM2 helpers
async function pm2JList(sbx: Sandbox, cwd: string): Promise<any[]> {
  try {
    const out = await sbx.commands.run('pm2 jlist', { cwd, timeoutMs: 30_000 })
    try {
      return JSON.parse(out.stdout) || []
    } catch {
      return []
    }
  } catch {
    return []
  }
}

async function isPm2Online(sbx: Sandbox, cwd: string, name: string): Promise<boolean> {
  const list = await pm2JList(sbx, cwd)
  const proc = list.find((p: any) => p?.name === name)
  return proc?.pm2_env?.status === 'online'
}

async function ensurePm2Process(
  sbx: Sandbox,
  cwd: string,
  name: string,
  command: string,
  env?: Record<string, string>
): Promise<void> {
  const online = await isPm2Online(sbx, cwd, name)
  if (online) return

  const startCmd = `pm2 start "${command}" --name ${name} --update-env`
  await sbx.commands.run(startCmd, { cwd, timeoutMs: 5 * 60 * 1000, envs: env })
}

/**
 * Initialize a project sandbox
 */
export async function initializeProject(
  args: InitializeProjectArgs
): Promise<{ projectId: string; sandboxId: string; previewUrl: string; agentUrl: string }> {
  logStep('INIT_START', `Project ID: ${args.projectId}`)

  let sbx: Sandbox

  if (args.sandboxId) {
    logStep('CONNECT_SANDBOX', `Connecting to existing sandbox: ${args.sandboxId}`)
    try {
      sbx = await Sandbox.connect(args.sandboxId)
    } catch (error: any) {
      logStep('CONNECT_ERROR', `Failed to connect to ${args.sandboxId}, creating new one`)
      sbx = await Sandbox.create(templateName, { timeoutMs: ONE_HOUR })
    }
  } else {
    logStep('CREATE_SANDBOX', `Creating new sandbox from template: ${templateName}`)
    sbx = await Sandbox.create(templateName, { timeoutMs: ONE_HOUR })
    logStep('SANDBOX_CREATED', `Sandbox ID: ${sbx.sandboxId}`)
  }

  const workDir = args.workDir || '/workspace'

  // Clone repo if provided
  if (args.githubUrl) {
    await sbx.commands.run(`git clone ${args.githubUrl} ${workDir}`)
  }

  // Run init script if provided
  if (args.initScript) {
    await sbx.commands.run(args.initScript, { cwd: workDir, timeoutMs: 30 * 60 * 1000 })
  }

  // Build env vars
  const envVars: Record<string, string> = { ...args.env }

  const port = args.previewPort || 3000
  envVars.PORT = port.toString()

  // Start dev server if script provided
  if (args.devScript && args.processName) {
    await ensurePm2Process(sbx, workDir, args.processName, args.devScript, envVars)
    logStep('DEV_SERVER_STARTED')
  }

  // Start opencode agent
  await ensurePm2Process(sbx, workDir, 'agent-opencode-server', 'opencode serve --hostname 0.0.0.0 --port 4096', envVars)
  logStep('AGENT_STARTED')

  const host = sbx.getHost(port)
  const agentHost = sbx.getHost(4096)
  const previewUrl = `https://${host}`
  const agentUrl = `https://${agentHost}`

  logStep('INIT_COMPLETE', `Preview URL: ${previewUrl}`)
  return { projectId: args.projectId, sandboxId: sbx.sandboxId, previewUrl, agentUrl }
}

/**
 * Resume a project sandbox
 */
export async function resumeProject(
  args: ResumeProjectArgs
): Promise<{ projectId: string; sandboxId: string; previewUrl: string; agentUrl: string }> {
  logStep('RESUME_START', `Project ID: ${args.projectId}, Sandbox: ${args.sandboxId}`)
  const sbx = await Sandbox.connect(args.sandboxId)
  const workDir = args.workDir || '/workspace'

  // Build env vars
  const envVars: Record<string, string> = { ...args.env }

  const port = args.previewPort || 3000
  envVars.PORT = port.toString()

  // Restart dev server if script provided
  if (args.devScript && args.processName) {
    logStep('RESTART_DEV', `Restarting ${args.processName}`)
    await ensurePm2Process(sbx, workDir, args.processName, args.devScript, envVars)
  }

  // Ensure opencode agent is running
  logStep('UPDATE_AGENT', 'Updating OpenCode agent...')
  await sbx.commands.run('bun update -g opencode-ai@latest', { timeoutMs: 120_000 })
  await ensurePm2Process(sbx, workDir, 'agent-opencode-server', 'opencode serve --hostname 0.0.0.0 --port 4096', envVars)
  logStep('AGENT_READY')

  const host = sbx.getHost(port)
  const agentHost = sbx.getHost(4096)
  const previewUrl = `https://${host}`
  const agentUrl = `https://${agentHost}`

  logStep('RESUME_COMPLETE', `Preview URL: ${previewUrl}`)
  return { projectId: args.projectId, sandboxId: args.sandboxId, previewUrl, agentUrl }
}
