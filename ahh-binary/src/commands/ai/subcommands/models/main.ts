import Table from "cli-table3";
import { search, select } from "@inquirer/prompts";
import { color, startSpinner } from "../../../../utils/text";
import {
  fetchModels,
  featureTags,
  formatCost,
  formatTokens,
  type LiteLLMModel,
} from "../../lib/litellm";

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
    colWidths: [44, 18, 12, 12, 8],
  });

  table.push([
    m.model_id.length > 43 ? m.model_id.slice(0, 42) + "~" : m.model_id,
    color(m.litellm_provider, "cyan"),
    formatCost(m.input_cost_per_token),
    formatCost(m.output_cost_per_token),
    formatTokens(m.max_input_tokens ?? m.max_tokens),
  ]);

  return table.toString().trim();
}

function printModelDetail(m: LiteLLMModel): void {
  const table = new Table({
    style: { head: [], border: [] },
  });

  table.push({ Model: m.model_id }, { Provider: m.litellm_provider });
  if (m.mode) table.push({ Mode: m.mode });
  table.push(
    { "Input Cost": `${formatCost(m.input_cost_per_token)}/token` },
    { "Output Cost": `${formatCost(m.output_cost_per_token)}/token` },
  );
  if (m.max_input_tokens)
    table.push({ "Max Input": formatTokens(m.max_input_tokens) });
  if (m.max_output_tokens)
    table.push({ "Max Output": formatTokens(m.max_output_tokens) });
  if (m.max_tokens) table.push({ "Max Tokens": formatTokens(m.max_tokens) });
  const features = featureTags(m);
  if (features) table.push({ Features: features });

  console.log(`\n${table.toString()}`);
}

export async function browseModels(): Promise<void> {
  const stopSpinner = startSpinner("Fetching models");
  let allModels: LiteLLMModel[];
  try {
    allModels = await fetchModels();
    stopSpinner();
  } catch (err) {
    stopSpinner();
    throw err;
  }

  console.log(color(`${allModels.length} models loaded.\n`, "green"));

  const mode = await select({
    message: "Filter by mode",
    choices: [
      { name: "Chat models", value: "chat" },
      { name: "Embedding models", value: "embedding" },
      { name: "All models", value: "all" },
    ],
  });

  const models =
    mode === "all"
      ? allModels
      : allModels.filter(
          (m) => m.mode === mode || (!m.mode && mode === "chat"),
        );

  while (true) {
    const modelId = await search({
      message: `Search (${models.length} models)`,
      source: (term) => {
        const q = (term ?? "").toLowerCase();
        const matches = q
          ? models.filter(
              (m) =>
                m.model_id.toLowerCase().includes(q) ||
                m.litellm_provider.toLowerCase().includes(q),
            )
          : models;

        return matches.slice(0, 40).map((m) => ({
          name: formatRow(m),
          value: m.model_id,
        }));
      },
    });

    const model = allModels.find((m) => m.model_id === modelId);
    if (model) printModelDetail(model);

    const next = await select({
      message: "Next",
      choices: [
        { name: "Search again", value: "search" },
        { name: "Exit", value: "exit" },
      ],
    });

    if (next === "exit") break;
    console.log();
  }
}
