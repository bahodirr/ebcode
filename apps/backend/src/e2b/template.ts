import { Template, waitForTimeout } from "e2b";

export const templateName = "surgent-opencode";

export const template = Template()
  .fromNodeImage("lts-slim")
  .setUser("root")
  // Install system dependencies
  .runCmd([
    "apt-get update",
    "apt-get install -y --no-install-recommends git ca-certificates curl jq unzip",
    "apt-get clean",
    "rm -rf /var/lib/apt/lists/*",
  ])
  // Install bun
  .runCmd("curl -fsSL https://bun.sh/install | bash")
  .setEnvs({
    BUN_INSTALL: "/root/.bun",
    PATH: "/root/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
  })
  // Install OpenCode globally with bun
  .runCmd("/root/.bun/bin/bun add -g opencode-ai pm2")
  // Configure git identity
  .runCmd([
    'git config --global user.name "Ebcode Bot"',
    'git config --global user.email "bot@ebcode.ai"',
  ])
  // Set working directory
  .setWorkdir("/workspace")
  // Keep container running
  .setStartCmd("sleep infinity", waitForTimeout(100));
