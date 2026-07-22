import { z } from "zod";

export const assessmentInputSchema = z.object({
  industry: z.string().min(1).max(100),
  size: z.string().min(1).max(50),
  business: z.string().min(2).max(500),
  repeatedWork: z.string().min(2).max(1000),
  systems: z.string().min(1).max(500),
  volume: z.string().min(1).max(300),
  laborCost: z.string().min(1).max(300),
  budget: z.string().min(1).max(200),
  urgency: z.string().min(1).max(100),
  goal: z.string().min(2).max(1000),
  followUp: z.string().max(1000).optional(),
});

export const assessmentSubmissionSchema = assessmentInputSchema.extend({
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^(?:\+?86)?1[3-9]\d{9}$/u, "请输入有效的中国大陆手机号"),
  reportConsent: z.literal(true),
  privacyConsent: z.literal(true),
  marketingConsent: z.boolean().default(false),
});
