import { color } from "../../../../utils/text";
import { spawnShell, streamOutput } from "../../spawn";

export async function repeatCommand(count: number, command: string[]) {
  const cmd = command.join(" ");
  const procs: Bun.ReadableSubprocess[] = [];

  const cleanup = () => {
    for (const proc of procs) {
      try {
        proc.kill();
      } catch {}
    }
    process.exit(130);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  for (let i = 0; i < count; i++) {
    procs.push(spawnShell(cmd));
  }

  const exitCodes = await Promise.all(
    procs.map((proc, i) => {
      const prefix = `[${i}]`;
      return streamOutput(proc, (line, stream) => {
        const out = stream === "stderr" ? process.stderr : process.stdout;
        out.write(`${prefix} ${line}\n`);
      });
    }),
  );

  const failures = exitCodes.filter((c) => c !== 0);
  for (let i = 0; i < exitCodes.length; i++) {
    if (exitCodes[i] !== 0) {
      console.error(color(`[${i}] exit ${exitCodes[i]}`, "red"));
    }
  }

  if (failures.length > 0) process.exit(1);
}
