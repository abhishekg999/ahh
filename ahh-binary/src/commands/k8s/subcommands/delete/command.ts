import type { AhhCommand } from "../../../../types/command";
import { k8sDelete } from "./main";

interface DeleteArgs {
  name: string;
}

export const k8sDeleteCommand: AhhCommand<DeleteArgs> = {
  command: "delete [name]",
  describe: "Delete a kind cluster.",
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
