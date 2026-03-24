import { SystemBinary } from "./system-binary";

export const shell = new SystemBinary(process.env.SHELL || "bash");
