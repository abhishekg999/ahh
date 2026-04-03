import { color } from "../../../../utils/text";
import { spawnShell, streamOutput } from "../../spawn";

export async function retryCommand(count: number, command: string[]) {
  const cmd = command.join(" ");

  let currentProc: Bun.ReadableSubprocess | null = null;

  const cleanup = () => {
    try {
      currentProc?.kill();
    } catch {}
    process.exit(130);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  for (let attempt = 0; attempt < count; attempt++) {
    currentProc = spawnShell(cmd);
    const exitCode = await streamOutput(currentProc, (line, stream) => {
      const out = stream === "stderr" ? process.stderr : process.stdout;
      out.write(`${line}\n`);
    });

    if (exitCode === 0) return;

    if (attempt < count - 1) {
      console.error(color(`failed (exit ${exitCode}), retrying...`, "yellow"));
    } else {
      console.error(color(`failed (exit ${exitCode})`, "red"));
      process.exit(exitCode);
    }
  }
}
