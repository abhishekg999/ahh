const TUNNEL_REGEX = /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/;

function matchTunnelUrl(url: string): string | null {
  const match = url.match(TUNNEL_REGEX);
  if (match) {
    return match[0];
  }
  return null;
}

export async function tunnel(port: number) {
  const url = `http://localhost:${port}`;
  const proc = Bun.spawn(["cloudflared", "tunnel", "--url", url], {
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
        "Rate limited creating free tunnel. Configure a tunnel on your domain to avoid rate limits."
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
