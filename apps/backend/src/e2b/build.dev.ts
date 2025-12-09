import "dotenv/config";
import { Template, defaultBuildLogger } from "e2b";
import { template, templateName } from "./template";

async function main() {
  await Template.build(template, {
    alias: templateName,
    cpuCount: 4,
    memoryMB: 1024 * 8, // 8GB
    onBuildLogs: defaultBuildLogger(),
  });
}

main().catch(console.error);
