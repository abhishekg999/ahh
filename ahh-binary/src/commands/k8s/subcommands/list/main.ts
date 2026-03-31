import { kind } from "../../../../externals/kind";
import { color } from "../../../../utils/text";
import { requireDocker } from "../../lib/docker";

export async function k8sList(): Promise<void> {
  await requireDocker();

  const proc = await kind.invoke(["get", "clusters"], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await proc.exited;
  const stdout = await new Response(proc.stdout).text();

  if (exitCode !== 0) {
    console.error(color("Failed to list clusters.", "red"));
    process.exit(1);
  }

  const clusters = stdout.trim().split("\n").filter(Boolean);

  if (clusters.length === 0) {
    console.log(color("No clusters found.", "yellow"));
    return;
  }

  for (const cluster of clusters) {
    console.log(cluster);
  }
}
