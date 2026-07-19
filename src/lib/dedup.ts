import { createHash } from "node:crypto";
import type { CaseStudy, DuplicateCandidate } from "@/lib/types";

const trackingParams = new Set(["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "spm", "from", "source", "ref"]);
export function normalizeUrl(value?: string) { if (!value?.trim()) return ""; try { const url = new URL(value.trim()); url.hash = ""; url.hostname = url.hostname.toLowerCase(); for (const key of [...url.searchParams.keys()]) if (trackingParams.has(key.toLowerCase())) url.searchParams.delete(key); url.searchParams.sort(); url.pathname = url.pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/"; return url.toString(); } catch { return value.trim().toLowerCase().replace(/#.*$/, "").replace(/\/$/, ""); } }
export function normalizeOrganization(value: string) { return value.toLocaleLowerCase("zh-CN").replace(/[\s·•,，.。()（）【】\[\]-]/g, "").replace(/(股份)?有限公司$/u, "").replace(/集团$/u, "").replace(/co\.?ltd\.?$/i, ""); }
export function normalizeContent(value: string) { return value.normalize("NFKC").toLocaleLowerCase("zh-CN").replace(/\s+/g, " ").replace(/[“”‘’]/g, '"').trim(); }
export function contentHash(value: string) { return createHash("sha256").update(normalizeContent(value)).digest("hex"); }
function grams(value: string) { const normalized = normalizeContent(value).replace(/[\s\p{P}\p{S}]/gu, ""); const result = new Set<string>(); if (normalized.length < 2) { if (normalized) result.add(normalized); return result; } for (let i = 0; i < normalized.length - 1; i += 1) result.add(normalized.slice(i, i + 2)); return result; }
export function textSimilarity(a: string, b: string) { const left = grams(a); const right = grams(b); if (!left.size || !right.size) return 0; let intersection = 0; for (const value of left) if (right.has(value)) intersection += 1; return intersection / (left.size + right.size - intersection); }
function equalScore(a?: string, b?: string) { if (!a || !b) return 0; return normalizeContent(a) === normalizeContent(b) ? 1 : textSimilarity(a, b); }

export interface IncomingCase { title: string; organization: string; scenario?: string; department?: string; publishedAt?: string; implementer?: string; solution?: string; result?: string; sourceUrl?: string; sourceTitle?: string; rawText?: string; }
export function scoreDuplicate(incoming: IncomingCase, existing: CaseStudy): DuplicateCandidate["scores"] {
  const organization = normalizeOrganization(incoming.organization) === normalizeOrganization(existing.organization.name) ? 1 : textSimilarity(incoming.organization, existing.organization.name);
  const semantic = Math.max(textSimilarity(incoming.title, existing.title), textSimilarity(`${incoming.title} ${incoming.solution ?? ""}`, `${existing.title} ${existing.solution}`));
  const scenario = incoming.scenario ? Math.max(...existing.scenarios.map((item) => Math.max(equalScore(incoming.scenario, item.slug), equalScore(incoming.scenario, item.name), ...item.synonyms.map((synonym) => equalScore(incoming.scenario, synonym))))) : 0;
  const businessFunction = incoming.department ? Math.max(...existing.businessFunctions.map((item) => equalScore(incoming.department, item))) : 0;
  const time = incoming.publishedAt && existing.publishedAt ? (Math.abs(Date.parse(incoming.publishedAt) - Date.parse(existing.publishedAt)) <= 1000 * 60 * 60 * 24 * 365 ? 1 : .25) : 0;
  const implementer = incoming.implementer ? Math.max(0, ...existing.implementers.map((item) => equalScore(incoming.implementer, item))) : 0;
  const metrics = incoming.result ? Math.max(...existing.results.map((item) => textSimilarity(incoming.result ?? "", `${item.label}${item.value}`))) : 0;
  const overall = organization * .30 + semantic * .30 + scenario * .15 + businessFunction * .08 + time * .05 + implementer * .04 + metrics * .08;
  return { organization: round(organization), semantic: round(semantic), scenario: round(scenario), function: round(businessFunction), time: round(time), implementer: round(implementer), metrics: round(metrics), overall: round(overall) };
}
function round(value: number) { return Math.round(Math.min(1, Math.max(0, value)) * 1000) / 1000; }
export function duplicateLevel(score: number) { return score >= .90 ? "high" as const : score >= .75 ? "medium" as const : "low" as const; }
