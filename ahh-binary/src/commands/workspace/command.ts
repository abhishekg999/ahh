import type { AhhCommand } from "../../types/command";
import { startSpinner } from "../../utils/text";
import { WORKSPACE_CHOICES } from "./choices";
import { initWorkspace } from "./main";

interface WorkspaceArgs {
  name: string;
  path?: string;
}

export const workspaceCommand: AhhCommand<WorkspaceArgs> = {
  command: "workspace <name>",
  describe: "Initialize a workspace.",
  builder: (yargs) =>
    yargs
      .positional("name", {
        type: "string",
        description: "Name of the workspace",
        demandOption: true,
        choices: WORKSPACE_CHOICES,
      })
      .option("path", {
        alias: "p",
        type: "string",
        description: "Path to load the workspace",
      }),
  handler: async (argv) => {
    const { name, path } = argv;
    const stopSpin = startSpinner("Initializing workspace...");
    await initWorkspace(name, path);
    stopSpin();
    console.log("Workspace initialized.");
  },
};
