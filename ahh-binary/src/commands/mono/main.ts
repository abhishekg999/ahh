import { input } from "@inquirer/prompts";
import fs from "fs/promises";
import path from "path";
import { exists, mkdirAlways } from "../../utils/fs";
import {
  createRelativePath,
  findMonoRepoRoot,
  resolvePath,
} from "../../utils/path";
import { color } from "../../utils/text";
import { initMetaRepository, validateBranchConsistency } from "../mgit/main";

// Constant for mono repo configuration file name
const MONO_CONFIG_FILENAME = ".ahh.virtual.monorepo.json";
const MONO_LINKS_DIR = ".ahh-links";
const MONO_LOCKFILE = ".ahh.lockfile";

// Type definitions for mono repo
interface MonoModule {
  name: string;
  path: string; // Stored as relative path to the mono repo root
  absolutePath?: string; // Not stored, used at runtime
  description?: string;
}

// Track linked files
interface LinkedFile {
  source: {
    module: string;
    path: string; // Path relative to module
  };
  targets: Array<{
    module: string;
    path: string; // Path relative to module
  }>;
  masterCopy: string; // Path relative to links directory
}

interface MonoConfig {
  name: string;
  modules: MonoModule[];
  description?: string;
  links: LinkedFile[];
}

/**
 * Initialize a new mono repo in the specified directory
 */
export async function initMonoRepo(targetDir: string = ".", name: string = "") {
  const resolvedDir = resolvePath(targetDir);

  // Check if directory exists, create if not
  await mkdirAlways(resolvedDir);

  // Check if this directory is already in a mono repo
  const parentMonoRoot = await findMonoRepoRoot(resolvedDir);
  if (parentMonoRoot) {
    throw new Error(
      `This directory is already part of a mono repo at: ${parentMonoRoot}`
    );
  }

  // Create config file path
  const configFilePath = path.join(resolvedDir, MONO_CONFIG_FILENAME);

  // Check if config already exists
  if (await exists(configFilePath)) {
    throw new Error(
      `Mono repo already initialized in this directory: ${resolvedDir}`
    );
  }

  // Prompt for name if not provided
  if (!name) {
    name = await input({
      message: "Enter monorepo name:",
      default: path.basename(resolvedDir),
    });
  }

  const description = await input({
    message: "Enter monorepo description (optional):",
  });

  const config: MonoConfig = {
    name,
    description: description || undefined,
    modules: [],
    links: [],
  };

  // Create links directory
  const linksDir = path.join(resolvedDir, MONO_LINKS_DIR);
  await mkdirAlways(linksDir);

  // Create lockfile
  const lockFilePath = path.join(resolvedDir, MONO_LOCKFILE);
  await fs.writeFile(lockFilePath, JSON.stringify({ locked: false }, null, 2));

  // Save config
  await fs.writeFile(configFilePath, JSON.stringify(config, null, 2));

  // Initialize meta Git repository to track the mono repo configuration
  const metaRepoInitialized = await initMetaRepository(resolvedDir);

  // Update .gitignore to exclude links directory but include the lockfile
  const gitignorePath = path.join(resolvedDir, ".gitignore");
  let gitignoreContent = "";

  try {
    gitignoreContent = await fs.readFile(gitignorePath, "utf-8");
  } catch (error) {
    // File doesn't exist, create a new one
  }

  // Make sure links directory is excluded
  if (!gitignoreContent.includes(MONO_LINKS_DIR)) {
    gitignoreContent += `\n# Ahh monorepo links directory\n${MONO_LINKS_DIR}\n`;
  }

  // Make sure lockfile is not excluded
  if (!gitignoreContent.includes(MONO_LOCKFILE)) {
    gitignoreContent += `\n# Ahh monorepo lockfile\n!${MONO_LOCKFILE}\n`;
  }

  await fs.writeFile(gitignorePath, gitignoreContent);

  console.log(
    color(
      `✓ Mono repo '${name}' initialized successfully at ${resolvedDir}`,
      "green"
    )
  );
  console.log(color(`Configuration stored at: ${configFilePath}`, "blue"));

  if (metaRepoInitialized) {
    console.log(
      color(
        "✓ Initialized meta Git repository to track monorepo configuration",
        "green"
      )
    );
  } else {
    console.log(
      color(
        "! Failed to initialize meta Git repository. You can manually initialize it later.",
        "yellow"
      )
    );
  }
}

/**
 * Acquire a lock for the monorepo for operations that need to be atomic
 */
async function acquireLock(rootDir: string): Promise<() => Promise<void>> {
  const lockFilePath = path.join(rootDir, MONO_LOCKFILE);

  // Read lock file
  let lockData;
  try {
    const lockContent = await fs.readFile(lockFilePath, "utf-8");
    lockData = JSON.parse(lockContent);
  } catch (error) {
    // Create a new lock file if it doesn't exist
    lockData = { locked: false };
  }

  // Check if locked
  if (lockData.locked) {
    throw new Error("Monorepo is locked by another process. Try again later.");
  }

  // Acquire lock
  lockData.locked = true;
  lockData.timestamp = new Date().toISOString();
  lockData.pid = process.pid;

  await fs.writeFile(lockFilePath, JSON.stringify(lockData, null, 2));

  // Return release function
  return async () => {
    lockData.locked = false;
    await fs.writeFile(lockFilePath, JSON.stringify(lockData, null, 2));
  };
}

/**
 * Check if mono repo is initialized in the current directory or ancestors
 */
export async function isMonoInitialized(): Promise<boolean> {
  return (await findMonoRepoRoot()) !== null;
}

/**
 * Load the mono repo configuration
 */
export async function loadMonoConfig(): Promise<{
  config: MonoConfig;
  rootDir: string;
}> {
  const rootDir = await findMonoRepoRoot();
  if (!rootDir) {
    throw new Error("Mono repo not initialized. Run 'ahh mono init' first.");
  }

  const configPath = path.join(rootDir, MONO_CONFIG_FILENAME);
  const configData = await fs.readFile(configPath, "utf-8");
  let config: MonoConfig;

  try {
    config = JSON.parse(configData) as MonoConfig;

    // Add links array if it doesn't exist (for backward compatibility)
    if (!config.links) {
      config.links = [];
    }
  } catch (error) {
    throw new Error(
      `Failed to parse mono repo config: ${(error as Error).message}`
    );
  }

  // Resolve relative paths to absolute paths for easier use in the program
  for (const module of config.modules) {
    module.absolutePath = path.resolve(rootDir, module.path);
  }

  return { config, rootDir };
}

/**
 * Save the mono repo configuration
 */
export async function saveMonoConfig(config: MonoConfig): Promise<void> {
  const rootDir = await findMonoRepoRoot();
  if (!rootDir) {
    throw new Error("Mono repo not initialized. Run 'ahh mono init' first.");
  }

  // We don't want to save absolutePath
  const configToSave = { ...config };
  configToSave.modules = config.modules.map((module) => {
    const { absolutePath, ...rest } = module;
    return rest;
  });

  const configPath = path.join(rootDir, MONO_CONFIG_FILENAME);
  await fs.writeFile(configPath, JSON.stringify(configToSave, null, 2));
}

/**
 * Add a module to the mono repo
 */
export async function addModule(
  modulePath: string,
  name?: string,
  description?: string
) {
  const { config, rootDir } = await loadMonoConfig();

  // Resolve the full path
  const fullPath = resolvePath(modulePath);

  // Check if module exists
  if (!(await exists(fullPath))) {
    throw new Error(`Module path does not exist: ${fullPath}`);
  }

  // Use directory name as module name if not provided
  if (!name) {
    name = path.basename(fullPath);
  }

  // Check if module already exists
  if (config.modules.some((m) => m.name === name)) {
    throw new Error(
      `Module with name '${name}' already exists in the mono repo`
    );
  }

  // Convert to relative path from mono repo root
  const relativePath = createRelativePath(rootDir, fullPath);

  // Add module to configuration
  config.modules.push({
    name,
    path: relativePath, // Store as relative path
    absolutePath: fullPath, // For runtime usage
    description,
  });

  // Save configuration
  await saveMonoConfig(config);

  console.log(color(`✓ Module '${name}' added to mono repo`, "green"));
}

/**
 * Remove a module from the mono repo
 */
export async function removeModule(moduleName: string) {
  const { config } = await loadMonoConfig();

  // Find module index
  const index = config.modules.findIndex((m) => m.name === moduleName);

  if (index === -1) {
    throw new Error(`Module '${moduleName}' not found in mono repo`);
  }

  // Remove module
  config.modules.splice(index, 1);

  // Save configuration
  await saveMonoConfig(config);

  console.log(
    color(`✓ Module '${moduleName}' removed from mono repo`, "green")
  );
}

/**
 * Find module name for a given path
 */
function findModuleNameForPath(
  config: MonoConfig,
  rootDir: string,
  repoPath: string
): string | undefined {
  for (const module of config.modules) {
    const moduleAbsPath =
      module.absolutePath || path.resolve(rootDir, module.path);
    if (moduleAbsPath === repoPath) {
      return module.name;
    }
  }
  return undefined;
}

/**
 * Direct link between files or directories across modules
 */
export async function directLink(
  sourcePath: string,
  targetPath: string
): Promise<void> {
  // Load mono repo config
  const { config, rootDir } = await loadMonoConfig();

  // Get links directory
  const linksDir = path.join(rootDir, MONO_LINKS_DIR);
  await mkdirAlways(linksDir);

  // Resolve full paths
  const sourceFullPath = resolvePath(sourcePath);
  const targetFullPath = resolvePath(targetPath);

  // Find which modules these paths belong to
  const sourceInfo = await getRelativePathInModule(sourceFullPath);
  const targetInfo = await getRelativePathInModule(targetFullPath);

  if (!sourceInfo) {
    throw new Error(
      `Source path ${sourcePath} is not in any module of the mono repo`
    );
  }

  if (!targetInfo) {
    throw new Error(
      `Target path ${targetPath} is not in any module of the mono repo`
    );
  }

  // Validate source path exists
  if (!(await exists(sourceFullPath))) {
    throw new Error(`Source path ${sourcePath} does not exist`);
  }

  const sourceModuleName = sourceInfo.module.name;
  const targetModuleName = targetInfo.module.name;

  if (sourceModuleName === targetModuleName) {
    throw new Error("Source and target must be in different modules");
  }

  // Acquire lock for atomic operations
  const releaseLock = await acquireLock(rootDir);

  try {
    const sourceRelPath = sourceInfo.relativePath;
    const targetRelPath = targetInfo.relativePath;

    // Check if this is a directory
    const isDirectory = (await fs.stat(sourceFullPath)).isDirectory();

    if (isDirectory) {
      // Handle directory linking
      await linkDirectory(
        sourceFullPath,
        targetFullPath,
        sourceModuleName,
        targetModuleName,
        sourceRelPath,
        targetRelPath,
        linksDir,
        config
      );
    } else {
      // Handle file linking
      await linkFile(
        sourceFullPath,
        targetFullPath,
        sourceModuleName,
        targetModuleName,
        sourceRelPath,
        targetRelPath,
        linksDir,
        config
      );
    }

    // Save updated config
    await saveMonoConfig(config);

    console.log(
      color(`✓ Successfully linked ${sourcePath} to ${targetPath}`, "green")
    );
  } finally {
    // Release lock
    await releaseLock();
  }
}

/**
 * Link a single file between modules
 */
async function linkFile(
  sourceFullPath: string,
  targetFullPath: string,
  sourceModuleName: string,
  targetModuleName: string,
  sourceRelPath: string,
  targetRelPath: string,
  linksDir: string,
  config: MonoConfig
): Promise<void> {
  // Create a unique name for the master copy
  const masterCopyName = `${sourceModuleName}__${sourceRelPath.replace(
    /\//g,
    "_"
  )}`;
  const masterCopyPath = path.join(linksDir, masterCopyName);

  // Check if this link already exists
  const existingLink = config.links.find(
    (link) =>
      link.source.module === sourceModuleName &&
      link.source.path === sourceRelPath
  );

  if (existingLink) {
    // Check if the target is already linked
    const existingTarget = existingLink.targets.find(
      (t) => t.module === targetModuleName && t.path === targetRelPath
    );

    if (existingTarget) {
      console.log(color(`This link already exists`, "yellow"));
      return;
    }

    // Add new target to existing link
    existingLink.targets.push({
      module: targetModuleName,
      path: targetRelPath,
    });

    // Create target directory if needed
    await mkdirAlways(path.dirname(targetFullPath));

    // Create hard link to master copy
    await createHardLink(masterCopyPath, targetFullPath);

    console.log(
      color(
        `Added ${targetModuleName}/${targetRelPath} as a target for existing link`,
        "green"
      )
    );
  } else {
    // This is a new link

    // Create master copy
    await mkdirAlways(path.dirname(masterCopyPath));
    await fs.copyFile(sourceFullPath, masterCopyPath);

    // Create target directory if needed
    await mkdirAlways(path.dirname(targetFullPath));

    // Create hard links from source and target to master copy
    await createHardLink(masterCopyPath, sourceFullPath);
    await createHardLink(masterCopyPath, targetFullPath);

    // Add link to config
    config.links.push({
      source: {
        module: sourceModuleName,
        path: sourceRelPath,
      },
      targets: [
        {
          module: targetModuleName,
          path: targetRelPath,
        },
      ],
      masterCopy: masterCopyName,
    });

    console.log(
      color(`Created new link with master copy at ${masterCopyName}`, "green")
    );
  }
}

/**
 * Link a directory between modules
 */
async function linkDirectory(
  sourceFullPath: string,
  targetFullPath: string,
  sourceModuleName: string,
  targetModuleName: string,
  sourceRelPath: string,
  targetRelPath: string,
  linksDir: string,
  config: MonoConfig
): Promise<void> {
  // Create the target directory
  await mkdirAlways(targetFullPath);

  // Read all files in the source directory
  const files = await listFilesRecursively(sourceFullPath);

  if (files.length === 0) {
    console.log(color(`Source directory is empty`, "yellow"));
    return;
  }

  for (const file of files) {
    // Get the path relative to the source directory
    const relativePath = path.relative(sourceFullPath, file);

    // Create full paths for this file
    const sourceFilePath = path.join(sourceFullPath, relativePath);
    const targetFilePath = path.join(targetFullPath, relativePath);

    // Create module-relative paths
    const sourceFileRelPath = path.join(sourceRelPath, relativePath);
    const targetFileRelPath = path.join(targetRelPath, relativePath);

    // Link this file
    await linkFile(
      sourceFilePath,
      targetFilePath,
      sourceModuleName,
      targetModuleName,
      sourceFileRelPath,
      targetFileRelPath,
      linksDir,
      config
    );
  }
}

/**
 * List all files in a directory recursively
 */
async function listFilesRecursively(dir: string): Promise<string[]> {
  const files: string[] = [];

  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      const subDirFiles = await listFilesRecursively(fullPath);
      files.push(...subDirFiles);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Create a hard link handling platform differences
 */
async function createHardLink(
  sourcePath: string,
  targetPath: string
): Promise<void> {
  try {
    await fs.link(sourcePath, targetPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      // If target already exists, remove it and try again
      await fs.unlink(targetPath);
      await fs.link(sourcePath, targetPath);
    } else {
      throw error;
    }
  }
}

/**
 * Find the module that contains a specific file path
 */
export async function findModuleContainingPath(
  filePath: string
): Promise<MonoModule | null> {
  const { config, rootDir } = await loadMonoConfig();
  const absoluteFilePath = resolvePath(filePath);

  for (const module of config.modules) {
    const moduleAbsPath =
      module.absolutePath || path.resolve(rootDir, module.path);
    if (absoluteFilePath.startsWith(moduleAbsPath)) {
      return module;
    }
  }

  return null;
}

/**
 * Get the relative path of a file within its module
 */
export async function getRelativePathInModule(
  filePath: string
): Promise<{ module: MonoModule; relativePath: string } | null> {
  const module = await findModuleContainingPath(filePath);
  if (!module) return null;

  const { rootDir } = await loadMonoConfig();
  const moduleAbsPath =
    module.absolutePath || path.resolve(rootDir, module.path);
  const absoluteFilePath = resolvePath(filePath);

  const relativePath = path.relative(moduleAbsPath, absoluteFilePath);
  return { module, relativePath };
}

/**
 * List all modules in the mono repo
 */
export async function listModules() {
  const { config, rootDir } = await loadMonoConfig();

  if (config.modules.length === 0) {
    console.log(color("No modules in mono repo", "yellow"));
    return;
  }

  console.log(color(`\nMono Repo: ${config.name}`, "blue"));
  console.log(color(`Root Directory: ${rootDir}`, "blue"));
  if (config.description) {
    console.log(color(`Description: ${config.description}`, "blue"));
  }

  console.log(color("\nModules:", "blue"));
  config.modules.forEach((module, index) => {
    console.log(color(`${index + 1}. ${module.name}`, "white"));
    console.log(
      color(
        `   Path: ${module.absolutePath || path.resolve(rootDir, module.path)}`,
        "cyan"
      )
    );
    console.log(color(`   Relative Path: ${module.path}`, "cyan"));
    if (module.description) {
      console.log(color(`   Description: ${module.description}`, "cyan"));
    }
    console.log();
  });
}

/**
 * Wrapper to run any mono repo command with branch validation
 */
export async function withBranchValidation(
  action: () => Promise<void>
): Promise<void> {
  // Check branch consistency before executing commands
  const isConsistent = await validateBranchConsistency();

  if (!isConsistent) {
    console.warn(
      color(
        "⚠️ Branch inconsistency detected in the monorepo. Proceeding with caution...",
        "yellow"
      )
    );
    // Could add prompt here to confirm if user wants to continue
  }

  await action();
}
