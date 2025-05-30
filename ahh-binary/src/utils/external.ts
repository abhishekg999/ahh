import { AHH_WEBHOOK_URL } from "../constants/main";
import { isSupportedOS, OS } from "./os";

const DEFAULT_BROWSER = {
  darwin: "open",
  win32: "start",
  linux: "xdg-open",
} as const;

function getDefaultBrowser() {
  if (isSupportedOS(OS)) {
    return DEFAULT_BROWSER[OS];
  }
  return DEFAULT_BROWSER.linux;
}

const browser = process.env.BROWSER || getDefaultBrowser();

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
