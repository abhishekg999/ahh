import path from "path";
import { $ } from "bun";
import { exists, HOME_DIR, mkdirAlways } from "../utils/fs";

const WORKSPACE_DIR = path.join(HOME_DIR, "workspaces");
const WORKSPACE_CACHE_DIR = path.join(WORKSPACE_DIR, "cache");

await mkdirAlways(WORKSPACE_DIR);
await mkdirAlways(WORKSPACE_CACHE_DIR);

const DOWNLOAD_PATH =
  process.env.NODE_ENV === "development"
    ? "https://localhost:3000/workspaces"
    : "https://cli.ahh.bet/workspaces";

export async function downloadAndCacheWorkspace(workspaceId: string) {
    const workspaceCachePath = path.join(WORKSPACE_CACHE_DIR, workspaceId);
    await mkdirAlways(workspaceCachePath);
    
    const downloadPath = `${DOWNLOAD_PATH}/${workspaceId}/download.tar.gz`;
    await $`curl -sL ${downloadPath} | tar -xz -C ${workspaceCachePath}`;
}

/**
 * Loads a workspace from cache to the wanted loc.
 */
async function loadWorkspace(workspaceId: string, loc: string) {
    const workspaceCachePath = path.join(WORKSPACE_CACHE_DIR, workspaceId);
    await mkdirAlways(loc);
    await $`cp -r ${workspaceCachePath}/* ${loc}`;
}

/**
 * Check if workspaceId is in WORKSPACE_CACHE_DIR
 * If it is: 
    - Continue
 * If it is not:
 *   - Call downloadAndCacheWorkspace(workspaceId)
 * 
 *  - Copy the workspace to loc
 *  - If loc is null: copy it to ./workspaceId/*
 *  - If loc is not null: mkdir -p loc && copy it to loc
 */
export async function initWorkspace(
  workspaceId: string,
  loc?: string
) {
  const workspaceCachePath = path.join(WORKSPACE_CACHE_DIR, workspaceId);
  if (!(await exists(workspaceCachePath))) {
    await downloadAndCacheWorkspace(workspaceId);
  }

  const targetLocation = loc || path.join(".", workspaceId);
  await mkdirAlways(targetLocation);
  await loadWorkspace(workspaceId, targetLocation);
}
