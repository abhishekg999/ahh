"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

export interface WebhookData {
  id: string;
  method: string;
  path: string;
  timestamp: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: string;
}

export function useWebhookSocket(token: string, webhookUrl: string) {
  const [requests, setRequests] = useState<WebhookData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsUrl = useMemo(() => {
    if (!webhookUrl) return null;
    try {
      const url = new URL("/ws", webhookUrl);
      url.protocol = "wss";
      return url;
    } catch (err) {
      console.error("Invalid webhook URL:", err);
      return null;
    }
  }, [webhookUrl]);

  const connect = useCallback(() => {
    if (!wsUrl) {
      setError("Invalid webhook URL");
      return () => {};
    }

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      ws.send(token);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data === "OK") {
        // Handle OK message
      } else {
        setRequests((prev) => [data, ...prev]);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setTimeout(connect, 5000);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setError("Failed to connect to WebSocket");
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [token, wsUrl]);

  useEffect(() => {
    if (wsUrl) {
      const cleanup = connect();
      return cleanup;
    }
  }, [connect, wsUrl]);

  return { requests, isConnected, error };
}
