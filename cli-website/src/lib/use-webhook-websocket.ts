"use client"

import { useState, useEffect, useCallback } from "react"

export interface WebhookData {
  id: string
  method: string
  path: string
  timestamp: string
  headers: Record<string, string>
  query: Record<string, string>
  body: string
}


export function useWebhookSocket(token: string, port: string) {
  const [requests, setRequests] = useState<WebhookData[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(() => {
    const ws = new WebSocket(`wss://localhost:${port}/ws`)

    ws.onopen = () => {
      setIsConnected(true)
      setError(null)
      ws.send(token)
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data === "OK") {
      } else {
        setRequests((prev) => [data, ...prev])
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      setTimeout(connect, 5000)
    }

    ws.onerror = (err) => {
      console.error("WebSocket error:", err)
      setError("Failed to connect to WebSocket")
      setIsConnected(false)
    }

    return () => {
      ws.close()
    }
  }, [token, port])

  useEffect(() => {
    const cleanup = connect()
    return cleanup
  }, [connect])

  return { requests, isConnected, error }
}

