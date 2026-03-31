import { getConfig } from "../../config/main";
import type { AppConfig } from "../../config/types";
import { cloudflared } from "../../externals/cloudflared";

const QUICK_TUNNEL_REGEX = /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/;

function matchTunnelUrl(url: string): string | null {
  const match = url.match(QUICK_TUNNEL_REGEX);
  return match ? match[0] : null;
}

async function quickTunnel(port: number) {
  const url = `http://localhost:${port}`;
  const proc = await cloudflared.invoke(["tunnel", "--url", url], {
    stderr: "pipe",
  });

  const reader = proc.stderr.getReader();
  const decoder = new TextDecoder();

  let tunnelUrl: string | null = null;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);

    if (
      text.includes("invalid character 'e'") ||
      text.includes("429 Too Many Requests")
    ) {
      console.error(
        "Rate limited creating free tunnel. Run `ahh tunnel configure` to use your own domain.",
      );
      break;
    }

    if (!tunnelUrl) tunnelUrl = matchTunnelUrl(text);
    if (text.includes("Registered tunnel connection") && tunnelUrl) {
      return {
        url: tunnelUrl,
        kill: proc.kill,
      };
    }
  }

  return {};
}

async function namedTunnel(
  port: number,
  tunnelConfig: NonNullable<AppConfig["TUNNEL"]>,
) {
  const url = `http://localhost:${port}`;
  const proc = await cloudflared.invoke(
    ["tunnel", "run", "--url", url, tunnelConfig.name],
    { stderr: "pipe" },
  );

  const reader = proc.stderr.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);

    if (text.includes("Registered tunnel connection")) {
      return {
        url: `https://${tunnelConfig.hostname}`,
        kill: proc.kill,
      };
    }

    if (text.includes("credentials file not found")) {
      console.error(
        "Tunnel credentials not found. Run `ahh tunnel configure` to set up.",
      );
      break;
    }
  }

  return {};
}

export async function tunnel(port: number) {
  const config = await getConfig();

  if (config.TUNNEL) {
    return namedTunnel(port, config.TUNNEL);
  }

  return quickTunnel(port);
}
