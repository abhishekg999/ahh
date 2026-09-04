import { mkdtemp } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { currentInteractiveShellArgs, shell } from "../../externals/shell";
import { color } from "../../utils/text";

export async function createTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), `${prefix}-`));
  return dir;
}

export async function enterTempDir(
  prefix: string,
  loadShellConfig: boolean,
): Promise<void> {
  const dir = await createTempDir(prefix);
  console.log(color(dir, "cyan"));
  const shellMode = loadShellConfig ? "configured" : "clean";
  console.log(
    color(`Spawning ${shellMode} shell. Exit to return.\n`, "yellow"),
  );

  const proc = await shell.invoke(
    currentInteractiveShellArgs(loadShellConfig),
    {
      cwd: dir,
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
      env: { ...process.env, AHH_TMP: dir },
    },
  );

  await proc.exited;
}
