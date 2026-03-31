import { kind } from "../../../../externals/kind";
import { color, startSpinner } from "../../../../utils/text";
import { requireDocker } from "../../lib/docker";

export async function k8sCreate(name: string): Promise<void> {
  await requireDocker();

  const stopSpin = startSpinner(`Creating cluster ${name}...`);
  const proc = await kind.invoke(["create", "cluster", "--name", name], {
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await proc.exited;
  stopSpin();

  if (exitCode !== 0) {
    console.error(color("Failed to create cluster.", "red"));
    process.exit(1);
  }
}
