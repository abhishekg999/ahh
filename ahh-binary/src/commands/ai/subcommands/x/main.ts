import OpenAI from "openai";
import { select } from "@inquirer/prompts";
import { getConfig } from "../../../../config/main";
import { bash } from "../../../../externals/bash";
import { color, startSpinner } from "../../../../utils/text";

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
    color("No LLM configured. Run 'ahh ai configure' to set up.\n", "yellow"),
  );
  process.exit(1);
}

const SYSTEM_PROMPT = `You are a shell command generator. Respond with ONLY the command. No explanation, no markdown, no backticks, no commentary. Just the raw command.

Rules:
- Output exactly one shell command (use && or | to chain if needed)
- Use standard POSIX utilities when possible
- Prefer simple, readable commands over clever one-liners
- Never output destructive commands (rm -rf /, mkfs, dd of=/dev) without explicit user intent
- If the request is ambiguous, pick the most common interpretation`;

function buildContext(): string {
  const parts: string[] = [];
  parts.push(`OS: ${process.platform} ${process.arch}`);
  parts.push(`Shell: ${process.env.SHELL ?? "unknown"}`);
  parts.push(`CWD: ${process.cwd()}`);
  if (process.env.HOME) parts.push(`HOME: ${process.env.HOME}`);
  return parts.join("\n");
}

async function executeCommand(command: string): Promise<void> {
  console.log();
  const proc = await bash.invoke(["-c", command], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
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
    const systemContent = `${SYSTEM_PROMPT}\n\nEnvironment:\n${buildContext()}`;
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemContent },
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
