import type { AhhCommand } from "../../../../types/command";
import { k8sStatus } from "./main";

interface StatusArgs {
  name: string;
}

export const k8sStatusCommand: AhhCommand<StatusArgs> = {
  command: "status [name]",
  describe: "Show kind cluster status.",
  meta: {
    description:
      "Shows the status of a local kind Kubernetes cluster including node readiness. Defaults to the cluster name 'ahh'.",
    examples: [
      { command: "ahh k8s status", description: "Show status of the default cluster" },
      { command: "ahh k8s status myapp", description: "Show status of 'myapp' cluster" },
    ],
    category: "kubernetes",
  },
  builder: (yargs) =>
    yargs.positional("name", {
      type: "string",
      description: "Cluster name",
      default: "ahh",
    }),
  handler: async (argv) => {
    await k8sStatus(argv.name);
  },
};
