"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useWebhookSocket,
  type WebhookData,
} from "@/lib/use-webhook-websocket";
import { useWebhookParams } from "@/lib/use-webhook-params";
import {
  ChevronDown,
  Copy,
  Filter,
  KeyRound,
  MoreVertical,
  Plus,
  RefreshCcw,
  Search,
  Terminal,
  Trash,
} from "lucide-react";
import { useEffect, useState } from "react";

export function WebhookDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WebhookData | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const { token, webhookUrl } = useWebhookParams();
  const { requests, isConnected } = useWebhookSocket(token, webhookUrl);

  const filteredRequests = requests.filter(
    (request) =>
      request.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(request.body)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (filteredRequests.length > 0 && !selectedRequest) {
      setSelectedRequest(filteredRequests[0]);
    }
  }, [filteredRequests, selectedRequest]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <Command>
          <CommandInput placeholder="Search all requests..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem>Create new webhook</CommandItem>
              <CommandItem>Copy webhook URL</CommandItem>
              <CommandItem>Clear all requests</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>

      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
        <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4">
          <div className="flex items-center space-x-2">
            <Terminal className="h-5 w-5 text-green-500" />
            <span className="font-mono text-sm">Ahh Webhooks</span>
          </div>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <div className="h-2 w-2 rounded-full bg-green-500" />
            ) : (
              <div className="h-2 w-2 rounded-full bg-red-500" />
            )}
            <span className="text-xs text-zinc-400">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
        <div className="p-4">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search requests"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>All requests</DropdownMenuItem>
                <DropdownMenuItem>POST only</DropdownMenuItem>
                <DropdownMenuItem>GET only</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex-1 overflow-auto px-2">
          {filteredRequests.map((request) => (
            <button
              key={request.id}
              onClick={() => setSelectedRequest(request)}
              className={`mb-1 w-full rounded-md p-3 text-left transition-colors hover:bg-zinc-800/50 ${
                selectedRequest?.id === request.id ? "bg-zinc-800/80" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    request.method === "POST"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {request.method}
                </span>
                <span className="text-xs text-zinc-500">
                  {new Date(request.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="mt-2 truncate text-sm text-zinc-300">
                {request.path}
              </div>
              <div className="mt-1 flex items-center justify-between space-x-2">
                {request.headers.Authorization && (
                  <KeyRound className="h-3 w-3 text-amber-500" />
                )}
                <span className="text-xs text-zinc-500">
                  {Object.keys(request.headers).length} headers
                </span>
                <span className="text-xs text-zinc-500">
                  {Object.keys(request.query).length} query params 
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6">
          <div className="flex items-center space-x-4">
            <h1 className="font-mono text-lg text-zinc-100">
              Webhook Requests
            </h1>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              <RefreshCcw className="mr-2 h-3 w-3" />
              Auto-refresh
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <KeyRound className="mr-2 h-4 w-4" />
                Webhook URL
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 mt-1">
              <div className="p-3">
                {webhookUrl ? 
                <>
                  <h4 className="mb-2 text-sm font-semibold">Your webhook URL</h4>
                  <button
                  onClick={() => navigator.clipboard.writeText(webhookUrl)}
                  className="w-full group"
                  >
                  <code className="block w-full rounded bg-zinc-900 px-2 py-1 text-xs transition-colors group-hover:bg-zinc-800">
                    {webhookUrl}
                  </code>
                  </button>
                  <p className="mt-2 text-xs text-zinc-500">
                  Click to copy to clipboard
                  </p>
                </> : 
                <>
                  <p className="text-xs text-zinc-500">No webhook URL available.</p>
                </>}

              </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Webhook
            </Button>
          </div>
        </div>

        {selectedRequest && (
          <div className="flex-1 overflow-auto p-6">          
            <Tabs defaultValue="headers" className="w-full h-full">
              <div className="flex items-center justify-between">
                <TabsList className="w-auto bg-zinc-900/50">
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                  <TabsTrigger value="query">Query</TabsTrigger>
                  <TabsTrigger value="body">Body</TabsTrigger>
                </TabsList>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy as cURL
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-500">
                      <Trash className="mr-2 h-4 w-4" />
                      Delete request
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <TabsContent value="headers" className="mt-4 space-y-4">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 divide-y divide-zinc-800 max-h-[calc(100vh-10rem)] overflow-auto">
                  {Object.entries(selectedRequest.headers).map(
                    ([key, value]) => (
                      <div key={key} className="flex">
                        <div className="w-1/3 p-3 font-mono text-sm text-zinc-400">
                          {key}
                        </div>
                        <div className="w-2/3 border-l border-zinc-800 p-3 font-mono text-sm text-zinc-100">
                          {value}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </TabsContent>
              <TabsContent value="query" className="mt-4">
                {Object.keys(selectedRequest.query).length === 0 ? (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-500">
                    No query parameters
                  </div>
                ) : (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 divide-y divide-zinc-800 max-h-[calc(100vh-14rem)] overflow-auto">
                    {Object.entries(selectedRequest.query).map(
                      ([key, value]) => (
                        <div key={key} className="flex">
                          <div className="w-1/3 p-3 font-mono text-sm text-zinc-400">
                            {key}
                          </div>
                          <div className="w-2/3 border-l border-zinc-800 p-3 font-mono text-sm text-zinc-100">
                            {value}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="body" className="mt-4">
                <pre className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 font-mono text-sm text-zinc-100 max-h-[calc(100vh-14rem)] overflow-auto">
                  {typeof selectedRequest.body === "string"
                    ? selectedRequest.body
                    : JSON.stringify(selectedRequest.body, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
