import type { AhhCommand } from "../../../../types/command";
import { k8sCreate } from "./main";

interface CreateArgs {
  name: string;
}

export const k8sCreateCommand: AhhCommand<CreateArgs> = {
  command: "create [name]",
  describe: "Create a kind cluster.",
  meta: {
    description:
      "Creates a new local Kubernetes cluster using kind. Defaults to the cluster name 'ahh'.",
    examples: [
      { command: "ahh k8s create", description: "Create a cluster named 'ahh'" },
      { command: "ahh k8s create myapp", description: "Create a cluster named 'myapp'" },
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
    await k8sCreate(argv.name);
  },
};
