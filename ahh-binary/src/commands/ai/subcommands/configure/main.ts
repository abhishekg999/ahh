import Table from "cli-table3";
import { confirm, input, password, search, select } from "@inquirer/prompts";
import { getConfig, updateConfig } from "../../../../config/main";
import type { AppConfig } from "../../../../config/types";
import { color, startSpinner } from "../../../../utils/text";
import {
  fetchModels,
  formatCost,
  formatTokens,
  PROVIDER_MAP,
  type LiteLLMModel,
} from "../../lib/litellm";

const PROVIDER_PRESETS = Object.keys(PROVIDER_MAP);

function formatRow(m: LiteLLMModel): string {
  const table = new Table({
    chars: {
      top: "",
      "top-mid": "",
      "top-left": "",
      "top-right": "",
      bottom: "",
      "bottom-mid": "",
      "bottom-left": "",
      "bottom-right": "",
      left: "",
      "left-mid": "",
      mid: "",
      "mid-mid": "",
      right: "",
      "right-mid": "",
      middle: " ",
    },
    style: { "padding-left": 0, "padding-right": 1 },
    colWidths: [44, 12, 12, 8],
  });

  table.push([
    m.model_id.length > 43 ? m.model_id.slice(0, 42) + "~" : m.model_id,
    formatCost(m.input_cost_per_token),
    formatCost(m.output_cost_per_token),
    formatTokens(m.max_input_tokens ?? m.max_tokens),
  ]);

  return table.toString().trim();
}

async function pickModelFromLiteLLM(provider?: string): Promise<string | null> {
  const stopSpinner = startSpinner("Fetching models");
  let models: LiteLLMModel[];
  try {
    models = await fetchModels();
    stopSpinner();
  } catch (err) {
    stopSpinner();
    console.log(color(`Failed to fetch models: ${err}`, "red"));
    return null;
  }

  let filtered = models.filter((m) => !m.mode || m.mode === "chat");
  if (provider) {
    filtered = filtered.filter((m) => m.litellm_provider === provider);
  }

  if (filtered.length === 0) {
    console.log(color("No matching models found.", "yellow"));
    return null;
  }

  const result = await search({
    message: `Search models (${filtered.length} available)`,
    source: (term) => {
      const q = (term ?? "").toLowerCase();
      const matches = q
        ? filtered.filter((m) => m.model_id.toLowerCase().includes(q))
        : filtered;

      return matches.slice(0, 40).map((m) => ({
        name: formatRow(m),
        value: m.model_id,
      }));
    },
  });

  return result;
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
        { name: "Quick Setup (from presets)", value: "PRESET" },
        { name: "Set Base URL", value: "BASE_URL" },
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
        const baseURL = await select({
          message: "Select provider",
          choices: PROVIDER_PRESETS.map((url) => ({
            name: `${PROVIDER_MAP[url]} (${url})`,
            value: url,
          })),
        });

        const apiKey = await password({ message: "API key" });
        if (!apiKey) {
          console.log(color("No key provided.", "yellow"));
          break;
        }

        const provider = PROVIDER_MAP[baseURL];
        const model = await pickModelFromLiteLLM(provider);
        if (!model) break;

        config.LLM_BASE_URL = baseURL;
        config.LLM_API_KEY = apiKey;
        config.LLM_MODEL = model;
        await updateConfig({
          LLM_BASE_URL: baseURL,
          LLM_API_KEY: apiKey,
          LLM_MODEL: model,
        });
        console.log(
          color(`Configured ${provider} with model ${model}.`, "green"),
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
        const provider = config.LLM_BASE_URL
          ? PROVIDER_MAP[config.LLM_BASE_URL]
          : undefined;
        const model = await pickModelFromLiteLLM(provider);

        if (!model) break;
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
