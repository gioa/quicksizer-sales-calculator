
import { z } from 'zod';

// Enums for questionnaire options
export const dataSizeEnum = z.enum(['small', 'medium', 'large', 'enterprise']);
export const functionalityEnum = z.enum(['etl', 'data_warehousing', 'ml', 'analytics', 'real_time']);
export const industryEnum = z.enum(['finance', 'healthcare', 'retail', 'manufacturing', 'technology', 'other']);
export const deploymentEnum = z.enum(['cloud', 'on_premise', 'hybrid']);

// Questionnaire response schema
export const questionnaireResponseSchema = z.object({
  id: z.number(),
  session_id: z.string(),
  company_name: z.string().nullable(),
  industry: industryEnum,
  data_size: dataSizeEnum,
  developer_count: z.number().int().positive(),
  required_functionalities: z.array(functionalityEnum),
  deployment_preference: deploymentEnum,
  monthly_data_volume_gb: z.number().positive(),
  concurrent_users: z.number().int().positive(),
  compliance_requirements: z.boolean(),
  high_availability_needed: z.boolean(),
  created_at: z.coerce.date()
});

export type QuestionnaireResponse = z.infer<typeof questionnaireResponseSchema>;

// Input schema for creating questionnaire responses
export const createQuestionnaireInputSchema = z.object({
  session_id: z.string(),
  company_name: z.string().nullable(),
  industry: industryEnum,
  data_size: dataSizeEnum,
  developer_count: z.number().int().positive(),
  required_functionalities: z.array(functionalityEnum).min(1),
  deployment_preference: deploymentEnum,
  monthly_data_volume_gb: z.number().positive(),
  concurrent_users: z.number().int().positive(),
  compliance_requirements: z.boolean(),
  high_availability_needed: z.boolean()
});

export type CreateQuestionnaireInput = z.infer<typeof createQuestionnaireInputSchema>;

// Cost estimation schema
export const costEstimationSchema = z.object({
  id: z.number(),
  questionnaire_id: z.number(),
  base_cost: z.number(),
  data_storage_cost: z.number(),
  compute_cost: z.number(),
  functionality_cost: z.number(),
  compliance_cost: z.number(),
  support_cost: z.number(),
  total_monthly_cost: z.number(),
  total_annual_cost: z.number(),
  cost_breakdown: z.record(z.string(), z.number()),
  recommendations: z.array(z.string()),
  created_at: z.coerce.date()
});

export type CostEstimation = z.infer<typeof costEstimationSchema>;

// Cost calculation result schema
export const costCalculationResultSchema = z.object({
  questionnaire: questionnaireResponseSchema,
  estimation: costEstimationSchema
});

export type CostCalculationResult = z.infer<typeof costCalculationResultSchema>;

// Schema for getting questionnaire by session
export const getQuestionnaireBySessionInputSchema = z.object({
  session_id: z.string()
});

export type GetQuestionnaireBySessionInput = z.infer<typeof getQuestionnaireBySessionInputSchema>;

// Schema for getting cost estimation by questionnaire ID
export const getCostEstimationInputSchema = z.object({
  questionnaire_id: z.number()
});

export type GetCostEstimationInput = z.infer<typeof getCostEstimationInputSchema>;
