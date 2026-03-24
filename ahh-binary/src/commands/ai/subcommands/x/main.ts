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

const SYSTEM_PROMPT =
  "You are a shell command generator. Given a natural language description, respond with ONLY the shell command. No explanation, no markdown, no backticks. Just the raw command.";

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
