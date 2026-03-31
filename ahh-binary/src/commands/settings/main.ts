import { input, select } from "@inquirer/prompts";
import { getConfig, updateConfig } from "../../config/main";
import type { AppConfig } from "../../config/types";
import { color } from "../../utils/text";
import { configureLLM } from "../ai/subcommands/configure/main";
import { configureWebhook } from "../share-discord/main";
import { tunnelConfigure } from "../tunnel/subcommands/configure/main";
import { tunnelLogin } from "../tunnel/subcommands/login/main";
import { isCloudflareLoggedIn } from "../tunnel/subcommands/login/main";

function tunnelStatus(config: AppConfig): string {
  if (config.TUNNEL) {
    return `${color(config.TUNNEL.name, "cyan")}  ${color(config.TUNNEL.hostname, "cyan")}`;
  }
  return color("not configured", "yellow");
}

function llmStatus(config: AppConfig): string {
  if (config.LLM_MODEL) {
    return color(config.LLM_MODEL, "cyan");
  }
  return color("not configured", "yellow");
}

function webhookStatus(config: AppConfig): string {
  return `port ${color(String(config.DEFAULT_WEBHOOK_HTTP_PORT), "cyan")} / ${color(String(config.DEFAULT_WEBHOOK_HTTPS_PORT), "cyan")}`;
}

function discordStatus(config: AppConfig): string {
  const count = config.DISCORD_WEBHOOKS.length;
  if (count === 0) return color("none", "yellow");
  return `${color(String(count), "cyan")} webhook${count !== 1 ? "s" : ""}`;
}

async function configureWebhookPorts(config: AppConfig): Promise<void> {
  const httpPort = await input({
    message: "HTTP port",
    default: String(config.DEFAULT_WEBHOOK_HTTP_PORT),
    validate: (v) => {
      const n = Number(v);
      return n > 0 && n < 65536 ? true : "Enter a valid port (1-65535)";
    },
  });

  const httpsPort = await input({
    message: "HTTPS port",
    default: String(config.DEFAULT_WEBHOOK_HTTPS_PORT),
    validate: (v) => {
      const n = Number(v);
      return n > 0 && n < 65536 ? true : "Enter a valid port (1-65535)";
    },
  });

  await updateConfig({
    DEFAULT_WEBHOOK_HTTP_PORT: Number(httpPort),
    DEFAULT_WEBHOOK_HTTPS_PORT: Number(httpsPort),
  });
  config.DEFAULT_WEBHOOK_HTTP_PORT = Number(httpPort);
  config.DEFAULT_WEBHOOK_HTTPS_PORT = Number(httpsPort);
  console.log(color("Saved webhook ports.", "green"));
}

async function configureTunnel(): Promise<void> {
  const loggedIn = await isCloudflareLoggedIn();

  const action = await select({
    message: "Tunnel",
    choices: [
      {
        name: loggedIn ? "Login (re-authenticate)" : "Login to Cloudflare",
        value: "LOGIN",
      },
      { name: "Configure tunnel", value: "CONFIGURE" },
      { name: "Back", value: "EXIT" },
    ],
  });

  switch (action) {
    case "LOGIN":
      await tunnelLogin();
      break;
    case "CONFIGURE":
      await tunnelConfigure();
      break;
    case "EXIT":
      return;
  }
}

export async function configureSettings(): Promise<void> {
  while (true) {
    const config = await getConfig();

    console.log(color("\nSettings:", "blue"));
    console.log(`  Tunnel     ${tunnelStatus(config)}`);
    console.log(`  LLM        ${llmStatus(config)}`);
    console.log(`  Webhooks   ${webhookStatus(config)}`);
    console.log(`  Discord    ${discordStatus(config)}\n`);

    const section = await select({
      message: "Settings",
      choices: [
        { name: "Tunnel", value: "TUNNEL" },
        { name: "LLM", value: "LLM" },
        { name: "Webhook Ports", value: "WEBHOOKS" },
        { name: "Discord Webhooks", value: "DISCORD" },
        { name: "Exit", value: "EXIT" },
      ],
    });

    switch (section) {
      case "TUNNEL":
        await configureTunnel();
        break;
      case "LLM":
        await configureLLM();
        break;
      case "WEBHOOKS":
        await configureWebhookPorts(config);
        break;
      case "DISCORD":
        await configureWebhook();
        break;
      case "EXIT":
        return;
    }
  }
}
