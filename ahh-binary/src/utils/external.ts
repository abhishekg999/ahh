import { AHH_WEBHOOK_URL } from "../constants/main";

const browser = process.env.BROWSER || "xdg-open";
const defaultFormatFunc = (url: string) => `Opening ${url} in browser...`;

export async function openURLInBrowser(url: string, formatFunc: (url: string) => string = defaultFormatFunc) {
    console.info(formatFunc(url));
    await Bun.spawn([browser, url]);
}

export async function openAuthenticatedWebhookDashboard(token: string, webhookUrl: string, port: number) {
    await openURLInBrowser(`${AHH_WEBHOOK_URL}?token=${token}&url=${encodeURIComponent(webhookUrl)}&port=${port}`);
}
