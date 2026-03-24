import { mkdtemp } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { color } from "../../utils/text";

export async function createTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), `${prefix}-`));
  return dir;
}

export async function enterTempDir(prefix: string): Promise<void> {
  const dir = await createTempDir(prefix);
  const shell = process.env.SHELL || "bash";

  console.log(color(dir, "cyan"));
  console.log(color("Spawning shell. Exit to return.\n", "yellow"));

  const proc = Bun.spawn([shell], {
    cwd: dir,
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
    env: { ...process.env, AHH_TMP: dir },
  });

  await proc.exited;
}
