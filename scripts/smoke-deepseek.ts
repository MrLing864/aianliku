import { config } from "dotenv";

async function main() {
  config({ path: ".env.local", quiet: true });
  const [{ createDeepSeek }, { generateText, Output }, { z }] = await Promise.all([import("@ai-sdk/deepseek"), import("ai"), import("zod")]);
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not configured");
  const deepseek = createDeepSeek({ apiKey });
  try {
    const result = await generateText({ model: deepseek(process.env.AI_MODEL ?? "deepseek-v4-pro"), output: Output.object({ schema: z.object({ verdict: z.string(), stages: z.array(z.string()).length(3) }) }), system: "你是企业AI顾问。请输出 json。", prompt: "为一家机械制造企业的报价流程给出三个简短阶段名称。", providerOptions: { deepseek: { thinking: { type: "enabled" }, reasoningEffort: "max" } }, maxOutputTokens: 2_000, abortSignal: AbortSignal.timeout(120_000) });
    console.log(JSON.stringify({ ok: true, model: process.env.AI_MODEL ?? "deepseek-v4-pro", stageCount: result.output.stages.length, verdictPresent: Boolean(result.output.verdict), usage: result.usage }));
  } catch (error) { console.error(JSON.stringify({ ok: false, name: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message : "unknown" })); process.exit(1); }
}
void main();
