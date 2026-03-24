import OpenAI from "openai";
import { confirm, input, select, password } from "@inquirer/prompts";
import { getConfig, updateConfig } from "../../config/main";
import type { AppConfig } from "../../config/types";
import { color, startSpinner } from "../../utils/text";

const PRESETS: Record<string, { baseURL: string; models: string[] }> = {
  OpenAI: {
    baseURL: "https://api.openai.com/v1",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1-nano"],
  },
  Anthropic: {
    baseURL: "https://api.anthropic.com/v1",
    models: [
      "claude-haiku-4-5-20251001",
      "claude-sonnet-4-5-20250514",
      "claude-sonnet-4-6-20250627",
    ],
  },
};

interface ResolvedLLM {
  baseURL: string;
  apiKey: string;
  model: string;
  autoExecute: boolean;
}

async function resolveLLM(): Promise<ResolvedLLM> {
  const config = await getConfig();

  if (config.LLM_API_KEY && config.LLM_BASE_URL && config.LLM_MODEL) {
    return {
      baseURL: config.LLM_BASE_URL,
      apiKey: config.LLM_API_KEY,
      model: config.LLM_MODEL,
      autoExecute: config.LLM_AUTO_EXECUTE ?? false,
    };
  }

  console.log(
    color(
      "No LLM configured. Run 'ahh ai --configure' to set up.\n",
      "yellow",
    ),
  );
  process.exit(1);
}

export async function configureLLM(): Promise<void> {
  const config = await getConfig();

  while (true) {
    const autoExec = config.LLM_AUTO_EXECUTE ?? false;

    console.log(color("\nLLM Configuration:", "blue"));
    console.log(
      `  Base URL      ${config.LLM_BASE_URL ? color(config.LLM_BASE_URL, "cyan") : color("not set", "yellow")}`,
    );
    console.log(
      `  API Key       ${config.LLM_API_KEY ? color("configured", "green") : color("not set", "yellow")}`,
    );
    console.log(
      `  Model         ${config.LLM_MODEL ? color(config.LLM_MODEL, "cyan") : color("not set", "yellow")}`,
    );
    console.log(
      `  Auto-execute  ${autoExec ? color("ON", "red") : color("off", "green")}\n`,
    );

    const action = await select({
      message: "LLM Configuration",
      choices: [
        { name: "Set Provider (from presets)", value: "PRESET" },
        { name: "Set Base URL (custom endpoint)", value: "BASE_URL" },
        { name: "Set API Key", value: "KEY" },
        { name: "Set Model", value: "MODEL" },
        {
          name: `Toggle Auto-Execute (currently ${autoExec ? "ON" : "off"})`,
          value: "AUTO_EXEC",
        },
        { name: "Exit", value: "EXIT" },
      ],
    });

    switch (action) {
      case "PRESET": {
        const presetName = await select({
          message: "Select provider",
          choices: Object.keys(PRESETS).map((name) => ({ name, value: name })),
        });
        const preset = PRESETS[presetName];
        const model = await select({
          message: "Select model",
          choices: preset.models.map((m) => ({ name: m, value: m })),
        });
        const apiKey = await password({ message: "API key" });
        if (!apiKey) {
          console.log(color("No key provided.", "yellow"));
          break;
        }

        config.LLM_BASE_URL = preset.baseURL;
        config.LLM_API_KEY = apiKey;
        config.LLM_MODEL = model;
        await updateConfig({
          LLM_BASE_URL: preset.baseURL,
          LLM_API_KEY: apiKey,
          LLM_MODEL: model,
        });
        console.log(
          color(`Configured ${presetName} with model ${model}.`, "green"),
        );
        break;
      }

      case "BASE_URL": {
        const baseURL = await input({
          message: "OpenAI-compatible base URL",
          default: config.LLM_BASE_URL,
          validate: (v) =>
            v.startsWith("http://") || v.startsWith("https://")
              ? true
              : "Must be a valid URL",
        });
        config.LLM_BASE_URL = baseURL;
        await updateConfig({ LLM_BASE_URL: baseURL });
        console.log(color(`Set base URL to ${baseURL}`, "green"));
        break;
      }

      case "KEY": {
        const apiKey = await password({ message: "API key" });
        if (!apiKey) {
          console.log(color("No key provided.", "yellow"));
          break;
        }
        config.LLM_API_KEY = apiKey;
        await updateConfig({ LLM_API_KEY: apiKey });
        console.log(color("Saved API key.", "green"));
        break;
      }

      case "MODEL": {
        const preset = Object.values(PRESETS).find(
          (p) => p.baseURL === config.LLM_BASE_URL,
        );
        let model: string;
        if (preset) {
          model = await select({
            message: "Select model",
            choices: [
              ...preset.models.map((m) => ({ name: m, value: m })),
              { name: "Custom...", value: "__custom__" },
            ],
          });
          if (model === "__custom__") {
            model = await input({ message: "Model name" });
          }
        } else {
          model = await input({
            message: "Model name",
            default: config.LLM_MODEL,
          });
        }
        config.LLM_MODEL = model;
        await updateConfig({ LLM_MODEL: model });
        console.log(color(`Set model to ${model}`, "green"));
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
  const { baseURL, apiKey, model, autoExecute } = await resolveLLM();

  console.log(`${color(baseURL, "cyan")} ${color(model, "yellow")}`);

  const client = new OpenAI({ baseURL, apiKey });
  const stopSpinner = startSpinner("Thinking");

  let command: string;
  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0,
      max_tokens: 256,
    });
    stopSpinner();
    command = completion.choices[0].message.content?.trim() ?? "";
  } catch (err) {
    stopSpinner();
    throw err;
  }

  if (!command) {
    console.log(color("No command generated.", "yellow"));
    return;
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
