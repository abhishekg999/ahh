import { color } from "../../../../utils/text";
import { spawnShell, collectOutput, type SpawnResult } from "../../spawn";

export async function raceCommand(commands: string[][]) {
  if (commands.length < 2) {
    console.error("Need at least 2 commands separated by ---");
    process.exit(1);
  }

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

  for (const cmd of commands) {
    procs.push(spawnShell(cmd.join(" ")));
  }

  const pending = procs.map((proc, i) =>
    collectOutput(proc).then((result) => ({ ...result, index: i })),
  );

  type IndexedResult = SpawnResult & { index: number };

  // Wait for first successful result, or all to settle
  const winner = await new Promise<IndexedResult>((resolve) => {
    let settled = 0;
    let lastResult: IndexedResult | null = null;

    for (const p of pending) {
      p.then((result) => {
        settled++;
        lastResult = result;
        if (result.exitCode === 0) resolve(result);
        if (settled === procs.length) resolve(lastResult!);
      });
    }
  });

  // Kill remaining
  for (let i = 0; i < procs.length; i++) {
    if (i !== winner.index) {
      try {
        procs[i].kill();
      } catch {}
    }
  }

  const out = winner.stdout.trimEnd();
  const err = winner.stderr.trimEnd();
  if (out) console.info(out);
  if (err) console.error(err);

  if (winner.exitCode !== 0) {
    console.error(color("All commands failed", "red"));
    process.exit(1);
  }
}

export function splitOnDelimiter(args: (string | number)[]): string[][] {
  const commands: string[][] = [];
  let current: string[] = [];

  for (const arg of args) {
    if (String(arg) === "---") {
      if (current.length > 0) commands.push(current);
      current = [];
    } else {
      current.push(String(arg));
    }
  }
  if (current.length > 0) commands.push(current);

  return commands;
}
