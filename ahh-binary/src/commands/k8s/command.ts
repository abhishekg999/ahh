import type { AhhCommand } from "../../types/command";
import { k8sCreateCommand } from "./subcommands/create/command";
import { k8sDeleteCommand } from "./subcommands/delete/command";
import { k8sListCommand } from "./subcommands/list/command";
import { k8sStatusCommand } from "./subcommands/status/command";

export const k8sCommand: AhhCommand = {
  command: "k8s",
  describe: "Kubernetes (kind) cluster management.",
  meta: {
    description:
      "Manage local Kubernetes clusters using kind (Kubernetes in Docker). Create, delete, list, and inspect clusters without needing to remember kind CLI flags.",
    examples: [
      { command: "ahh k8s create", description: "Create a local cluster" },
      { command: "ahh k8s list", description: "List all clusters" },
      { command: "ahh k8s delete", description: "Delete a cluster" },
    ],
    category: "kubernetes",
  },
  subcommands: [k8sCreateCommand, k8sDeleteCommand, k8sListCommand, k8sStatusCommand],
  builder: (yargs) =>
    yargs
      .command(k8sCreateCommand)
      .command(k8sDeleteCommand)
      .command(k8sListCommand)
      .command(k8sStatusCommand)
      .demandCommand(1, "Specify a subcommand: create, delete, list, status"),
  handler: () => {},
};
