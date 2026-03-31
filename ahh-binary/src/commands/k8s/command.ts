import type { AhhCommand } from "../../types/command";
import { k8sCreateCommand } from "./subcommands/create/command";
import { k8sDeleteCommand } from "./subcommands/delete/command";
import { k8sListCommand } from "./subcommands/list/command";
import { k8sStatusCommand } from "./subcommands/status/command";

export const k8sCommand: AhhCommand = {
  command: "k8s",
  describe: "Kubernetes (kind) cluster management.",
  builder: (yargs) =>
    yargs
      .command(k8sCreateCommand)
      .command(k8sDeleteCommand)
      .command(k8sListCommand)
      .command(k8sStatusCommand)
      .demandCommand(1, "Specify a subcommand: create, delete, list, status"),
  handler: () => {},
};
