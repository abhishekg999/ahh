import { AHH_WEBHOOK_URL } from "../constants/main";

const browser = process.env.BROWSER || "xdg-open";

export async function openURLInBrowser(
  url: string,
  formatFunc: ((url: string) => string) | null = null
) {
  if (formatFunc) console.info(formatFunc(url));
  await Bun.spawn([browser, url]);
}

export async function openAuthenticatedWebhookDashboard(
  token: string,
  webhookUrl: string
) {
  await openURLInBrowser(
    `${AHH_WEBHOOK_URL}?token=${token}&url=${encodeURIComponent(webhookUrl)}`
  );
}
