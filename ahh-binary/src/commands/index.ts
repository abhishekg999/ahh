import type { AnyCommand } from "../types/command";
import { aiCommand } from "./ai/command";
import { clipCommand } from "./clip/command";
import { k8sCommand } from "./k8s/command";
import { portCommand } from "./port/command";
import { qrCommand } from "./qr/command";
import { randCommand } from "./rand/command";
import { serveCommand } from "./serve/command";
import { shellCommand } from "./shell/command";
import { settingsCommand } from "./settings/command";
import { shareDiscordCommand } from "./share-discord/command";
import { sizeCommand } from "./size/command";
import { tmpCommand } from "./tmp/command";
import { tunnelCommand } from "./tunnel/command";
import { updateCommand } from "./update/command";
import { uuidCommand } from "./uuid/command";
import { webhookCommand } from "./webhook/command";
import { workspaceCommand } from "./workspace/command";
import { xCommand } from "./x/command";

// Type safety is enforced at each command's definition site via AhhCommand<U>.
// The cast to AnyCommand[] is needed because handler arg types are contravariant.
export const commands = [
  aiCommand,
  clipCommand,
  k8sCommand,
  portCommand,
  qrCommand,
  randCommand,
  serveCommand,
  shellCommand,
  settingsCommand,
  shareDiscordCommand,
  sizeCommand,
  tmpCommand,
  tunnelCommand,
  updateCommand,
  uuidCommand,
  webhookCommand,
  workspaceCommand,
  xCommand,
] as AnyCommand[];
