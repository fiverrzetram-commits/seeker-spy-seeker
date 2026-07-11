import { createServerFn } from "@tanstack/react-start";
import { brixFetch } from "./brixhub.server";
import { notifyTelegram } from "./telegram.server";

export type SearchPayload = Record<
  string,
  string | number | boolean | undefined
>;

export const searchProfiles = createServerFn({ method: "POST" })
  .inputValidator((data: SearchPayload) => data)
  .handler(async ({ data }) => {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v === "" || v === undefined || v === null) continue;
      clean[k] = v;
    }
    const started = Date.now();
    const res = await brixFetch("/search", {
      method: "POST",
      body: JSON.stringify(clean),
    });
    await notifyTelegram({
      type: "search",
      query: clean,
      resultCount: res.data?.results?.length ?? 0,
      status: res.status,
      durationMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    });
    return res;
  });

export const lookupByEmail = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const started = Date.now();
    const res = await brixFetch(`/lookup/email/${encodeURIComponent(data.email)}`);
    await notifyTelegram({
      type: "lookup:email",
      query: { email: data.email },
      resultCount: res.data?.results?.length ?? 0,
      status: res.status,
      durationMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    });
    return res;
  });

export const lookupByPhone = createServerFn({ method: "POST" })
  .inputValidator((data: { phone: string }) => data)
  .handler(async ({ data }) => {
    const started = Date.now();
    const res = await brixFetch(`/lookup/phone/${encodeURIComponent(data.phone)}`);
    await notifyTelegram({
      type: "lookup:phone",
      query: { phone: data.phone },
      resultCount: res.data?.results?.length ?? 0,
      status: res.status,
      durationMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    });
    return res;
  });

export const lookupByIban = createServerFn({ method: "POST" })
  .inputValidator((data: { iban: string }) => data)
  .handler(async ({ data }) => {
    const started = Date.now();
    const res = await brixFetch(`/lookup/iban/${encodeURIComponent(data.iban)}`);
    await notifyTelegram({
      type: "lookup:iban",
      query: { iban: data.iban },
      resultCount: res.data?.results?.length ?? 0,
      status: res.status,
      durationMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    });
    return res;
  });

export const getAccountInfo = createServerFn({ method: "GET" }).handler(async () => {
  return brixFetch("/me");
});
