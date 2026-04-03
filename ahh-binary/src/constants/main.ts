export const VERSION = "1.0.11";

export const DEV = process.env.IS_LOCAL === "1";
export const IS_COMPILED = Bun.main.startsWith("/$bunfs/");

/** Absolute path to the user's home directory. */
export const USER_HOME = process.env.HOME || "/tmp";

/**
 * The base argv prefix to re-invoke this binary as a subprocess.
 * Compiled: ["/abs/path/to/ahh"]
 * Dev:     ["/abs/path/to/bun", "/abs/path/to/main.ts"]
 */
export const BASE_COMMAND: string[] = IS_COMPILED
  ? [process.execPath]
  : [process.execPath, Bun.main];

if (DEV) console.log("Running in development mode.");

export const AHH_WEBHOOK_URL =
  process.env.AHH_WEBHOOK_URL ?? "https://cli.ahh.bet/webhook";

export const AHH_DOCS_URL =
  process.env.AHH_DOCS_URL ?? "https://cli.ahh.bet/docs";

export const WORKSPACE_DOWNLOAD_PATH = DEV
  ? "https://localhost:3000/workspaces"
  : "https://cli.ahh.bet/workspaces";

export const RELEASES_URL =
  "https://github.com/abhishekg999/ahh/releases/latest";

export const INSTALL_SCRIPT_LINK = "https://cli.ahh.bet/install.sh";
export const UPDATE_SCRIPT = `curl -fsSL ${INSTALL_SCRIPT_LINK} | bash`;
