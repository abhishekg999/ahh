import { input } from "@inquirer/prompts";
import { $ } from "bun";
import fs from "fs/promises";
import path from "path";
import { exists } from "../../utils/fs";
import { findMonoRepoRoot, resolvePath } from "../../utils/path";
import { color } from "../../utils/text";

const META_GIT_DIR = ".git";
const META_CONFIG_FILENAME = ".ahh.virtual.monorepo.json";
const META_GITIGNORE = ".gitignore";

interface MonoModule {
  name: string;
  path: string;
  absolutePath?: string;
  description?: string;
  currentBranch?: string;
}

interface MonoConfig {
  name: string;
  modules: MonoModule[];
  description?: string;
  metaBranch?: string;
}

export async function initMetaRepository(
  monoRepoRoot: string
): Promise<boolean> {
  const gitDir = path.join(monoRepoRoot, META_GIT_DIR);
  if (await exists(gitDir)) {
    return true;
  }

  try {
    await $`cd ${monoRepoRoot} && git init`.quiet();

    const gitignorePath = path.join(monoRepoRoot, META_GITIGNORE);
    const gitignoreContent = `
# Ignore everything
*
# Except the monorepo config
!${META_CONFIG_FILENAME}
`;
    await fs.writeFile(gitignorePath, gitignoreContent);

    await $`cd ${monoRepoRoot} && git add ${META_CONFIG_FILENAME}`.quiet();
    await $`cd ${monoRepoRoot} && git commit -m "Initialize virtual monorepo"`.quiet();

    console.log(
      color(`✓ Initialized meta Git repository in ${monoRepoRoot}`, "green")
    );
    return true;
  } catch (error) {
    console.error(
      color(
        `Failed to initialize meta Git repository: ${(error as Error).message}`,
        "red"
      )
    );
    return false;
  }
}

async function getCurrentBranch(repoPath: string): Promise<string | undefined> {
  try {
    const result = await $`cd ${repoPath} && git rev-parse --abbrev-ref HEAD`
      .quiet()
      .text();
    return result.trim() || undefined;
  } catch (error) {
    return undefined;
  }
}

async function loadMonoRepoWithGitState(): Promise<{
  config: MonoConfig;
  rootDir: string;
}> {
  const rootDir = await findMonoRepoRoot();
  if (!rootDir) {
    throw new Error("Not in a mono repo. Run 'ahh mono init' to create one.");
  }

  const configPath = path.join(rootDir, META_CONFIG_FILENAME);
  const configData = await fs.readFile(configPath, "utf-8");
  const config = JSON.parse(configData) as MonoConfig;

  config.metaBranch = (await getCurrentBranch(rootDir)) || "main";

  for (const module of config.modules) {
    module.absolutePath = path.resolve(rootDir, module.path);

    if (await exists(path.join(module.absolutePath, ".git"))) {
      module.currentBranch = await getCurrentBranch(module.absolutePath);
    }
  }

  return { config, rootDir };
}

async function saveMonoRepoConfig(
  config: MonoConfig,
  rootDir: string
): Promise<void> {
  const configToSave = { ...config };
  delete configToSave.metaBranch;

  configToSave.modules = config.modules.map((module) => {
    const { absolutePath, currentBranch, ...rest } = module;
    return rest;
  });

  const configPath = path.join(rootDir, META_CONFIG_FILENAME);
  await fs.writeFile(configPath, JSON.stringify(configToSave, null, 2));

  try {
    await $`cd ${rootDir} && git add ${META_CONFIG_FILENAME}`.quiet();
    await $`cd ${rootDir} && git commit -m "Update monorepo configuration"`.quiet();
  } catch (error) {}
}

export async function addFiles(): Promise<void> {
  const { config, rootDir } = await loadMonoRepoWithGitState();
  const results = { success: 0, errors: 0 };

  console.log(color("Adding all changes in each repository...", "blue"));

  await processRepoAdd(rootDir, "meta repository", results, true);

  for (const module of config.modules) {
    if (!module.absolutePath) continue;

    if (!(await exists(path.join(module.absolutePath, ".git")))) {
      console.log(
        color(`Skipping ${module.name} - not a Git repository`, "yellow")
      );
      continue;
    }

    await processRepoAdd(module.absolutePath, module.name, results);
  }

  console.log(
    color(
      `\nCompleted with ${results.success} successful adds and ${results.errors} errors.`,
      results.errors > 0 ? "yellow" : "green"
    )
  );
}

async function processRepoAdd(
  repoPath: string,
  repoName: string,
  results: { success: number; errors: number },
  isMainRepo: boolean = false
): Promise<void> {
  try {
    if (!(await isGitRepository(repoPath))) {
      console.log(color(`⚠ ${repoName} is not a git repository`, "yellow"));
      return;
    }

    try {
      console.log(color(`\nRunning 'git add .' in ${repoName}...`, "blue"));
      const result = await $`cd ${repoPath} && git add .`.nothrow();

      if (result.exitCode !== 0) {
        console.error(color(`⚠ Error adding changes in ${repoName}:`, "red"));
        if (result.stderr) {
          console.error(result.stderr);
        }
        results.errors++;
        return;
      }

      if (result.stdout && result.stdout.toString("utf8")) {
        console.log(result.stdout.toString("utf8"));
      }

      console.log(color(`✓ Added changes in ${repoName}`, "green"));
      results.success++;
    } catch (error) {
      console.error(
        color(
          `⚠ Error adding changes in ${repoName}: ${(error as Error).message}`,
          "red"
        )
      );
      results.errors++;
    }
  } catch (error) {
    console.error(
      color(
        `⚠ Error processing ${repoName}: ${(error as Error).message}`,
        "red"
      )
    );
    results.errors++;
  }
}

export async function switchBranch(
  branchName: string,
  createBranch: boolean = false
): Promise<void> {
  const { config, rootDir } = await loadMonoRepoWithGitState();
  let success = 0;
  let errors = 0;

  console.log(
    color(
      `${
        createBranch ? "Creating and switching" : "Switching"
      } to branch '${branchName}' across all repositories...`,
      "blue"
    )
  );

  try {
    console.log(color(`\nRunning git checkout in meta repository...`, "blue"));
    const command = createBranch
      ? $`cd ${rootDir} && git checkout -b ${branchName}`
      : $`cd ${rootDir} && git checkout ${branchName}`;

    const result = await command.nothrow();

    if (result.exitCode === 0) {
      if (result.stdout && result.stdout.toString("utf8")) {
        console.log(result.stdout.toString("utf8"));
      }
      console.log(
        color(`✓ Switched meta repository to '${branchName}'`, "green")
      );
      success++;
    } else {
      console.error(color(`Failed to switch meta repository:`, "red"));
      if (result.stderr) {
        console.error(result.stderr);
      }
      errors++;
    }
  } catch (error) {
    console.error(
      color(
        `Failed to switch meta repository: ${(error as Error).message}`,
        "red"
      )
    );
    errors++;
  }

  for (const module of config.modules) {
    if (!module.absolutePath) continue;

    try {
      if (!(await exists(path.join(module.absolutePath, ".git")))) {
        console.log(
          color(`Skipping ${module.name} - not a Git repository`, "yellow")
        );
        continue;
      }

      console.log(color(`\nRunning git checkout in ${module.name}...`, "blue"));
      const command = createBranch
        ? $`cd ${module.absolutePath} && git checkout -b ${branchName}`
        : $`cd ${module.absolutePath} && git checkout ${branchName}`;

      const result = await command.nothrow();

      if (result.exitCode === 0) {
        if (result.stdout && result.stdout.toString("utf8")) {
          console.log(result.stdout.toString("utf8"));
        }
        console.log(
          color(`✓ Switched ${module.name} to '${branchName}'`, "green")
        );
        success++;
      } else {
        console.error(color(`Failed to switch ${module.name}:`, "red"));
        if (result.stderr) {
          console.error(result.stderr);
        }
        errors++;
      }
    } catch (error) {
      console.error(
        color(
          `Failed to switch ${module.name}: ${(error as Error).message}`,
          "red"
        )
      );
      errors++;
    }
  }

  console.log(
    color(
      `\nCompleted with ${success} successes and ${errors} errors.`,
      errors > 0 ? "yellow" : "green"
    )
  );
}

export async function commitChanges(message: string): Promise<void> {
  if (!message) {
    message = await input({
      message: "Enter commit message:",
      validate: (value) =>
        value.length > 0 ? true : "Commit message cannot be empty",
    });
  }

  const { config, rootDir } = await loadMonoRepoWithGitState();
  let success = 0;
  let errors = 0;
  let noChanges = 0;

  console.log(color(`Committing changes with message: "${message}"`, "blue"));

  try {
    const hasChanges = await $`cd ${rootDir} && git status --porcelain`
      .quiet()
      .text();

    if (hasChanges.trim()) {
      console.log(color(`\nRunning git commit in meta repository...`, "blue"));
      const result =
        await $`cd ${rootDir} && git commit -m ${message}`.nothrow();

      if (result.exitCode === 0) {
        if (result.stdout && result.stdout.toString("utf8")) {
          console.log(result.stdout.toString("utf8"));
        }
        console.log(color(`✓ Committed changes in meta repository`, "green"));
        success++;
      } else {
        console.error(color(`Failed to commit meta repository:`, "red"));
        if (result.stderr) {
          console.error(result.stderr);
        }
        errors++;
      }
    } else {
      console.log(color(`No changes to commit in meta repository`, "yellow"));
      noChanges++;
    }
  } catch (error) {
    console.error(
      color(
        `Failed to commit meta repository: ${(error as Error).message}`,
        "red"
      )
    );
    errors++;
  }

  for (const module of config.modules) {
    if (!module.absolutePath) continue;

    try {
      if (!(await exists(path.join(module.absolutePath, ".git")))) {
        console.log(
          color(`Skipping ${module.name} - not a Git repository`, "yellow")
        );
        continue;
      }

      const hasChanges =
        await $`cd ${module.absolutePath} && git status --porcelain`
          .quiet()
          .text();

      if (hasChanges.trim()) {
        console.log(color(`\nRunning git commit in ${module.name}...`, "blue"));
        const result =
          await $`cd ${module.absolutePath} && git commit -m ${message}`.nothrow();

        if (result.exitCode === 0) {
          if (result.stdout && result.stdout.toString("utf8")) {
            console.log(result.stdout.toString("utf8"));
          }
          console.log(color(`✓ Committed changes in ${module.name}`, "green"));
          success++;
        } else {
          console.error(color(`Failed to commit ${module.name}:`, "red"));
          if (result.stderr) {
            console.error(result.stderr);
          }
          errors++;
        }
      } else {
        console.log(color(`No changes to commit in ${module.name}`, "yellow"));
        noChanges++;
      }
    } catch (error) {
      console.error(
        color(
          `Failed to commit ${module.name}: ${(error as Error).message}`,
          "red"
        )
      );
      errors++;
    }
  }

  console.log(
    color(
      `\nCompleted with ${success} commits, ${noChanges} repos with no changes, and ${errors} errors.`,
      errors > 0 ? "yellow" : "green"
    )
  );
}

export async function pushChanges(): Promise<void> {
  const { config, rootDir } = await loadMonoRepoWithGitState();
  let success = 0;
  let errors = 0;
  let skipped = 0;

  console.log(color("Pushing changes to remote repositories...", "blue"));

  console.log(
    color(
      `Skipping meta repository - not meant to be pushed to remote`,
      "yellow"
    )
  );
  skipped++;

  for (const module of config.modules) {
    if (!module.absolutePath) continue;

    try {
      if (!(await exists(path.join(module.absolutePath, ".git")))) {
        console.log(
          color(`Skipping ${module.name} - not a Git repository`, "yellow")
        );
        skipped++;
        continue;
      }

      const currentBranch =
        module.currentBranch || (await getCurrentBranch(module.absolutePath));
      if (!currentBranch) {
        console.log(
          color(
            `Skipping ${module.name} - could not determine current branch`,
            "yellow"
          )
        );
        skipped++;
        continue;
      }

      const remotes = await $`cd ${module.absolutePath} && git remote`
        .quiet()
        .text();
      if (!remotes.split("\n").includes("origin")) {
        console.log(
          color(`Skipping ${module.name} - remote origin not found`, "yellow")
        );
        skipped++;
        continue;
      }

      const hasUpstream =
        await $`cd ${module.absolutePath} && git for-each-ref --format='%(upstream:short)' refs/heads/${currentBranch}`
          .quiet()
          .text();

      console.log(color(`\nRunning git push in ${module.name}...`, "blue"));
      let result;
      if (hasUpstream.trim()) {
        result =
          await $`cd ${module.absolutePath} && git push origin ${currentBranch}`.nothrow();
      } else {
        result =
          await $`cd ${module.absolutePath} && git push --set-upstream origin ${currentBranch}`.nothrow();
      }

      if (result.exitCode === 0) {
        if (result.stdout && result.stdout.toString("utf8")) {
          console.log(result.stdout.toString("utf8"));
        }
        console.log(
          color(
            `✓ Pushed changes from ${module.name} to origin/${currentBranch}`,
            "green"
          )
        );
        success++;
      } else {
        console.error(color(`Failed to push ${module.name}:`, "red"));
        if (result.stderr) {
          console.error(result.stderr);
        }
        errors++;
      }
    } catch (error) {
      console.error(
        color(
          `Failed to push ${module.name}: ${(error as Error).message}`,
          "red"
        )
      );
      errors++;
    }
  }

  console.log(
    color(
      `\nCompleted with ${success} successful pushes, ${skipped} skipped, and ${errors} errors.`,
      errors > 0 ? "yellow" : "green"
    )
  );
}

export async function getMonoRepoStatus(): Promise<void> {
  const { config, rootDir } = await loadMonoRepoWithGitState();

  console.log(color(`=== Mono Repo Status ===`, "blue"));
  console.log(color(`Root: ${rootDir}`, "blue"));

  console.log(color(`\n[Meta Repository]`, "cyan"));
  console.log(color(`Branch: ${config.metaBranch || "unknown"}`, "white"));

  try {
    console.log(color(`\nRunning git status in meta repository...`, "blue"));
    const result = await $`cd ${rootDir} && git status`.nothrow();

    if (result.exitCode === 0) {
      if (result.stdout && result.stdout.toString("utf8")) {
        console.log(result.stdout.toString("utf8"));
      } else {
        console.log(color("No output from git status", "yellow"));
      }
    } else {
      console.error(color(`Failed to get meta repository status:`, "red"));
      if (result.stderr) {
        console.error(result.stderr);
      }
    }
  } catch (error) {
    console.error(
      color(
        `Error getting meta repository status: ${(error as Error).message}`,
        "red"
      )
    );
  }

  for (const module of config.modules) {
    if (!module.absolutePath) continue;

    console.log(color(`\n[${module.name}]`, "cyan"));
    console.log(color(`Path: ${module.absolutePath}`, "white"));

    try {
      if (!(await exists(path.join(module.absolutePath, ".git")))) {
        console.log(color(`Not a Git repository`, "yellow"));
        continue;
      }

      const branch =
        module.currentBranch ||
        (await getCurrentBranch(module.absolutePath)) ||
        "unknown";
      console.log(color(`Branch: ${branch}`, "white"));

      console.log(color(`\nRunning git status in ${module.name}...`, "blue"));
      const result = await $`cd ${module.absolutePath} && git status`.nothrow();

      if (result.exitCode === 0) {
        if (result.stdout && result.stdout.toString("utf8")) {
          console.log(result.stdout.toString("utf8"));
        } else {
          console.log(color("No output from git status", "yellow"));
        }
      } else {
        console.error(color(`Failed to get status for ${module.name}:`, "red"));
        if (result.stderr) {
          console.error(result.stderr);
        }
      }
    } catch (error) {
      console.error(
        color(`Error getting status: ${(error as Error).message}`, "red")
      );
    }
  }
}

async function isGitRepository(dir: string): Promise<boolean> {
  try {
    const resolvedDir = resolvePath(dir);
    await $`cd ${resolvedDir} && git rev-parse --is-inside-work-tree`.quiet();
    return true;
  } catch (e) {
    return false;
  }
}

export async function validateBranchConsistency(): Promise<boolean> {
  try {
    const { config, rootDir } = await loadMonoRepoWithGitState();
    const metaBranch = config.metaBranch || "main";
    let consistent = true;
    let inconsistentModules: string[] = [];

    for (const module of config.modules) {
      if (!module.absolutePath) continue;

      if (!(await exists(path.join(module.absolutePath, ".git")))) {
        continue;
      }

      const moduleBranch =
        module.currentBranch || (await getCurrentBranch(module.absolutePath));

      if (moduleBranch && moduleBranch !== metaBranch) {
        consistent = false;
        inconsistentModules.push(`${module.name} (on branch ${moduleBranch})`);
      }
    }

    if (!consistent) {
      console.warn(
        color(`Warning: Not all repositories are on the same branch.`, "yellow")
      );
      console.warn(
        color(
          `Meta repository is on branch '${metaBranch}', but these modules are on different branches:`,
          "yellow"
        )
      );
      inconsistentModules.forEach((mod) =>
        console.warn(color(`  - ${mod}`, "yellow"))
      );
      return false;
    }

    return true;
  } catch (error) {
    return true;
  }
}

export async function pullChanges(): Promise<void> {
  const { config, rootDir } = await loadMonoRepoWithGitState();
  let success = 0;
  let errors = 0;
  let skipped = 0;

  console.log(color("Pulling changes from remote repositories...", "blue"));

  console.log(
    color(
      `Skipping meta repository - not meant to be pulled from remote`,
      "yellow"
    )
  );
  skipped++;

  for (const module of config.modules) {
    if (!module.absolutePath) continue;

    try {
      if (!(await exists(path.join(module.absolutePath, ".git")))) {
        console.log(
          color(`Skipping ${module.name} - not a Git repository`, "yellow")
        );
        skipped++;
        continue;
      }

      const remotes = await $`cd ${module.absolutePath} && git remote`
        .quiet()
        .text();
      if (!remotes.split("\n").includes("origin")) {
        console.log(
          color(`Skipping ${module.name} - remote origin not found`, "yellow")
        );
        skipped++;
        continue;
      }

      console.log(color(`\nRunning git pull in ${module.name}...`, "blue"));
      const result =
        await $`cd ${module.absolutePath} && git pull origin`.nothrow();

      if (result.exitCode === 0) {
        if (result.stdout && result.stdout.toString("utf8")) {
          console.log(result.stdout.toString("utf8"));
        }
        console.log(color(`✓ Pulled changes for ${module.name}`, "green"));
        success++;
      } else {
        console.error(color(`Failed to pull ${module.name}:`, "red"));
        if (result.stderr) {
          console.error(result.stderr);
        }
        errors++;
      }
    } catch (error) {
      console.error(
        color(
          `Failed to pull ${module.name}: ${(error as Error).message}`,
          "red"
        )
      );
      errors++;
    }
  }

  console.log(
    color(
      `\nCompleted with ${success} successful pulls, ${skipped} skipped, and ${errors} errors.`,
      errors > 0 ? "yellow" : "green"
    )
  );
}
