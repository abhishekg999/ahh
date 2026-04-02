/**
 * Spawn a shell command with piped stdout/stderr.
 * Returns a properly typed ReadableSubprocess.
 */
export function spawnShell(cmd: string): Bun.ReadableSubprocess {
  return Bun.spawn(["sh", "-c", cmd], {
    stdout: "pipe",
    stderr: "pipe",
  });
}

export interface SpawnResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Collect all output from a ReadableSubprocess.
 */
export async function collectOutput(
  proc: Bun.ReadableSubprocess,
): Promise<SpawnResult> {
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;
  return { stdout, stderr, exitCode };
}
