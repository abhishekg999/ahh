import { z } from "zod";

export const appConfigSchema = z.object({
  DEFAULT_WEBHOOK_HTTP_PORT: z.number(),
  DEFAULT_WEBHOOK_HTTPS_PORT: z.number(),
});

export const customAppConfig = appConfigSchema.partial();

export type AppConfig = z.infer<typeof appConfigSchema>;
export type CustomAppConfig = z.infer<typeof customAppConfig>;
