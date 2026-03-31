import path from "path";
import { confirm } from "@inquirer/prompts";
import { exists } from "../../../../utils/fs";
import { color } from "../../../../utils/text";
import { cloudflared } from "../../../../externals/cloudflared";

const CERT_PATH = path.join(
  process.env.HOME || "/tmp",
  ".cloudflared",
  "cert.pem",
);

export async function isCloudflareLoggedIn(): Promise<boolean> {
  return exists(CERT_PATH);
}

export async function tunnelLogin(): Promise<void> {
  const loggedIn = await isCloudflareLoggedIn();

  if (loggedIn) {
    const reauth = await confirm({
      message: "Already logged in to Cloudflare. Re-authenticate?",
      default: false,
    });
    if (!reauth) return;
  }

  const proc = await cloudflared.invoke(["tunnel", "login"], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await proc.exited;

  if (exitCode === 0) {
    console.log(color("Logged in to Cloudflare.", "green"));
  } else {
    console.error(color("Login failed.", "red"));
  }
}
