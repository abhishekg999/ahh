import { getConfig, updateConfig } from "../../config/main";
import type { AppConfig } from "../../config/types";
import { confirm, select, password } from "@inquirer/prompts";
import { color, startSpinner } from "../../utils/text";

type Provider = "openai" | "anthropic";

const DEFAULT_MODELS: Record<Provider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-4-5-20251001",
};

const PROVIDER_MODELS: Record<Provider, string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1-nano"],
  anthropic: [
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-5-20250514",
    "claude-sonnet-4-6-20250627",
  ],
};

interface ResolvedLLM {
  provider: Provider;
  model: string;
  apiKey: string;
  autoExecute: boolean;
}

function getKeyForProvider(
  config: AppConfig,
  provider: Provider,
): string | undefined {
  return provider === "openai"
    ? config.OPENAI_API_KEY
    : config.ANTHROPIC_API_KEY;
}

function resolveModel(config: AppConfig, provider: Provider): string {
  if (config.LLM_MODEL) return config.LLM_MODEL;
  return DEFAULT_MODELS[provider];
}

async function resolveLLM(): Promise<ResolvedLLM> {
  const config = await getConfig();
  const autoExecute = config.LLM_AUTO_EXECUTE ?? false;

  if (config.LLM_PROVIDER && getKeyForProvider(config, config.LLM_PROVIDER)) {
    return {
      provider: config.LLM_PROVIDER,
      model: resolveModel(config, config.LLM_PROVIDER),
      apiKey: getKeyForProvider(config, config.LLM_PROVIDER)!,
      autoExecute,
    };
  }

  if (config.OPENAI_API_KEY) {
    return {
      provider: "openai",
      model: resolveModel(config, "openai"),
      apiKey: config.OPENAI_API_KEY,
      autoExecute,
    };
  }
  if (config.ANTHROPIC_API_KEY) {
    return {
      provider: "anthropic",
      model: resolveModel(config, "anthropic"),
      apiKey: config.ANTHROPIC_API_KEY,
      autoExecute,
    };
  }

  console.log(
    color("No LLM configured. Run 'ahh ai --configure' to set up.\n", "yellow"),
  );
  process.exit(1);
}

export async function configureLLM(): Promise<void> {
  const config = await getConfig();

  while (true) {
    const currentProvider = config.LLM_PROVIDER;
    const currentModel = config.LLM_MODEL;
    const hasOpenAI = !!config.OPENAI_API_KEY;
    const hasAnthropic = !!config.ANTHROPIC_API_KEY;
    const autoExec = config.LLM_AUTO_EXECUTE ?? false;

    console.log(color("\nCurrent LLM Configuration:", "blue"));
    console.log(
      `  Provider      ${currentProvider ? color(currentProvider, "cyan") : color("not set", "yellow")}`,
    );
    console.log(
      `  Model         ${currentModel ? color(currentModel, "cyan") : color("default", "yellow")}`,
    );
    console.log(
      `  Auto-execute  ${autoExec ? color("ON", "red") : color("off", "green")}`,
    );
    console.log(
      `  OpenAI        ${hasOpenAI ? color("configured", "green") : color("not set", "yellow")}`,
    );
    console.log(
      `  Anthropic     ${hasAnthropic ? color("configured", "green") : color("not set", "yellow")}\n`,
    );

    const action = await select({
      message: "LLM Configuration",
      choices: [
        { name: "Set Provider", value: "PROVIDER" },
        { name: "Set Model", value: "MODEL" },
        { name: "Set API Key", value: "KEY" },
        {
          name: `Toggle Auto-Execute (currently ${autoExec ? "ON" : "off"})`,
          value: "AUTO_EXEC",
        },
        { name: "Exit", value: "EXIT" },
      ],
    });

    switch (action) {
      case "PROVIDER": {
        const provider = await select({
          message: "Select provider",
          choices: [
            { name: "OpenAI", value: "openai" as const },
            { name: "Anthropic", value: "anthropic" as const },
          ],
        });
        config.LLM_PROVIDER = provider;
        config.LLM_MODEL = DEFAULT_MODELS[provider];
        await updateConfig({
          LLM_PROVIDER: provider,
          LLM_MODEL: DEFAULT_MODELS[provider],
        });
        console.log(
          color(
            `Set provider to ${provider}, model to ${DEFAULT_MODELS[provider]}`,
            "green",
          ),
        );
        break;
      }

      case "MODEL": {
        const provider = config.LLM_PROVIDER;
        if (!provider) {
          console.log(color("Set a provider first.", "yellow"));
          break;
        }
        const models = PROVIDER_MODELS[provider];
        const model = await select({
          message: `Select ${provider} model`,
          choices: models.map((m) => ({
            name: m + (m === DEFAULT_MODELS[provider] ? " (default)" : ""),
            value: m,
          })),
        });
        config.LLM_MODEL = model;
        await updateConfig({ LLM_MODEL: model });
        console.log(color(`Set model to ${model}`, "green"));
        break;
      }

      case "KEY": {
        const provider = await select({
          message: "Set API key for",
          choices: [
            { name: "OpenAI", value: "openai" as const },
            { name: "Anthropic", value: "anthropic" as const },
          ],
        });
        const apiKey = await password({
          message: `${provider === "openai" ? "OpenAI" : "Anthropic"} API key`,
        });
        if (!apiKey) {
          console.log(color("No key provided.", "yellow"));
          break;
        }
        const update: Partial<AppConfig> =
          provider === "openai"
            ? { OPENAI_API_KEY: apiKey }
            : { ANTHROPIC_API_KEY: apiKey };

        if (!config.LLM_PROVIDER) {
          update.LLM_PROVIDER = provider;
          update.LLM_MODEL = DEFAULT_MODELS[provider];
          config.LLM_PROVIDER = provider;
          config.LLM_MODEL = DEFAULT_MODELS[provider];
        }

        if (provider === "openai") config.OPENAI_API_KEY = apiKey;
        else config.ANTHROPIC_API_KEY = apiKey;

        await updateConfig(update);
        console.log(color(`Saved ${provider} API key.`, "green"));
        break;
      }

      case "AUTO_EXEC": {
        const newValue = !autoExec;
        if (newValue) {
          console.log(
            color(
              "\nWarning: Auto-execute will run generated commands without confirmation.",
              "red",
            ),
          );
          const yes = await confirm({
            message: "Are you sure?",
            default: false,
          });
          if (!yes) break;
        }
        config.LLM_AUTO_EXECUTE = newValue;
        await updateConfig({ LLM_AUTO_EXECUTE: newValue });
        console.log(
          color(
            `Auto-execute ${newValue ? "enabled" : "disabled"}.`,
            newValue ? "red" : "green",
          ),
        );
        break;
      }

      case "EXIT":
        return;
    }

    console.log();
  }
}

const SYSTEM_PROMPT =
  "You are a shell command generator. Given a natural language description, respond with ONLY the shell command. No explanation, no markdown, no backticks. Just the raw command.";

async function callOpenAI(
  apiKey: string,
  model: string,
  prompt: string,
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0,
      max_tokens: 256,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0].message.content.trim();
}

async function callAnthropic(
  apiKey: string,
  model: string,
  prompt: string,
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    content: Array<{ text: string }>;
  };
  return data.content[0].text.trim();
}

async function executeCommand(command: string): Promise<void> {
  console.log();
  const proc = Bun.spawn(["bash", "-c", command], {
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    console.log(color(`\nExited with code ${exitCode}`, "red"));
  }
}

export async function generateCommand(prompt: string): Promise<void> {
  const { provider, model, apiKey, autoExecute } = await resolveLLM();

  console.log(`${color(provider, "cyan")} ${color(model, "yellow")}`);

  const stopSpinner = startSpinner("Thinking");

  let command: string;
  try {
    command =
      provider === "openai"
        ? await callOpenAI(apiKey, model, prompt)
        : await callAnthropic(apiKey, model, prompt);
    stopSpinner();
  } catch (err) {
    stopSpinner();
    throw err;
  }

  console.log(`\n${color("$", "green")} ${color(command, "cyan")}\n`);

  if (autoExecute) {
    await executeCommand(command);
    return;
  }

  const action = await select({
    message: "Run this command?",
    choices: [
      { name: "Run", value: "run" },
      { name: "Copy to clipboard", value: "copy" },
      { name: "Cancel", value: "cancel" },
    ],
  });

  switch (action) {
    case "run":
      await executeCommand(command);
      break;
    case "copy": {
      const ncp = await import("copy-paste");
      ncp.default.copy(command);
      console.log(color("Copied to clipboard.", "green"));
      break;
    }
    case "cancel":
      break;
  }
}
