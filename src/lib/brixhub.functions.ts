import { createServerFn } from "@tanstack/react-start";
import { brixFetch } from "./brixhub.server";

export type SearchPayload = Record<string, string | number | boolean | undefined>;

export const searchProfiles = createServerFn({ method: "POST" })
  .inputValidator((data: SearchPayload) => data)
  .handler(async ({ data }) => {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v === "" || v === undefined || v === null) continue;
      clean[k] = v;
    }
    return brixFetch("/search", {
      method: "POST",
      body: JSON.stringify(clean),
    });
  });

export const lookupByEmail = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    return brixFetch(`/lookup/email/${encodeURIComponent(data.email)}`);
  });

export const lookupByPhone = createServerFn({ method: "POST" })
  .inputValidator((data: { phone: string }) => data)
  .handler(async ({ data }) => {
    return brixFetch(`/lookup/phone/${encodeURIComponent(data.phone)}`);
  });

export const lookupByIban = createServerFn({ method: "POST" })
  .inputValidator((data: { iban: string }) => data)
  .handler(async ({ data }) => {
    return brixFetch(`/lookup/iban/${encodeURIComponent(data.iban)}`);
  });

export const getAccountInfo = createServerFn({ method: "GET" }).handler(async () => {
  return brixFetch("/me");
});
