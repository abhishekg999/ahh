import { z } from "zod";

export const appConfigSchema = z.object({
  DEFAULT_WEBHOOK_HTTP_PORT: z.number(),
  DEFAULT_WEBHOOK_HTTPS_PORT: z.number(),

  DISCORD_WEBHOOKS: z.array(
    z.object({
      url: z.string(),
      name: z.string(),
    }),
  ),
  DEFAULT_DISCORD_WEBHOOK: z.string().optional(),

  LLM_BASE_URL: z.string().optional(),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().optional(),
  LLM_AUTO_EXECUTE: z.boolean().optional(),

  TUNNEL: z
    .object({
      name: z.string(),
      id: z.string(),
      hostname: z.string(),
      routerPort: z.number().optional(),
    })
    .optional(),
});

export const customAppConfig = appConfigSchema.partial();

export type AppConfig = z.infer<typeof appConfigSchema>;
export type CustomAppConfig = z.infer<typeof customAppConfig>;

export const DefaultAppConfig: AppConfig = {
  DEFAULT_WEBHOOK_HTTP_PORT: 4867,
  DEFAULT_WEBHOOK_HTTPS_PORT: 4868,
  DISCORD_WEBHOOKS: [],
};
