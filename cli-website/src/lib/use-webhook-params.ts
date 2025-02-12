"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useWebhookParams() {
  const [token, setToken] = useState<string>("");
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const storedToken = sessionStorage.getItem("webhookToken");
    const storedUrl = sessionStorage.getItem("webhookUrl");

    if (storedToken && storedUrl) {
      setToken(storedToken);
      setWebhookUrl(storedUrl);
    } else {
      const urlToken = searchParams.get("token") || "";
      const urlWebhookUrl = searchParams.get("url")
        ? decodeURIComponent(searchParams.get("url")!)
        : "";

      setToken(urlToken);
      setWebhookUrl(urlWebhookUrl);

      sessionStorage.setItem("webhookToken", urlToken);
      sessionStorage.setItem("webhookUrl", urlWebhookUrl);

      router.replace("/webhook");
    }
  }, [searchParams, router]);

  return { token, webhookUrl };
}
