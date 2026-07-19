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
  email: z.email().max(254),
  reportConsent: z.literal(true),
  privacyConsent: z.literal(true),
  marketingConsent: z.boolean().default(false),
});
