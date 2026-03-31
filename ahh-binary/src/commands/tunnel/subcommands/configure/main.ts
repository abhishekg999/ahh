import { input, select } from "@inquirer/prompts";
import { getConfig, updateConfig } from "../../../../config/main";
import type { AppConfig } from "../../../../config/types";
import { cloudflared } from "../../../../externals/cloudflared";
import { color, startSpinner } from "../../../../utils/text";
import { isCloudflareLoggedIn } from "../login/main";

interface CloudflareTunnel {
  id: string;
  name: string;
  deleted_at?: string;
}

const TUNNEL_CREATE_REGEX = /with id ([0-9a-f-]+)/;

async function createTunnel(): Promise<{ name: string; id: string } | null> {
  const name = await input({ message: "Tunnel name" });
  if (!name.trim()) {
    console.log(color("No name provided.", "yellow"));
    return null;
  }

  const stopSpin = startSpinner("Creating tunnel...");
  const proc = await cloudflared.invoke(["tunnel", "create", name.trim()], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await proc.exited;
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  stopSpin();

  if (exitCode !== 0) {
    console.error(color(`Failed to create tunnel: ${stderr.trim()}`, "red"));
    return null;
  }

  const match = (stdout + stderr).match(TUNNEL_CREATE_REGEX);
  if (!match) {
    console.error(color("Could not parse tunnel ID from output.", "red"));
    return null;
  }

  console.log(color(`Created tunnel ${name.trim()} (${match[1]})`, "green"));
  return { name: name.trim(), id: match[1] };
}

async function listTunnels(): Promise<CloudflareTunnel[]> {
  const stopSpin = startSpinner("Fetching tunnels...");
  const proc = await cloudflared.invoke(
    ["tunnel", "list", "--output", "json"],
    { stdout: "pipe", stderr: "pipe" },
  );

  const exitCode = await proc.exited;
  const stdout = await new Response(proc.stdout).text();
  stopSpin();

  if (exitCode !== 0) return [];

  try {
    const tunnels: CloudflareTunnel[] = JSON.parse(stdout);
    return tunnels.filter((t) => !t.deleted_at);
  } catch {
    return [];
  }
}

async function selectExistingTunnel(): Promise<{
  name: string;
  id: string;
} | null> {
  const tunnels = await listTunnels();

  if (tunnels.length === 0) {
    console.log(color("No existing tunnels found.", "yellow"));
    return null;
  }

  const selected = await select({
    message: "Select tunnel",
    choices: tunnels.map((t) => ({
      name: `${t.name}  ${color(t.id, "cyan")}`,
      value: { name: t.name, id: t.id },
    })),
  });

  return selected;
}

async function routeDns(
  tunnelName: string,
  hostname: string,
): Promise<boolean> {
  const stopSpin = startSpinner("Configuring DNS route...");
  const proc = await cloudflared.invoke(
    ["tunnel", "route", "dns", tunnelName, hostname],
    { stdout: "pipe", stderr: "pipe" },
  );

  const exitCode = await proc.exited;
  const stderr = await new Response(proc.stderr).text();
  stopSpin();

  if (exitCode !== 0) {
    console.error(color(`Failed to route DNS: ${stderr.trim()}`, "red"));
    return false;
  }

  console.log(color(`Routed ${hostname} → ${tunnelName}`, "green"));
  return true;
}

async function setupTunnel(
  tunnel: { name: string; id: string },
  config: AppConfig,
): Promise<void> {
  const hostname = await input({
    message: "Hostname (e.g. tunnel.example.com)",
    validate: (v) => (v.includes(".") ? true : "Enter a valid hostname"),
  });

  const routed = await routeDns(tunnel.name, hostname);
  if (!routed) return;

  await updateConfig({
    TUNNEL: { name: tunnel.name, id: tunnel.id, hostname },
  });
  config.TUNNEL = { name: tunnel.name, id: tunnel.id, hostname };
  console.log(color("Tunnel configured.", "green"));
}

export async function tunnelConfigure(): Promise<void> {
  const loggedIn = await isCloudflareLoggedIn();
  if (!loggedIn) {
    console.log(
      color("Not logged in. Run `ahh tunnel login` first.", "yellow"),
    );
    return;
  }

  const config = await getConfig();

  while (true) {
    if (config.TUNNEL) {
      console.log(color("\nTunnel Configuration:", "blue"));
      console.log(`  Name      ${color(config.TUNNEL.name, "cyan")}`);
      console.log(`  ID        ${color(config.TUNNEL.id, "cyan")}`);
      console.log(`  Hostname  ${color(config.TUNNEL.hostname, "cyan")}\n`);
    } else {
      console.log(color("\nNo tunnel configured.\n", "yellow"));
    }

    const action = await select({
      message: "Tunnel Configuration",
      choices: [
        { name: "Create new tunnel", value: "CREATE" },
        { name: "Use existing tunnel", value: "EXISTING" },
        ...(config.TUNNEL
          ? [{ name: "Remove tunnel config", value: "REMOVE" }]
          : []),
        { name: "Back", value: "EXIT" },
      ],
    });

    switch (action) {
      case "CREATE": {
        const tunnel = await createTunnel();
        if (tunnel) await setupTunnel(tunnel, config);
        break;
      }

      case "EXISTING": {
        const tunnel = await selectExistingTunnel();
        if (tunnel) await setupTunnel(tunnel, config);
        break;
      }

      case "REMOVE": {
        await updateConfig({ TUNNEL: undefined });
        config.TUNNEL = undefined;
        console.log(color("Tunnel config removed.", "green"));
        break;
      }

      case "EXIT":
        return;
    }
  }
}
