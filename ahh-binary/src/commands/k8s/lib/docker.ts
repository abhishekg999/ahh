import { color } from "../../../utils/text";

export async function requireDocker(): Promise<void> {
  if (!Bun.which("docker")) {
    console.error(color("Docker is not installed.", "red"));
    process.exit(1);
  }

  const proc = Bun.spawn(["docker", "info"], {
    stdout: "ignore",
    stderr: "ignore",
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    console.error(
      color(
        "Docker is not running. Start the Docker daemon and try again.",
        "red",
      ),
    );
    process.exit(1);
  }
}
