import type { AhhCommand } from "../../../../types/command";
import { k8sDelete } from "./main";

interface DeleteArgs {
  name: string;
}

export const k8sDeleteCommand: AhhCommand<DeleteArgs> = {
  command: "delete [name]",
  describe: "Delete a kind cluster.",
  meta: {
    description:
      "Deletes a local kind Kubernetes cluster. Defaults to the cluster name 'ahh'.",
    examples: [
      { command: "ahh k8s delete", description: "Delete the default 'ahh' cluster" },
      { command: "ahh k8s delete myapp", description: "Delete a cluster named 'myapp'" },
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
    await k8sDelete(argv.name);
  },
};
