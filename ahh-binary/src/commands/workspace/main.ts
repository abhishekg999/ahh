import path from "path";
import { WORKSPACE_DOWNLOAD_PATH } from "../../constants/main";
import { cp } from "../../externals/cp";
import { curl } from "../../externals/curl";
import { tar } from "../../externals/tar";
import { exists, HOME_DIR, mkdirAlways } from "../../utils/fs";

const WORKSPACE_DIR = path.join(HOME_DIR, "workspaces");
const WORKSPACE_CACHE_DIR = path.join(WORKSPACE_DIR, "cache");

await mkdirAlways(WORKSPACE_DIR);
await mkdirAlways(WORKSPACE_CACHE_DIR);

export async function downloadAndCacheWorkspace(workspaceId: string) {
  const workspaceCachePath = path.join(WORKSPACE_CACHE_DIR, workspaceId);
  await mkdirAlways(workspaceCachePath);

  const downloadPath = `${WORKSPACE_DOWNLOAD_PATH}/${workspaceId}/download.tar.gz`;
  const dl = await curl.invoke(["-sL", downloadPath], { stdout: "pipe" });
  const extract = await tar.invoke(["-xz", "-C", workspaceCachePath], {
    stdin: dl.stdout,
  });
  await extract.exited;
}

async function loadWorkspace(workspaceId: string, loc: string) {
  const workspaceCachePath = path.join(WORKSPACE_CACHE_DIR, workspaceId);
  await mkdirAlways(loc);
  const proc = await cp.invoke(["-r", `${workspaceCachePath}/.`, loc]);
  await proc.exited;
}

export async function initWorkspace(workspaceId: string, loc?: string) {
  const workspaceCachePath = path.join(WORKSPACE_CACHE_DIR, workspaceId);
  if (!(await exists(workspaceCachePath))) {
    await downloadAndCacheWorkspace(workspaceId);
  }

  const targetLocation = loc || path.join(".", workspaceId);
  await mkdirAlways(targetLocation);
  await loadWorkspace(workspaceId, targetLocation);
}
