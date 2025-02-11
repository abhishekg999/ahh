"use client"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from "lucide-react"
import { useEffect, useState } from "react"

interface WebhookRequest {
  id: string
  method: string
  path: string
  timestamp: string
  headers: Record<string, string>
  query: Record<string, string>
  body: string
  status: "success" | "error" | "pending"
}

export function WebhookDashboard() {
  const [isOpen, setIsOpen] = useState(false)
  const [requests] = useState<WebhookRequest[]>([
    {
      id: "1",
      method: "POST",
      path: "/api/webhook",
      timestamp: new Date().toISOString(),
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "curl/7.64.1",
        Authorization: "Bearer sk_test_123",
      },
      query: {},
      body: '{"event": "user.created", "data": {"id": "123", "email": "user@example.com"}}',
      status: "success",
    },
    {
      id: "2",
      method: "GET",
      path: "/api/status",
      timestamp: new Date(Date.now() - 1000 * 60).toISOString(),
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      query: { id: "123" },
      body: "",
      status: "pending",
    },
  ])
  const [selectedRequest, setSelectedRequest] = useState<WebhookRequest | null>(requests[0])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <div className="flex h-screen bg-background">
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
      <div className="w-80 flex-shrink-0 border-r border-zinc-800 bg-zinc-900/50">
        <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4">
          <div className="flex items-center space-x-2">
            <Terminal className="h-5 w-5 text-green-500" />
            <span className="font-cal text-sm">Ahh Webhooks</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
              <Input placeholder="Search requests" className="pl-8" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>All requests</DropdownMenuItem>
                <DropdownMenuItem>Successful only</DropdownMenuItem>
                <DropdownMenuItem>Failed only</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="overflow-auto px-2">
          {requests.map((request) => (
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
                    request.method === "POST" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {request.method}
                </span>
                <span className="text-xs text-zinc-500">{new Date(request.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="mt-2 truncate text-sm text-zinc-300">{request.path}</div>
              <div className="mt-1 flex items-center space-x-2">
                {request.headers.Authorization && <KeyRound className="h-3 w-3 text-amber-500" />}
                <span className="text-xs text-zinc-500">{Object.keys(request.headers).length} headers</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6">
          <div className="flex items-center space-x-4">
            <h1 className="font-cal text-lg text-zinc-100">Webhook Requests</h1>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              <RefreshCcw className="mr-2 h-3 w-3" />
              Auto-refresh
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="outline" size="sm">
                  <KeyRound className="mr-2 h-4 w-4" />
                  Webhook URL
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="flex justify-between space-x-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">Your webhook URL</h4>
                    <p className="text-sm text-zinc-500">Use this URL to receive webhook events</p>
                    <code className="mt-2 block rounded bg-zinc-900 px-2 py-1 text-xs">
                      https://cli.ahh.bet/webhook/abc123
                    </code>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Webhook
            </Button>
          </div>
        </div>

        {selectedRequest && (
          <div className="p-6">
            <Tabs defaultValue="headers" className="w-full">
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
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 divide-y divide-zinc-800">
                  {Object.entries(selectedRequest.headers).map(([key, value]) => (
                    <div key={key} className="flex">
                      <div className="w-1/3 p-3 font-mono text-sm text-zinc-400">{key}</div>
                      <div className="w-2/3 border-l border-zinc-800 p-3 font-mono text-sm text-zinc-100">{value}</div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="query" className="mt-4">
                {Object.keys(selectedRequest.query).length === 0 ? (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-500">
                    No query parameters
                  </div>
                ) : (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 divide-y divide-zinc-800">
                    {Object.entries(selectedRequest.query).map(([key, value]) => (
                      <div key={key} className="flex">
                        <div className="w-1/3 p-3 font-mono text-sm text-zinc-400">{key}</div>
                        <div className="w-2/3 border-l border-zinc-800 p-3 font-mono text-sm text-zinc-100">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="body" className="mt-4">
                <pre className="overflow-auto rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 font-mono text-sm text-zinc-100">
                  {JSON.stringify(JSON.parse(selectedRequest.body), null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}

