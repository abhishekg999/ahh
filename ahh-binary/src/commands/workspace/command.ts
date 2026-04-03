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
  meta: {
    description:
      "Scaffolds a new project workspace from a template. Supports multiple workspace types with pre-configured project structure and dependencies.",
    examples: [
      { command: "ahh workspace bun", description: "Initialize a Bun workspace in the current directory" },
      { command: "ahh workspace node -p ./myapp", description: "Initialize a Node workspace at a specific path" },
    ],
    category: "utility",
  },
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
