/**
 * Spawn a shell command with piped stdout/stderr.
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

/**
 * Stream stdout/stderr from a subprocess line-by-line as they arrive.
 * Calls `onLine` for each line with the stream source.
 * Returns the exit code once the process completes.
 */
export async function streamOutput(
  proc: Bun.ReadableSubprocess,
  onLine: (line: string, stream: "stdout" | "stderr") => void,
): Promise<number> {
  async function pipeLines(
    readable: ReadableStream<Uint8Array>,
    stream: "stdout" | "stderr",
  ) {
    const reader = readable.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        onLine(line, stream);
      }
    }
    if (buffer) onLine(buffer, stream);
  }

  await Promise.all([
    pipeLines(proc.stdout, "stdout"),
    pipeLines(proc.stderr, "stderr"),
  ]);

  return proc.exited;
}
