import { color } from "../../../../utils/text";
import { spawnShell, collectOutput } from "../../spawn";

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

  const results = await Promise.allSettled(
    procs.map(async (proc, i) => {
      const { stdout, stderr, exitCode } = await collectOutput(proc);
      return { i, exitCode, stdout, stderr };
    }),
  );

  let failures = 0;
  for (const result of results) {
    if (result.status === "rejected") {
      failures++;
      continue;
    }
    const { i, exitCode, stdout, stderr } = result.value;
    const prefix = `[${i}]`;
    const out = stdout.trimEnd();
    const err = stderr.trimEnd();

    if (exitCode !== 0) failures++;
    if (out) {
      for (const line of out.split("\n")) {
        console.info(`${prefix} ${line}`);
      }
    }
    if (err) {
      for (const line of err.split("\n")) {
        console.error(`${prefix} ${line}`);
      }
    }
    if (exitCode !== 0) {
      console.error(color(`${prefix} exit ${exitCode}`, "red"));
    }
  }

  if (failures > 0) process.exit(1);
}
