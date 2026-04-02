import { AHH_WEBHOOK_URL } from "../constants/main";
import { open } from "../externals/open";

export async function openURLInBrowser(
  url: string,
  formatFunc: ((url: string) => string) | null = null,
) {
  if (formatFunc) console.info(formatFunc(url));
  await open.invoke([url]);
}

export async function openAuthenticatedWebhookDashboard(
  token: string,
  webhookUrl: string,
  localPort: number,
) {
  const params = new URLSearchParams({
    token,
    url: webhookUrl,
    ws: `ws://localhost:${localPort}/ws`,
  });
  await openURLInBrowser(`${AHH_WEBHOOK_URL}?${params}`);
}
