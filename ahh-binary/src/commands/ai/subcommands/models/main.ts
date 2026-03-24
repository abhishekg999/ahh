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

const NO_BORDER = {
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
  middle: "  ",
};

const ROW_WIDTHS = [44, 18, 12, 12, 8, 12];

function searchableText(m: LiteLLMModel): string {
  return [m.model_id, m.litellm_provider, m.mode ?? "", featureTags(m)]
    .join(" ")
    .toLowerCase();
}

function formatRow(m: LiteLLMModel): string {
  const table = new Table({
    chars: NO_BORDER,
    style: { "padding-left": 0, "padding-right": 0 },
    colWidths: ROW_WIDTHS,
  });

  const id =
    m.model_id.length > 43 ? m.model_id.slice(0, 42) + "~" : m.model_id;

  table.push([
    id,
    color(m.litellm_provider, "cyan"),
    formatCost(m.input_cost_per_token),
    formatCost(m.output_cost_per_token),
    formatTokens(m.max_input_tokens ?? m.max_tokens),
    m.mode ?? "-",
  ]);

  return table.toString().trim();
}

function printHeader(): void {
  const table = new Table({
    chars: NO_BORDER,
    style: { "padding-left": 0, "padding-right": 0, head: [] },
    colWidths: ROW_WIDTHS,
    head: ["MODEL", "PROVIDER", "INPUT", "OUTPUT", "CONTEXT", "MODE"],
  });

  console.log(color(table.toString().trim(), "bold"));
}

function printModelDetail(m: LiteLLMModel): void {
  const lines: [string, string][] = [
    ["Model", m.model_id],
    ["Provider", m.litellm_provider],
  ];
  if (m.mode) lines.push(["Mode", m.mode]);
  lines.push(
    ["Input", `${formatCost(m.input_cost_per_token)}/token`],
    ["Output", `${formatCost(m.output_cost_per_token)}/token`],
  );
  if (m.max_input_tokens)
    lines.push(["Max Input", formatTokens(m.max_input_tokens)]);
  if (m.max_output_tokens)
    lines.push(["Max Output", formatTokens(m.max_output_tokens)]);
  if (m.max_tokens) lines.push(["Max Tokens", formatTokens(m.max_tokens)]);
  const features = featureTags(m);
  if (features) lines.push(["Features", features]);

  console.log();
  for (const [label, value] of lines) {
    console.log(`  ${color(label.padEnd(12), "yellow")} ${value}`);
  }
}

export async function browseModels(): Promise<void> {
  const stopSpinner = startSpinner("Fetching models");
  let models: LiteLLMModel[];
  try {
    models = await fetchModels();
    stopSpinner();
  } catch (err) {
    stopSpinner();
    throw err;
  }

  console.log(color(`${models.length} models loaded.\n`, "green"));

  // Pre-compute search index
  const searchIndex = models.map((m) => ({
    model: m,
    text: searchableText(m),
  }));

  printHeader();

  while (true) {
    const modelId = await search({
      message: `Search (${models.length} models)`,
      source: (term) => {
        const q = (term ?? "").toLowerCase();
        const matches = q
          ? searchIndex.filter((e) => e.text.includes(q))
          : searchIndex;

        return [
          {
            name: color(`${matches.length} results`, "yellow"),
            value: "",
            disabled: true,
          },
          ...matches.map((e) => ({
            name: formatRow(e.model),
            value: e.model.model_id,
          })),
        ];
      },
    });

    const model = models.find((m) => m.model_id === modelId);
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
    printHeader();
  }
}
