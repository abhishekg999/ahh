import path from "path";
import { $ } from "bun";
import { exists, HOME_DIR, mkdirAlways } from "../utils/fs";
import { WORKSPACE_DOWNLOAD_PATH } from "../constants/main";

const WORKSPACE_DIR = path.join(HOME_DIR, "workspaces");
const WORKSPACE_CACHE_DIR = path.join(WORKSPACE_DIR, "cache");

await mkdirAlways(WORKSPACE_DIR);
await mkdirAlways(WORKSPACE_CACHE_DIR);

export async function downloadAndCacheWorkspace(workspaceId: string) {
    const workspaceCachePath = path.join(WORKSPACE_CACHE_DIR, workspaceId);
    await mkdirAlways(workspaceCachePath);
    
    const downloadPath = `${WORKSPACE_DOWNLOAD_PATH}/${workspaceId}/download.tar.gz`;
    await $`curl -sL ${downloadPath} | tar -xz -C ${workspaceCachePath}`;
}

async function loadWorkspace(workspaceId: string, loc: string) {
    const workspaceCachePath = path.join(WORKSPACE_CACHE_DIR, workspaceId);
    await mkdirAlways(loc);
    await $`cp -r ${workspaceCachePath}/* ${loc}`;
}

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
