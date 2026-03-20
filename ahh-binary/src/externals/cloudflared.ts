import { chmod, unlink } from "fs/promises";
import path from "path";
import { exists, mkdirAlways, resource } from "../utils/fs";
import { OS } from "../utils/os";
import { color, startSpinner } from "../utils/text";
import { ExternalBinary } from "./external-binary";

const VERSION = "2026.3.0";
const BASE_URL = `https://github.com/cloudflare/cloudflared/releases/download/${VERSION}`;
const BIN_DIR = resource("bin");
const BIN_PATH = path.join(BIN_DIR, "cloudflared");

function getDownloadUrl(): string {
  const arch = process.arch === "arm64" ? "arm64" : "amd64";

  switch (OS) {
    case "darwin":
      return `${BASE_URL}/cloudflared-darwin-${arch}.tgz`;
    case "linux":
      return `${BASE_URL}/cloudflared-linux-${arch}`;
    case "win32":
      return `${BASE_URL}/cloudflared-windows-amd64.exe`;
    default:
      throw new Error(`Unsupported platform: ${OS}`);
  }
}

class Cloudflared extends ExternalBinary {
  async exists(): Promise<boolean> {
    return exists(BIN_PATH);
  }

  async install(): Promise<void> {
    const url = getDownloadUrl();
    const stopSpin = startSpinner("Installing cloudflared...");

    try {
      await mkdirAlways(BIN_DIR);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to download cloudflared: HTTP ${response.status}`,
        );
      }

      const data = await response.arrayBuffer();

      if (OS === "darwin") {
        await this.installFromTgz(data);
      } else {
        await Bun.write(BIN_PATH, data);
      }

      await chmod(BIN_PATH, 0o755);
    } catch (error) {
      await unlink(BIN_PATH).catch(() => {});
      throw error;
    } finally {
      stopSpin();
    }

    console.info(color("Installed cloudflared.", "green"));
  }

  async invoke<
    const In extends Bun.SpawnOptions.Writable = "ignore",
    const Out extends Bun.SpawnOptions.Readable = "pipe",
    const Err extends Bun.SpawnOptions.Readable = "inherit",
  >(
    args: string[],
    options?: Bun.SpawnOptions.OptionsObject<In, Out, Err>,
  ): Promise<Bun.Subprocess<In, Out, Err>> {
    if (!(await this.exists())) {
      await this.install();
    }
    return Bun.spawn([BIN_PATH, ...args], options);
  }

  private async installFromTgz(data: ArrayBuffer): Promise<void> {
    const archivePath = `${BIN_PATH}.tmp.tgz`;

    try {
      await Bun.write(archivePath, data);

      const tar = Bun.spawn(
        ["tar", "xzf", archivePath, "-C", BIN_DIR, "cloudflared"],
        { stdout: "ignore", stderr: "pipe" },
      );

      const exitCode = await tar.exited;
      if (exitCode !== 0) {
        throw new Error("Failed to extract cloudflared archive.");
      }
    } finally {
      await unlink(archivePath).catch(() => {});
    }
  }
}

export const cloudflared = new Cloudflared();
