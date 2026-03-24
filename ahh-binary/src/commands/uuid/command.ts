import type { AhhCommand } from "../../types/command";
import { generateUUIDv4, generateUUIDv7 } from "./main";

interface UuidArgs {
  v7: boolean;
  count: number;
}

export const uuidCommand: AhhCommand<UuidArgs> = {
  command: "uuid",
  describe: "Generate UUIDs.",
  builder: (yargs) =>
    yargs
      .option("v7", {
        type: "boolean",
        description: "Generate UUIDv7 (time-sortable)",
        default: false,
      })
      .option("count", {
        alias: "n",
        type: "number",
        description: "Number of UUIDs to generate",
        default: 1,
      }),
  handler: async (argv) => {
    const gen = argv.v7 ? generateUUIDv7 : generateUUIDv4;
    for (let i = 0; i < argv.count; i++) {
      console.log(gen());
    }
  },
};
