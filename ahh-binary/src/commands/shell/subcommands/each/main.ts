import { color } from "../../../../utils/text";
import { spawnShell, collectOutput } from "../../spawn";

export async function eachCommand(command: string[]) {
  const input = await new Response(Bun.stdin.stream()).text();
  const lines = input.trimEnd().split("\n").filter(Boolean);

  if (lines.length === 0) {
    console.error("No input on stdin.");
    process.exit(1);
  }

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

  for (const line of lines) {
    const escaped = `'${line.replace(/'/g, "'\\''")}'`;
    procs.push(spawnShell(`${cmd} ${escaped}`));
  }

  const results = await Promise.allSettled(
    procs.map(async (proc) => {
      return collectOutput(proc);
    }),
  );

  let failures = 0;
  for (const result of results) {
    if (result.status === "rejected") {
      failures++;
      continue;
    }
    const { exitCode, stdout, stderr } = result.value;
    const out = stdout.trimEnd();
    const err = stderr.trimEnd();

    if (exitCode !== 0) failures++;
    if (out) console.info(out);
    if (err) console.error(err);
    if (exitCode !== 0) {
      console.error(color(`exit ${exitCode}`, "red"));
    }
  }

  if (failures > 0) process.exit(1);
}
