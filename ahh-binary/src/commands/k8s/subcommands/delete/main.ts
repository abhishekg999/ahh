import { kind } from "../../../../externals/kind";
import { color } from "../../../../utils/text";
import { requireDocker } from "../../lib/docker";

export async function k8sDelete(name: string): Promise<void> {
  await requireDocker();

  const proc = await kind.invoke(["delete", "cluster", "--name", name], {
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    console.error(color("Failed to delete cluster.", "red"));
    process.exit(1);
  }
}
