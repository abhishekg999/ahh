import { kind } from "../../../../externals/kind";
import { color } from "../../../../utils/text";
import { requireDocker } from "../../lib/docker";

export async function k8sStatus(name: string): Promise<void> {
  await requireDocker();

  const proc = await kind.invoke(["get", "nodes", "--name", name], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await proc.exited;
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();

  if (exitCode !== 0) {
    if (stderr.includes("no kind nodes found")) {
      console.error(color(`Cluster "${name}" not found.`, "yellow"));
    } else {
      console.error(color(stderr.trim(), "red"));
    }
    process.exit(1);
  }

  const nodes = stdout.trim().split("\n").filter(Boolean);

  if (nodes.length === 0) {
    console.log(color(`No nodes in cluster "${name}".`, "yellow"));
    return;
  }

  console.log(color(`Cluster: ${name}`, "blue"));
  for (const node of nodes) {
    console.log(`  ${node}`);
  }
}
