"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useWebhookParams() {
  const [token, setToken] = useState<string>("");
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [wsUrl, setWsUrl] = useState<string>("");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const storedToken = sessionStorage.getItem("webhookToken");
    const storedUrl = sessionStorage.getItem("webhookUrl");
    const storedWs = sessionStorage.getItem("webhookWs");

    if (storedToken && storedUrl && storedWs) {
      setToken(storedToken);
      setWebhookUrl(storedUrl);
      setWsUrl(storedWs);
    } else {
      const urlToken = searchParams.get("token") || "";
      const urlWebhookUrl = searchParams.get("url")
        ? decodeURIComponent(searchParams.get("url")!)
        : "";
      const urlWs = searchParams.get("ws")
        ? decodeURIComponent(searchParams.get("ws")!)
        : "";

      setToken(urlToken);
      setWebhookUrl(urlWebhookUrl);
      setWsUrl(urlWs);

      sessionStorage.setItem("webhookToken", urlToken);
      sessionStorage.setItem("webhookUrl", urlWebhookUrl);
      sessionStorage.setItem("webhookWs", urlWs);

      router.replace("/webhook");
    }
  }, [searchParams, router]);

  return { token, webhookUrl, wsUrl };
}
