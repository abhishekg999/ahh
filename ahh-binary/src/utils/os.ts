export const OS = process.platform;

export type SupportedOS = "win32" | "darwin" | "linux";
export function isSupportedOS(os: string): os is SupportedOS {
  return os === "win32" || os === "darwin" || os === "linux";
}

if (isSupportedOS(OS)) {
  // Ok
} else {
  console.warn(`Unsupported platform: ${OS}. Some features may not work.`);
}
