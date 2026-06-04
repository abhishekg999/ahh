import { AHH_WEBHOOK_URL } from "../constants/main";
import { open } from "../externals/open";

export async function openURLInBrowser(
  url: string,
  formatFunc: ((url: string) => string) | null = null,
) {
  if (formatFunc) console.info(formatFunc(url));
  await open.invoke([url]);
}

/**
 * Build the WebSocket URL for the webhook dashboard.
 *
 * Quick tunnel (https://x.trycloudflare.com):
 *   → wss://x.trycloudflare.com/ws  (same origin, SSL provided by Cloudflare)
 *
 * Named tunnel (http://sub.tunnel.ahh.bet):
 *   → wss://tunnel.ahh.bet/ws/<sub>  (route through SSL-enabled root domain)
 *   The 4th-level subdomain (*.tunnel.ahh.bet) has no SSL cert,
 *   but the root (tunnel.ahh.bet) is covered by the *.ahh.bet wildcard.
 *   The daemon router proxies /ws/<sub> to the correct local server.
 */
function buildWsUrl(
  webhookUrl: string,
  subdomain?: string,
): string {
  if (subdomain) {
    // Named tunnel — extract base hostname from the URL
    const url = new URL(webhookUrl);
    const parts = url.hostname.split(".");
    // sub.tunnel.ahh.bet → tunnel.ahh.bet
    const baseHostname = parts.slice(1).join(".");
    return `wss://${baseHostname}/ws/${subdomain}`;
  }
  // Quick tunnel — wss on the same origin
  return webhookUrl.replace(/^https:\/\//, "wss://") + "/ws";
}

export async function openAuthenticatedWebhookDashboard(
  token: string,
  webhookUrl: string,
  subdomain?: string,
) {
  const wsUrl = buildWsUrl(webhookUrl, subdomain);

  const params = new URLSearchParams({
    token,
    url: webhookUrl,
    ws: wsUrl,
  });

  // Always use the hosted HTTPS dashboard — WSS is guaranteed in both modes
  await openURLInBrowser(`${AHH_WEBHOOK_URL}?${params}`);
}
