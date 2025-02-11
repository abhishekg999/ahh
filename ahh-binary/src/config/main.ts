import { exists, resource } from "../utils/fs";
import { customAppConfig, type AppConfig } from "./types";

const DefaultAppConfig = {
  DEFAULT_WEBHOOK_PORT: 4867,
};

const ConfigFile = resource("ahh.config.json");
export async function loadConfig(): Promise<AppConfig> {
  try {
    if (!(await exists(ConfigFile))) {
      Bun.file(ConfigFile).write(JSON.stringify(DefaultAppConfig, null, 2));
      console.info(`Config not found. Creating at ${ConfigFile}`);
      return DefaultAppConfig;
    }
    const config = customAppConfig.parse(require(ConfigFile));
    return { ...DefaultAppConfig, ...config };
  } catch (error) {
    console.error(`Failed to load config: ${error}`);
  }
  return DefaultAppConfig;
}
