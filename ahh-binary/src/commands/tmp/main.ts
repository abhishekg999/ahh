import { mkdtemp } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { shell } from "../../externals/shell";
import { color } from "../../utils/text";

export async function createTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), `${prefix}-`));
  return dir;
}

export async function enterTempDir(prefix: string): Promise<void> {
  const dir = await createTempDir(prefix);
  console.log(color(dir, "cyan"));
  console.log(color("Spawning shell. Exit to return.\n", "yellow"));

  const proc = await shell.invoke([], {
    cwd: dir,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
    env: { ...process.env, AHH_TMP: dir },
  });

  await proc.exited;
}
