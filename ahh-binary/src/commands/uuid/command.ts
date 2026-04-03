import type { AhhCommand } from "../../types/command";
import { generateUUIDv4, generateUUIDv7 } from "./main";

interface UuidArgs {
  v7: boolean;
  count: number;
}

export const uuidCommand: AhhCommand<UuidArgs> = {
  command: "uuid",
  describe: "Generate UUIDs.",
  meta: {
    description:
      "Generate one or more UUIDs. Defaults to v4 (random). Use --v7 for time-sortable UUIDs that are monotonically increasing.",
    examples: [
      { command: "ahh uuid", description: "Generate a single UUIDv4" },
      { command: "ahh uuid --v7", description: "Generate a time-sortable UUIDv7" },
      { command: "ahh uuid -n 5", description: "Generate 5 UUIDs" },
    ],
    category: "generation",
  },
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
