import type { AhhCommand } from "../../../../types/command";
import { k8sList } from "./main";

export const k8sListCommand: AhhCommand = {
  command: "list",
  describe: "List kind clusters.",
  meta: {
    description: "Lists all local kind Kubernetes clusters.",
    examples: [
      { command: "ahh k8s list", description: "List all kind clusters" },
    ],
    category: "kubernetes",
  },
  handler: async () => {
    await k8sList();
  },
};
