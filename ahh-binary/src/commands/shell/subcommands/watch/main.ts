export async function watchCommand(interval: number, command: string[]) {
  const cmd = command.join(" ");
  let proc: Bun.Subprocess | null = null;
  let running = true;

  const cleanup = () => {
    running = false;
    try {
      proc?.kill();
    } catch {}
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  const dim = "\x1b[2m";
  const reset = "\x1b[0m";

  while (running) {
    // Clear screen and move cursor to top
    process.stdout.write("\x1b[2J\x1b[H");
    console.info(
      `${dim}Every ${interval}s: ${cmd} — ${new Date().toLocaleTimeString()}${reset}\n`,
    );

    proc = Bun.spawn(["sh", "-c", cmd], {
      stdout: "inherit",
      stderr: "inherit",
    });

    await proc.exited;
    proc = null;

    if (!running) break;
    await Bun.sleep(interval * 1000);
  }
}
