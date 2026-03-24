import type { AhhCommand } from "../../types/command";
import {
  INSTALL_SCRIPT_LINK,
  RELEASES_URL,
  UPDATE_SCRIPT,
  VERSION,
} from "../../constants/main";
import { bash } from "../../externals/bash";
import { curl } from "../../externals/curl";
import { isSemver, semverCompare } from "../../utils/semver";
import { color } from "../../utils/text";

export const updateCommand: AhhCommand = {
  command: "update",
  describe: "Update the CLI.",
  handler: async () => {
    const doError = (): void => {
      console.error("Unexpected response from server.");
      console.log("You can manually update using:");
      console.log(color(UPDATE_SCRIPT, "magenta"));
    };

    const release = await fetch(RELEASES_URL, { redirect: "manual" });
    if (release.status !== 302) {
      return doError();
    }

    const location = release.headers.get("location");
    if (!location) {
      return doError();
    }
    const versionMatch = location.match(/tag\/ahh_v(\d+\.\d+\.\d+)/);
    const latestVersion = versionMatch ? versionMatch[1] : null;
    if (!latestVersion) {
      return doError();
    }

    if (!isSemver(latestVersion)) {
      return doError();
    }

    if (semverCompare(VERSION, latestVersion, ">=")) {
      console.info(
        color(`You are already on the latest version (v${VERSION}).`, "green"),
      );
      return;
    } else {
      console.info(
        color(
          `New version available: ${latestVersion}. You are on ${VERSION}.`,
          "yellow",
        ),
      );
    }

    const dl = await curl.invoke(["-fsSL", INSTALL_SCRIPT_LINK], {
      stdout: "pipe",
    });
    const run = await bash.invoke([], {
      stdin: dl.stdout,
      stdout: "inherit",
      stderr: "inherit",
    });
    const exitCode = await run.exited;
    if (exitCode !== 0) {
      return doError();
    }
  },
};
