export const DEV = process.env.IS_LOCAL === "1";

if (DEV) console.log("Running in development mode.");

export const AHH_WEBHOOK_URL =
  process.env.AHH_WEBHOOK_URL ?? "https://cli.ahh.bet/webhook";
  
export const AHH_DOCS_URL =
  process.env.AHH_DOCS_URL ?? "https://cli.ahh.bet/docs";

export const WORKSPACE_DOWNLOAD_PATH = DEV
  ? "https://localhost:3000/workspaces"
  : "https://cli.ahh.bet/workspaces";
