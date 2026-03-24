import type { AnyCommand } from "../types/command";
import { clipCommand } from "./clip/command";
import { portCommand } from "./port/command";
import { qrCommand } from "./qr/command";
import { serveCommand } from "./serve/command";
import { shareDiscordCommand } from "./share-discord/command";
import { tunnelCommand } from "./tunnel/command";
import { updateCommand } from "./update/command";
import { webhookCommand } from "./webhook/command";
import { workspaceCommand } from "./workspace/command";

// Type safety is enforced at each command's definition site via AhhCommand<U>.
// The cast to AnyCommand[] is needed because handler arg types are contravariant.
export const commands = [
  clipCommand,
  portCommand,
  qrCommand,
  serveCommand,
  shareDiscordCommand,
  tunnelCommand,
  updateCommand,
  webhookCommand,
  workspaceCommand,
] as AnyCommand[];
