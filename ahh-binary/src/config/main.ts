import { exists, resource } from "../utils/fs";
import { customAppConfig, DefaultAppConfig, type AppConfig } from "./types";


const ConfigFile = resource("ahh.config.json");
export async function loadConfig(): Promise<AppConfig> {
  try {
    if (!(await exists(ConfigFile))) {
      await Bun.file(ConfigFile).write(JSON.stringify(DefaultAppConfig, null, 2));
      console.info(`Config not found. Creating at ${ConfigFile}`);
      return DefaultAppConfig;
    }
    const fileContent = await Bun.file(ConfigFile).text();
    const config = customAppConfig.parse(JSON.parse(fileContent));
    return { ...DefaultAppConfig, ...config };
  } catch (error) {
    console.error(`Failed to load config: ${error}`);
  }
  return DefaultAppConfig;
}

export async function getConfig(): Promise<AppConfig> {
  const config = await loadConfig();
  return config;
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await Bun.file(ConfigFile).write(JSON.stringify(config, null, 2));
}

export async function updateConfig(update: Partial<AppConfig>): Promise<void> {
  const config = await loadConfig();
  await saveConfig({ ...config, ...update });
}