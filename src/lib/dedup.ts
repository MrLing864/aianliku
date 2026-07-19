import { createHash } from "node:crypto";
import type { CaseStudy, DuplicateCandidate } from "@/lib/types";

const trackingParams = new Set(["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "spm", "from", "source", "ref"]);
export function normalizeUrl(value?: string) { if (!value?.trim()) return ""; try { const url = new URL(value.trim()); url.hash = ""; url.hostname = url.hostname.toLowerCase(); for (const key of [...url.searchParams.keys()]) if (trackingParams.has(key.toLowerCase())) url.searchParams.delete(key); url.searchParams.sort(); url.pathname = url.pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/"; return url.toString(); } catch { return value.trim().toLowerCase().replace(/#.*$/, "").replace(/\/$/, ""); } }
export function normalizeOrganization(value: string) { return value.toLocaleLowerCase("zh-CN").replace(/[\s·•,，.。()（）【】\[\]-]/g, "").replace(/(股份)?有限公司$/u, "").replace(/集团$/u, "").replace(/co\.?ltd\.?$/i, ""); }
export function normalizeContent(value: string) { return value.normalize("NFKC").toLocaleLowerCase("zh-CN").replace(/\s+/g, " ").replace(/[“”‘’]/g, '"').trim(); }
export function contentHash(value: string) { return createHash("sha256").update(normalizeContent(value)).digest("hex"); }
function grams(value: string) { const normalized = normalizeContent(value).replace(/[\s\p{P}\p{S}]/gu, ""); const result = new Set<string>(); if (normalized.length < 2) { if (normalized) result.add(normalized); return result; } for (let i = 0; i < normalized.length - 1; i += 1) result.add(normalized.slice(i, i + 2)); return result; }
export function textSimilarity(a: string, b: string) { const left = grams(a); const right = grams(b); if (!left.size || !right.size) return 0; let intersection = 0; for (const value of left) if (right.has(value)) intersection += 1; return intersection / (left.size + right.size - intersection); }
export const DEDUP_VECTOR_DIMENSIONS = 384;
function fnv1a(value: string, seed = 0x811c9dc5) { let hash = seed >>> 0; for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 0x01000193); } return hash >>> 0; }
export function createDedupVector(value: string) { const vector = Array<number>(DEDUP_VECTOR_DIMENSIONS).fill(0); const normalized = normalizeContent(value).replace(/[\s\p{P}\p{S}]/gu, ""); const features = new Set<string>(); for (let size = 2; size <= 3; size += 1) for (let index = 0; index <= normalized.length - size; index += 1) features.add(normalized.slice(index, index + size)); if (!features.size && normalized) features.add(normalized); for (const feature of features) { const bucket = fnv1a(feature) % DEDUP_VECTOR_DIMENSIONS; const sign = fnv1a(feature, 0x9e3779b9) % 2 === 0 ? 1 : -1; vector[bucket] += sign; } const magnitude = Math.sqrt(vector.reduce((sum, entry) => sum + entry * entry, 0)); return magnitude > 0 ? vector.map((entry) => entry / magnitude) : vector; }
function equalScore(a?: string, b?: string) { if (!a || !b) return 0; return normalizeContent(a) === normalizeContent(b) ? 1 : textSimilarity(a, b); }

export interface IncomingCase { title: string; organization: string; scenario?: string; department?: string; publishedAt?: string; implementer?: string; solution?: string; result?: string; sourceUrl?: string; sourceTitle?: string; publisher?: string; externalId?: string; rawText?: string; }

export function sourceIdentity(input: Pick<IncomingCase, "sourceUrl" | "publisher" | "externalId" | "rawText" | "title" | "organization" | "sourceTitle" | "solution" | "result">) {
  const normalizedUrl = normalizeUrl(input.sourceUrl);
  const normalizedPublisher = input.publisher ? normalizeContent(input.publisher) : "";
  const externalId = input.externalId?.trim() ?? "";
  const raw = input.rawText || [input.title, input.organization, input.sourceTitle, input.solution, input.result].filter(Boolean).join("\n");
  const hash = contentHash(raw);
  return {
    normalizedUrl,
    normalizedPublisher,
    externalId,
    contentHash: hash,
    idempotencyKey: normalizedUrl ? `url:${normalizedUrl}` : externalId && normalizedPublisher ? `external:${normalizedPublisher}:${externalId}` : `hash:${hash}`,
  };
}
export function scoreDuplicate(incoming: IncomingCase, existing: CaseStudy, vectorSimilarity = 0): DuplicateCandidate["scores"] {
  const sameOrganization = normalizeOrganization(incoming.organization) === normalizeOrganization(existing.organization.name);
  const organization = sameOrganization ? 1 : textSimilarity(incoming.organization, existing.organization.name);
  const semantic = Math.max(vectorSimilarity, textSimilarity(incoming.title, existing.title), textSimilarity(`${incoming.title} ${incoming.solution ?? ""}`, `${existing.title} ${existing.solution}`));
  const scenario = incoming.scenario ? Math.max(...existing.scenarios.map((item) => Math.max(equalScore(incoming.scenario, item.slug), equalScore(incoming.scenario, item.name), ...item.synonyms.map((synonym) => equalScore(incoming.scenario, synonym))))) : 0;
  const businessFunction = incoming.department ? Math.max(...existing.businessFunctions.map((item) => equalScore(incoming.department, item))) : 0;
  const incomingTime = incoming.publishedAt ? Date.parse(incoming.publishedAt) : Number.NaN;
  const existingTime = existing.publishedAt ? Date.parse(existing.publishedAt) : Number.NaN;
  const hasTime = Number.isFinite(incomingTime) && Number.isFinite(existingTime);
  const time = hasTime ? (Math.abs(incomingTime - existingTime) <= 1000 * 60 * 60 * 24 * 365 ? 1 : .25) : 0;
  const implementer = incoming.implementer ? Math.max(0, ...existing.implementers.map((item) => equalScore(incoming.implementer, item))) : 0;
  const metrics = incoming.result ? Math.max(...existing.results.map((item) => textSimilarity(incoming.result ?? "", `${item.label}${item.value}`))) : 0;
  const features = [
    { value: organization, weight: .30, active: true },
    { value: semantic, weight: .25, active: true },
    { value: scenario, weight: .15, active: Boolean(incoming.scenario) },
    { value: businessFunction, weight: .10, active: Boolean(incoming.department) },
    { value: time, weight: .08, active: hasTime },
    { value: implementer, weight: .05, active: Boolean(incoming.implementer) },
    { value: metrics, weight: .07, active: Boolean(incoming.result) },
  ];
  const activeWeight = features.reduce((sum, feature) => sum + (feature.active ? feature.weight : 0), 0);
  const weighted = features.reduce((sum, feature) => sum + (feature.active ? feature.value * feature.weight : 0), 0) / activeWeight;
  const overall = sameOrganization ? weighted : Math.min(.74, weighted);
  return { organization: round(organization), semantic: round(semantic), scenario: round(scenario), function: round(businessFunction), time: round(time), implementer: round(implementer), metrics: round(metrics), overall: round(overall) };
}
function round(value: number) { return Math.round(Math.min(1, Math.max(0, value)) * 1000) / 1000; }
export function duplicateLevel(score: number) { return score >= .90 ? "high" as const : score >= .75 ? "medium" as const : "low" as const; }
