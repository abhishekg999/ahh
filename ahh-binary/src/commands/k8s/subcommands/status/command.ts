import type { AhhCommand } from "../../../../types/command";
import { k8sStatus } from "./main";

interface StatusArgs {
  name: string;
}

export const k8sStatusCommand: AhhCommand<StatusArgs> = {
  command: "status [name]",
  describe: "Show kind cluster status.",
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
