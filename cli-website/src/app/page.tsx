"use client";

import { Button } from "@/components/ui/button";
import { Copy, Terminal, ChevronRight, Github } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";

const installCommand = "curl -fsSL https://cli.ahh.bet/install.sh | bash";
const githubURL = "https://github.com/abhishekg999";

export default function Page() {
  const [copied, setCopied] = useState(false);
  const controls = useAnimation();

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    controls.start({
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    });
  }, [controls]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Enhanced gradient overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.8),transparent,rgba(0,0,0,0.8))]" />

      <div className="relative">
        <div className="mx-auto max-w-6xl px-4 py-32 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center space-y-12">
            <motion.div
              className="space-y-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center justify-center space-x-3 text-sm text-zinc-400">
                <Terminal className="h-4 w-4" />
                <span>CTF Toolkit</span>
              </div>
              <h1 className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-6xl font-bold tracking-tight text-transparent sm:text-7xl xl:text-8xl">
                Ahh CLI
              </h1>
              <p className="mx-auto max-w-2xl text-base text-zinc-400 sm:text-lg">
                <span className="text-zinc-300">
                  Fast, reliable, and built for hackers.
                </span>{" "}
                Your essential toolkit for CTF challenges, designed to make
                exploitation seamless.
              </p>
            </motion.div>

            <motion.div
              className="w-full max-w-2xl space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="group relative rounded-lg border border-zinc-800 bg-black/30 p-1 backdrop-blur-sm transition-all duration-300 hover:bg-black/40 hover:shadow-lg hover:shadow-green-500/10">
                <motion.div
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  animate={controls}
                />
                <div className="relative flex items-center justify-between rounded-md bg-zinc-900/90 px-4 py-3">
                  <code className="mr-8 text-sm tracking-tight text-zinc-100">
                    {installCommand}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                    onClick={copyToClipboard}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy install command</span>
                  </Button>
                </div>
              </div>
              {copied && (
                <motion.div
                  className="flex items-center justify-center space-x-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="h-1 w-1 rounded-full bg-green-500" />
                  <p className="text-center text-sm text-zinc-500">
                    Copied to clipboard
                  </p>
                </motion.div>
              )}
            </motion.div>

            <motion.div
              className="flex space-x-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Button variant="outline" className="group">
                Get Started
                <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(githubURL, "_blank")}
                className="group"
              >
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
