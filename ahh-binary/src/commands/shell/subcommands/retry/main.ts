import { color } from "../../../../utils/text";
import { spawnShell, collectOutput } from "../../spawn";

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
    const { stdout, stderr, exitCode } = await collectOutput(currentProc);

    const out = stdout.trimEnd();
    const err = stderr.trimEnd();

    if (out) console.info(out);
    if (err) console.error(err);

    if (exitCode === 0) return;

    if (attempt < count - 1) {
      console.error(color(`failed (exit ${exitCode}), retrying...`, "yellow"));
    } else {
      console.error(color(`failed (exit ${exitCode})`, "red"));
      process.exit(exitCode);
    }
  }
}
