"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Terminal,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Cpu,
  Globe,
  Sparkles,
  Box,
  Wrench,
  Settings,
  Hash,
} from "lucide-react";
import commandsData from "@/data/commands.json";

// ── Types ──────────────────────────────────────────────────────────

interface CommandExample {
  command: string;
  description: string;
}

interface DocPositional {
  name: string;
  type: string;
  description?: string;
  default?: unknown;
  required: boolean;
  array?: boolean;
  choices?: unknown[];
}

interface DocOption {
  name: string;
  alias?: string;
  type: string;
  description?: string;
  default?: unknown;
  required: boolean;
  choices?: unknown[];
}

interface DocCommand {
  name: string;
  command: string;
  describe: string;
  description: string;
  aliases: string[];
  category: string;
  examples: CommandExample[];
  positionals: DocPositional[];
  options: DocOption[];
  subcommands: DocCommand[];
}

// ── Category config ────────────────────────────────────────────────

const categoryMeta: Record<
  string,
  { label: string; icon: React.ReactNode; order: number }
> = {
  ai: { label: "AI", icon: <Sparkles className="h-4 w-4" />, order: 0 },
  shell: { label: "Shell", icon: <Terminal className="h-4 w-4" />, order: 1 },
  networking: {
    label: "Networking",
    icon: <Globe className="h-4 w-4" />,
    order: 2,
  },
  generation: {
    label: "Generation",
    icon: <Hash className="h-4 w-4" />,
    order: 3,
  },
  kubernetes: {
    label: "Kubernetes",
    icon: <Box className="h-4 w-4" />,
    order: 4,
  },
  utility: {
    label: "Utility",
    icon: <Wrench className="h-4 w-4" />,
    order: 5,
  },
  config: {
    label: "Config",
    icon: <Settings className="h-4 w-4" />,
    order: 6,
  },
};

// ── Group commands by category ─────────────────────────────────────

const commands = commandsData.commands as DocCommand[];

const grouped = commands.reduce<Record<string, DocCommand[]>>((acc, cmd) => {
  const cat = cmd.category;
  if (!acc[cat]) acc[cat] = [];
  acc[cat].push(cmd);
  return acc;
}, {});

const sortedCategories = Object.keys(grouped).sort(
  (a, b) =>
    (categoryMeta[a]?.order ?? 99) - (categoryMeta[b]?.order ?? 99)
);

// ── Components ─────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="ml-2 shrink-0 text-zinc-500 transition-colors hover:text-zinc-300"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function CommandDetail({ cmd }: { cmd: DocCommand }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-zinc-100">
            ahh {cmd.name}
          </h2>
          {cmd.aliases.length > 0 && (
            <span className="rounded border border-zinc-700 bg-zinc-800/50 px-2 py-0.5 text-xs text-zinc-400">
              alias: {cmd.aliases.join(", ")}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-zinc-400">{cmd.describe}</p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          {cmd.description}
        </p>
      </div>

      {/* Usage */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Usage
        </h3>
        <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-900/60 px-4 py-2.5">
          <code className="text-sm text-green-400">
            ahh {cmd.command}
          </code>
        </div>
      </div>

      {/* Positionals */}
      {cmd.positionals.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Arguments
          </h3>
          <div className="overflow-hidden rounded-md border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40">
                  <th className="px-4 py-2 text-left font-medium text-zinc-400">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-400">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-400">
                    Description
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-400">
                    Default
                  </th>
                </tr>
              </thead>
              <tbody>
                {cmd.positionals.map((p) => (
                  <tr
                    key={p.name}
                    className="border-b border-zinc-800/50 last:border-0"
                  >
                    <td className="px-4 py-2">
                      <code className="text-blue-400">{p.name}</code>
                      {p.required && (
                        <span className="ml-1 text-red-400">*</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-zinc-500">{p.type}</td>
                    <td className="px-4 py-2 text-zinc-300">
                      {p.description ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-zinc-500">
                      {p.default !== undefined
                        ? String(p.default)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Options */}
      {cmd.options.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Options
          </h3>
          <div className="overflow-hidden rounded-md border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40">
                  <th className="px-4 py-2 text-left font-medium text-zinc-400">
                    Flag
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-400">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-400">
                    Description
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-400">
                    Default
                  </th>
                </tr>
              </thead>
              <tbody>
                {cmd.options.map((o) => (
                  <tr
                    key={o.name}
                    className="border-b border-zinc-800/50 last:border-0"
                  >
                    <td className="px-4 py-2">
                      <code className="text-purple-400">
                        --{o.name}
                      </code>
                      {o.alias && (
                        <code className="ml-1 text-zinc-500">
                          -{o.alias}
                        </code>
                      )}
                    </td>
                    <td className="px-4 py-2 text-zinc-500">{o.type}</td>
                    <td className="px-4 py-2 text-zinc-300">
                      {o.description ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-zinc-500">
                      {o.default !== undefined
                        ? String(o.default)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Examples */}
      {cmd.examples.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Examples
          </h3>
          <div className="space-y-2">
            {cmd.examples.map((ex, i) => (
              <div
                key={i}
                className="rounded-md border border-zinc-800 bg-zinc-900/60 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <code className="text-sm text-zinc-100">{ex.command}</code>
                  <CopyButton text={ex.command} />
                </div>
                <p className="mt-1 text-xs text-zinc-500">{ex.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subcommands */}
      {cmd.subcommands.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Subcommands
          </h3>
          <div className="space-y-6">
            {cmd.subcommands.map((sub) => (
              <div
                key={sub.name}
                className="rounded-lg border border-zinc-800/60 bg-zinc-900/30 p-4"
              >
                <CommandDetail cmd={sub} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────

export default function DocsPage() {
  const [selected, setSelected] = useState<string>(commands[0]?.name ?? "");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeCommand = commands.find((c) => c.name === selected);

  return (
    <div className="relative min-h-screen bg-black">
      {/* Background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.08),transparent_50%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_50%)]" />

      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <motion.aside
          className="sticky top-0 flex h-screen shrink-0 flex-col border-r border-zinc-800/60 bg-black/80 backdrop-blur-sm"
          animate={{ width: sidebarOpen ? 260 : 52 }}
          transition={{ duration: 0.2 }}
        >
          {/* Sidebar header */}
          <div className="flex items-center justify-between border-b border-zinc-800/60 px-4 py-4">
            {sidebarOpen && (
              <Link href="/" className="flex items-center gap-2 text-zinc-300 transition-colors hover:text-zinc-100">
                <Cpu className="h-4 w-4 text-green-400" />
                <span className="text-sm font-semibold">ahh docs</span>
              </Link>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            >
              {sidebarOpen ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Sidebar nav */}
          <nav className="flex-1 overflow-y-auto px-2 py-3">
            {sortedCategories.map((cat) => {
              const meta = categoryMeta[cat] ?? {
                label: cat,
                icon: <Terminal className="h-4 w-4" />,
                order: 99,
              };
              return (
                <div key={cat} className="mb-3">
                  {sidebarOpen && (
                    <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      {meta.icon}
                      <span>{meta.label}</span>
                    </div>
                  )}
                  {!sidebarOpen && (
                    <div className="flex justify-center py-1.5 text-zinc-600">
                      {meta.icon}
                    </div>
                  )}
                  {grouped[cat].map((cmd) => (
                    <button
                      key={cmd.name}
                      onClick={() => setSelected(cmd.name)}
                      className={`flex w-full items-center rounded-md px-2 py-1.5 text-sm transition-colors ${
                        selected === cmd.name
                          ? "bg-zinc-800/80 text-green-400"
                          : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
                      } ${sidebarOpen ? "" : "justify-center"}`}
                      title={cmd.name}
                    >
                      {sidebarOpen ? (
                        <span className="truncate">{cmd.name}</span>
                      ) : (
                        <span className="text-xs">
                          {cmd.name.slice(0, 2)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })}
          </nav>

          {/* Version */}
          {sidebarOpen && (
            <div className="border-t border-zinc-800/60 px-4 py-3 text-xs text-zinc-600">
              v{commandsData.version}
            </div>
          )}
        </motion.aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-8 py-12">
            {activeCommand ? (
              <motion.div
                key={activeCommand.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CommandDetail cmd={activeCommand} />
              </motion.div>
            ) : (
              <p className="text-zinc-500">Select a command from the sidebar.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
