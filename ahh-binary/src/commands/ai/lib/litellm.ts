import { exists, resource } from "../../../utils/fs";

const LITELLM_URL =
  "https://raw.githubusercontent.com/BerriAI/litellm/refs/heads/main/model_prices_and_context_window.json";

const CACHE_FILE = resource("ai/models.json");
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

export interface LiteLLMModel {
  model_id: string;
  litellm_provider: string;
  mode?: string;
  input_cost_per_token?: number;
  output_cost_per_token?: number;
  max_tokens?: number;
  max_input_tokens?: number;
  max_output_tokens?: number;
  supports_vision?: boolean;
  supports_function_calling?: boolean;
  supports_reasoning?: boolean;
  supports_prompt_caching?: boolean;
  supports_response_schema?: boolean;
  supports_system_messages?: boolean;
}

interface CacheEnvelope {
  fetched_at: number;
  models: LiteLLMModel[];
}

function parseRawModels(
  raw: Record<string, Record<string, unknown>>,
): LiteLLMModel[] {
  const models: LiteLLMModel[] = [];
  for (const [id, data] of Object.entries(raw)) {
    if (id === "sample_spec" || typeof data !== "object" || !data) continue;
    models.push({
      model_id: id,
      litellm_provider: (data.litellm_provider as string) ?? "unknown",
      mode: data.mode as string | undefined,
      input_cost_per_token: data.input_cost_per_token as number | undefined,
      output_cost_per_token: data.output_cost_per_token as number | undefined,
      max_tokens: data.max_tokens as number | undefined,
      max_input_tokens: data.max_input_tokens as number | undefined,
      max_output_tokens: data.max_output_tokens as number | undefined,
      supports_vision: data.supports_vision as boolean | undefined,
      supports_function_calling: data.supports_function_calling as
        | boolean
        | undefined,
      supports_reasoning: data.supports_reasoning as boolean | undefined,
      supports_prompt_caching: data.supports_prompt_caching as
        | boolean
        | undefined,
      supports_response_schema: data.supports_response_schema as
        | boolean
        | undefined,
      supports_system_messages: data.supports_system_messages as
        | boolean
        | undefined,
    });
  }
  return models;
}

async function readCache(): Promise<LiteLLMModel[] | null> {
  if (!(await exists(CACHE_FILE))) return null;
  try {
    const text = await Bun.file(CACHE_FILE).text();
    const envelope: CacheEnvelope = JSON.parse(text);
    if (Date.now() - envelope.fetched_at > CACHE_TTL_MS) return null;
    return envelope.models;
  } catch {
    return null;
  }
}

async function writeCache(models: LiteLLMModel[]): Promise<void> {
  const envelope: CacheEnvelope = { fetched_at: Date.now(), models };
  await Bun.file(CACHE_FILE).write(JSON.stringify(envelope));
}

export async function fetchModels(): Promise<LiteLLMModel[]> {
  const cached = await readCache();
  if (cached) return cached;

  const res = await fetch(LITELLM_URL);
  if (!res.ok) throw new Error(`Failed to fetch litellm models: ${res.status}`);

  const raw = (await res.json()) as Record<string, Record<string, unknown>>;
  const models = parseRawModels(raw);
  await writeCache(models);
  return models;
}

export function formatCost(cost: number | undefined): string {
  if (cost === undefined) return "-";
  if (cost === 0) return "Free";
  if (cost < 0.000001) return `$${cost.toExponential(2)}`;
  return `$${cost.toFixed(6)}`;
}

export function formatTokens(tokens: number | undefined): string {
  if (tokens === undefined) return "-";
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`;
  return tokens.toString();
}

export function featureTags(m: LiteLLMModel): string {
  const tags: string[] = [];
  if (m.supports_vision) tags.push("vision");
  if (m.supports_function_calling) tags.push("tools");
  if (m.supports_reasoning) tags.push("reasoning");
  if (m.supports_prompt_caching) tags.push("cache");
  if (m.supports_response_schema) tags.push("schema");
  return tags.join(", ");
}

/** Map a base URL to its exact litellm_provider prefix for filtering. */
export const PROVIDER_MAP: Record<string, string> = {
  "https://api.openai.com/v1": "openai",
  "https://api.anthropic.com/v1": "anthropic",
};
