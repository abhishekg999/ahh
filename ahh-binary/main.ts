import { $ } from "bun";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { copyToClipboard } from "./src/commands/clip/main";
import {
  addFiles,
  commitChanges,
  getMonoRepoStatus,
  pullChanges,
  pushChanges,
  switchBranch,
} from "./src/commands/mgit/main";
import {
  addModule,
  directLink,
  initMonoRepo,
  listModules,
  removeModule,
  withBranchValidation,
} from "./src/commands/mono/main";
import { createSimpleServer } from "./src/commands/serve/main";
import {
  configureWebhook,
  selectWebhook,
  sendToDiscord,
} from "./src/commands/share-discord/main";
import { tunnel } from "./src/commands/tunnel/main";
import { createWebhookServer } from "./src/commands/webhook/main";
import { WORKSPACE_CHOICES } from "./src/commands/workspace/choices";
import { initWorkspace } from "./src/commands/workspace/main";
import { getConfig } from "./src/config/main";
import {
  INSTALL_SCRIPT_LINK,
  RELEASES_URL,
  UPDATE_SCRIPT,
} from "./src/constants/main";
import { openAuthenticatedWebhookDashboard } from "./src/utils/external";
import { getStdin } from "./src/utils/fs";
import { isSemver, semverCompare } from "./src/utils/semver";
import { color, generateQrcode, startSpinner } from "./src/utils/text";

// Increment this version number when making changes to the CLI
const VERSION = "1.0.5";

const main = yargs(hideBin(Bun.argv))
  .scriptName("ahh")
  .version(VERSION)
  .command(
    "tunnel",
    "Tunnel a local port.",
    (yargs) =>
      yargs.option("port", {
        alias: "p",
        type: "number",
        description: "Port to run the server on",
        demandOption: true,
      }),
    async (argv) => {
      const stopSpin = startSpinner(
        "Starting tunnel, this may take a second..."
      );
      const { url: tunnelUrl } = await tunnel(argv.port);
      stopSpin();
      if (tunnelUrl) {
        console.info(`Tunnel URL: ${tunnelUrl}`);
        await generateQrcode(tunnelUrl);
      }
    }
  )
  .hide("version")
  .command(
    "serve",
    "Serve the current directory over HTTP.",
    (yargs) =>
      yargs.option("port", {
        alias: "p",
        type: "number",
        description: "Port to run the server on",
        default: 8000,
      }),
    async (argv) => {
      const stopSpin = startSpinner(
        "Starting server, this may take a second..."
      );
      const [, { url: tunnelUrl }] = await Promise.all([
        createSimpleServer(argv.port),
        tunnel(argv.port),
      ]);
      stopSpin();

      if (tunnelUrl) {
        console.info(`URL: ${tunnelUrl}`);
        await generateQrcode(tunnelUrl);
      }
    }
  )
  .hide("version")
  .command("webhook", "Starts a webhook server.", async (argv) => {
    const { port, token } = await createWebhookServer(
      (
        await getConfig()
      ).DEFAULT_WEBHOOK_HTTP_PORT
    );
    const stopSpin = startSpinner("Starting tunnel, this may take a second...");
    const { url: tunnelUrl } = await tunnel(port);
    stopSpin();

    console.info("Webhook URL", color(tunnelUrl, "cyan"));

    if (!tunnelUrl) {
      console.error("Failed to create tunnel.");
      return;
    }
    await openAuthenticatedWebhookDashboard(token, tunnelUrl);
  })
  .hide("version")
  .command(
    "workspace <name>",
    "Initialize a workspace.",
    (yargs) =>
      yargs
        .positional("name", {
          type: "string",
          description: "Name of the workspace",
          demandOption: true,
          choices: WORKSPACE_CHOICES,
        })
        .option("path", {
          alias: "p",
          type: "string",
          description: "Path to load the workspace",
        }),
    async (argv) => {
      const { name, path } = argv;
      const stopSpin = startSpinner("Initializing workspace...");
      await initWorkspace(name, path);
      stopSpin();
      console.log("Workspace initialized.");
    }
  )
  .hide("version")
  .command("clip", "Copy any stdin to the clipboard.", async () => {
    const input = await getStdin();
    await copyToClipboard(input);
  })
  .hide("version")
  .command(
    "share-discord",
    "Share content through Discord webhook.",
    (yargs) =>
      yargs.option("configure", {
        alias: "c",
        type: "boolean",
        description: "Configure webhooks",
      }),
    async (argv) => {
      if (argv.configure) {
        await configureWebhook();
        return;
      }
      const webhookUrl = await selectWebhook();
      const content = await getStdin();

      await sendToDiscord(content, webhookUrl);
    }
  )
  .hide("version")
  .command("qr", "Generate a QR code from stdin.", async () => {
    const input = await getStdin();
    await generateQrcode(input);
  })
  .hide("version")
  .command("update", "Update the CLI.", async () => {
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
    const currentVersion = VERSION;

    if (!isSemver(latestVersion)) {
      return doError();
    }

    if (semverCompare(currentVersion, latestVersion, ">=")) {
      console.info(
        color(`You are already on the latest version (v${VERSION}).`, "green")
      );
      return;
    } else {
      console.info(
        color(
          `New version available: ${latestVersion}. You are on ${currentVersion}.`,
          "yellow"
        )
      );
    }

    const result = await $`curl -fsSL ${INSTALL_SCRIPT_LINK} | bash`.nothrow();
    if (result.exitCode !== 0) {
      return doError();
    }
  })
  .hide("version")
  .command("mono", "Manage the virtual mono repo.", (yargs) => {
    return yargs
      .command(
        "init",
        "Initialize a virtual mono repo.",
        (yargs) =>
          yargs
            .option("name", {
              alias: "n",
              type: "string",
              description: "Name of the mono repo",
            })
            .option("path", {
              alias: "p",
              type: "string",
              description: "Path where to initialize the mono repo",
              default: ".",
            }),
        async (argv) => {
          try {
            await initMonoRepo(argv.path, argv.name);
          } catch (error) {
            console.error(color(`Error: ${(error as Error).message}`, "red"));
          }
        }
      )
      .command(
        "add",
        "Add a module to the mono repo.",
        (yargs) =>
          yargs
            .option("path", {
              alias: "p",
              type: "string",
              description: "Path to the module",
              demandOption: true,
            })
            .option("name", {
              alias: "n",
              type: "string",
              description: "Name of the module",
            })
            .option("description", {
              alias: "d",
              type: "string",
              description: "Description of the module",
            }),
        async (argv) => {
          try {
            // Use withBranchValidation to check branch consistency
            await withBranchValidation(async () => {
              await addModule(argv.path, argv.name, argv.description);
            });
          } catch (error) {
            console.error(color(`Error: ${(error as Error).message}`, "red"));
          }
        }
      )
      .command(
        "remove",
        "Remove a module from the mono repo.",
        (yargs) =>
          yargs.option("name", {
            alias: "n",
            type: "string",
            description: "Name of the module to remove",
            demandOption: true,
          }),
        async (argv) => {
          try {
            await withBranchValidation(async () => {
              await removeModule(argv.name);
            });
          } catch (error) {
            console.error(color(`Error: ${(error as Error).message}`, "red"));
          }
        }
      )
      .command("list", "List all modules in the mono repo.", {}, async () => {
        try {
          await withBranchValidation(async () => {
            await listModules();
          });
        } catch (error) {
          console.error(color(`Error: ${(error as Error).message}`, "red"));
        }
      })
      .command(
        "link",
        "Link files or directories between modules.",
        (yargs) =>
          yargs
            .option("source", {
              alias: "s",
              type: "string",
              description: "Source file or directory path",
              demandOption: true,
            })
            .option("target", {
              alias: "t",
              type: "string",
              description: "Target file or directory path",
              demandOption: true,
            }),
        async (argv) => {
          try {
            await withBranchValidation(async () => {
              const sourcePath = argv.source as string;
              const targetPath = argv.target as string;

              if (!sourcePath || !targetPath) {
                console.log(
                  color("Both source and target paths are required", "yellow")
                );
                return;
              }

              await directLink(sourcePath, targetPath);
            });
          } catch (error) {
            console.error(color(`Error: ${(error as Error).message}`, "red"));
          }
        }
      );
  })
  .hide("version")
  .command("mgit", "Git client for the virtual mono repo.", (yargs) => {
    return yargs
      .command(
        "status",
        "Show git status for all modules in the monorepo",
        {},
        async () => {
          try {
            await getMonoRepoStatus();
          } catch (error) {
            console.error(color(`Error: ${(error as Error).message}`, "red"));
          }
        }
      )
      .command(
        "add",
        "Add all changes to git in the monorepo",
        {},
        async () => {
          try {
            // Simplified to just add all changes
            await addFiles();
          } catch (error) {
            console.error(color(`Error: ${(error as Error).message}`, "red"));
          }
        }
      )
      .command(
        ["checkout <branch>", "switch <branch>"],
        "Switch branches across all repositories in the monorepo",
        (yargs) =>
          yargs
            .positional("branch", {
              describe: "Branch name to switch to",
              type: "string",
              demandOption: true,
            })
            .option("b", {
              alias: "create",
              describe: "Create a new branch",
              type: "boolean",
              default: false,
            }),
        async (argv) => {
          try {
            await switchBranch(argv.branch as string, Boolean(argv.b));
          } catch (error) {
            console.error(color(`Error: ${(error as Error).message}`, "red"));
          }
        }
      )
      .command(
        "commit",
        "Commit changes across all repositories in the monorepo",
        (yargs) =>
          yargs.option("m", {
            alias: "message",
            describe: "Commit message",
            type: "string",
          }),
        async (argv) => {
          try {
            await commitChanges((argv.m as string) || "");
          } catch (error) {
            console.error(color(`Error: ${(error as Error).message}`, "red"));
          }
        }
      )
      .command("push", "Push changes to remote repositories", {}, async () => {
        try {
          // Simplified to only push to origin with current branch
          await pushChanges();
        } catch (error) {
          console.error(color(`Error: ${(error as Error).message}`, "red"));
        }
      })
      .command(
        "pull",
        "Pull changes from remote repositories",
        {},
        async () => {
          try {
            await pullChanges();
          } catch (error) {
            console.error(color(`Error: ${(error as Error).message}`, "red"));
          }
        }
      )
      .demandCommand(1, "You must specify a git command")
      .help();
  })
  .hide("version")
  .demandCommand(1, "You must specify a command.")
  .help()
  .strict();

if (process.env.AHH_COMPLETIONS) {
  main.showCompletionScript();
  process.exit(0);
}

main.parse();
