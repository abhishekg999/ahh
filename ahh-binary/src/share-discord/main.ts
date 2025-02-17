import { input, confirm, select, checkbox } from "@inquirer/prompts";
import { getConfig, updateConfig } from "../config/main";
import { color } from "../utils/text";

export async function sendToDiscord(
  content: string,
  webhookUrl: string
) {
  console.log(color('Preparing to send message to Discord...', 'blue'));
  const payload = { content };
  console.log(color(`Message length: ${content.length} characters`, 'white'));

  try {
    console.log(color('Sending to Discord...', 'yellow'));
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Discord API returned ${response.status}`);
    }
    console.log(color('Successfully sent to Discord!', 'green'));
  } catch (error) {
    console.error(color(`Failed to send to Discord: ${(error as Error).message}`, 'red'));
    throw error;
  }
}

export async function configureWebhook(): Promise<void> {
  while (true) {
    const config = await getConfig();
    const currentWebhooks = config.DISCORD_WEBHOOKS.map(w => ({
      name: `${w.name}${w.name === config.DEFAULT_DISCORD_WEBHOOK ? ' (default)' : ''}`,
      value: w.name
    }));

    const action = await select({
      message: "Webhook Configuration",
      choices: [
        { name: "View Webhooks", value: "VIEW" },
        { name: "Add Webhook", value: "ADD" },
        { name: "Remove Webhook", value: "REMOVE" },
        { name: "Set Default", value: "DEFAULT" },
        { name: "Exit", value: "EXIT" }
      ]
    });

    switch (action) {
      case "VIEW": {
        if (currentWebhooks.length === 0) {
          console.log(color("No webhooks configured.", "yellow"));
        } else {
          console.log(color("\nConfigured Webhooks:", "blue"));
          config.DISCORD_WEBHOOKS.forEach(w => {
            console.log(color(`- ${w.name}${w.name === config.DEFAULT_DISCORD_WEBHOOK ? ' (default)' : ''}\n  URL: ${w.url}`, "white"));
          });
        }
        break;
      }

      case "ADD": {
        const name = await input({
          message: "Enter webhook name:",
          validate: (value) => value.length > 0 ? true : "Name cannot be empty"
        });

        const url = await input({
          message: "Enter Discord webhook URL:",
          validate: (value) => 
            value.startsWith("https://discord.com/api/webhooks/") 
              ? true 
              : "Invalid Discord webhook URL"
        });

        const makeDefault = await confirm({
          message: "Set as default webhook?",
          default: false
        });

        await addWebhook(name, url);
        if (makeDefault) {
          await setDefaultWebhook(name);
        }
        console.log(color(`✓ Added webhook "${name}"${makeDefault ? ' and set as default' : ''}`, "green"));
        break;
      }

      case "REMOVE": {
        if (currentWebhooks.length === 0) {
          console.log(color("No webhooks to remove.", "yellow"));
          break;
        }

        const toRemove = await checkbox({
          message: "Select webhooks to remove:",
          choices: currentWebhooks.map(w => ({
            ...w,
            value: w.value
          }))
        });

        if (toRemove.length > 0) {
          await updateConfig({
            DISCORD_WEBHOOKS: config.DISCORD_WEBHOOKS.filter(w => !toRemove.includes(w.name)),
            ...(toRemove.includes(config.DEFAULT_DISCORD_WEBHOOK ?? "") && {
              DEFAULT_DISCORD_WEBHOOK: undefined
            })
          });
          console.log(color(`✓ Removed ${toRemove.length} webhook(s)`, "green"));
        }
        break;
      }

      case "DEFAULT": {
        if (currentWebhooks.length === 0) {
          console.log(color("No webhooks configured.", "yellow"));
          break;
        }

        const defaultChoice = await select({
          message: "Select default webhook:",
          choices: [
            ...currentWebhooks,
            { name: "Clear default", value: null }
          ]
        });

        await setDefaultWebhook(defaultChoice ?? undefined);
        console.log(color(defaultChoice ? `✓ Set "${defaultChoice}" as default` : "✓ Cleared default webhook", "green"));
        break;
      }

      case "EXIT": {
        return;
      }
    }

    console.log();
  }
}

export async function selectWebhook(): Promise<string> {
  const config = await getConfig();

  if (config.DISCORD_WEBHOOKS.length === 0) {
    throw new Error(
      "No webhooks configured. Use 'ahh share-discord --configure' first."
    );
  }

  if (config.DEFAULT_DISCORD_WEBHOOK) {
    const defaultHook = config.DISCORD_WEBHOOKS.find(
      (w) => w.name === config.DEFAULT_DISCORD_WEBHOOK
    );
    if (defaultHook) return defaultHook.url;
  }

  const webhook = await select({
    message: "Select webhook to use:",
    choices: config.DISCORD_WEBHOOKS.map((w) => ({
      name: w.name,
      value: w.url,
    })),
  });

  return webhook;
}

async function addWebhook(name: string, url: string) {
  const config = await getConfig();
  await updateConfig({
    DISCORD_WEBHOOKS: [...config.DISCORD_WEBHOOKS, { name, url }],
  });
}

async function setDefaultWebhook(name: string | undefined) {
  await updateConfig({
    DEFAULT_DISCORD_WEBHOOK: name,
  });
}
