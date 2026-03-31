import type { AhhCommand } from "../../../../types/command";
import { k8sList } from "./main";

export const k8sListCommand: AhhCommand = {
  command: "list",
  describe: "List kind clusters.",
  handler: async () => {
    await k8sList();
  },
};
