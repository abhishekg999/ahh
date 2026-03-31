import { chmod, unlink } from "fs/promises";
import path from "path";
import { exists, mkdirAlways, resource } from "../utils/fs";
import { OS } from "../utils/os";
import { color, startSpinner } from "../utils/text";
import { ExternalBinary } from "./external-binary";

const VERSION = "v0.27.0";
const BASE_URL = `https://github.com/kubernetes-sigs/kind/releases/download/${VERSION}`;
const BIN_DIR = resource("bin");
const BIN_PATH = path.join(BIN_DIR, "kind");

function getDownloadUrl(): string {
  const arch = process.arch === "arm64" ? "arm64" : "amd64";

  switch (OS) {
    case "darwin":
      return `${BASE_URL}/kind-darwin-${arch}`;
    case "linux":
      return `${BASE_URL}/kind-linux-${arch}`;
    case "win32":
      return `${BASE_URL}/kind-windows-amd64`;
    default:
      throw new Error(`Unsupported platform: ${OS}`);
  }
}

class Kind extends ExternalBinary {
  async exists(): Promise<boolean> {
    return exists(BIN_PATH);
  }

  async install(): Promise<void> {
    const url = getDownloadUrl();
    const stopSpin = startSpinner("Installing kind...");

    try {
      await mkdirAlways(BIN_DIR);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download kind: HTTP ${response.status}`);
      }

      const data = await response.arrayBuffer();
      await Bun.write(BIN_PATH, data);
      await chmod(BIN_PATH, 0o755);
    } catch (error) {
      await unlink(BIN_PATH).catch(() => {});
      throw error;
    } finally {
      stopSpin();
    }

    console.info(color("Installed kind.", "green"));
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
}

export const kind = new Kind();
