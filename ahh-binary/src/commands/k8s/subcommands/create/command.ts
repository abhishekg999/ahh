import type { AhhCommand } from "../../../../types/command";
import { k8sCreate } from "./main";

interface CreateArgs {
  name: string;
}

export const k8sCreateCommand: AhhCommand<CreateArgs> = {
  command: "create [name]",
  describe: "Create a kind cluster.",
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
