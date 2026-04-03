import path from "path";
import { USER_HOME } from "../../constants/main";
import { resource } from "../../utils/fs";

const CONFIG_PATH = resource("tunnel/cloudflared.yml");

export function getCloudflaredConfigPath(): string {
  return CONFIG_PATH;
}

export function generateCloudflaredConfig(
  tunnelId: string,
  routerPort: number,
): string {
  const credentialsFile = path.join(
    USER_HOME,
    ".cloudflared",
    `${tunnelId}.json`,
  );

  return [
    `tunnel: ${tunnelId}`,
    `credentials-file: ${credentialsFile}`,
    `ingress:`,
    `  - service: http://localhost:${routerPort}`,
  ].join("\n");
}

export async function writeCloudflaredConfig(
  tunnelId: string,
  routerPort: number,
): Promise<string> {
  const config = generateCloudflaredConfig(tunnelId, routerPort);
  await Bun.write(CONFIG_PATH, config);
  return CONFIG_PATH;
}
