
import { serial, text, pgTable, timestamp, numeric, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums at database level
export const dataSizeEnum = pgEnum('data_size', ['small', 'medium', 'large', 'enterprise']);
export const functionalityEnum = pgEnum('functionality', ['etl', 'data_warehousing', 'ml', 'analytics', 'real_time']);
export const industryEnum = pgEnum('industry', ['finance', 'healthcare', 'retail', 'manufacturing', 'technology', 'other']);
export const deploymentEnum = pgEnum('deployment', ['cloud', 'on_premise', 'hybrid']);

// Questionnaire responses table
export const questionnaireResponsesTable = pgTable('questionnaire_responses', {
  id: serial('id').primaryKey(),
  session_id: text('session_id').notNull().unique(),
  company_name: text('company_name'),
  industry: industryEnum('industry').notNull(),
  data_size: dataSizeEnum('data_size').notNull(),
  developer_count: integer('developer_count').notNull(),
  required_functionalities: jsonb('required_functionalities').notNull(), // Store array of functionalities
  deployment_preference: deploymentEnum('deployment_preference').notNull(),
  monthly_data_volume_gb: numeric('monthly_data_volume_gb', { precision: 12, scale: 2 }).notNull(),
  concurrent_users: integer('concurrent_users').notNull(),
  compliance_requirements: boolean('compliance_requirements').notNull(),
  high_availability_needed: boolean('high_availability_needed').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Cost estimations table
export const costEstimationsTable = pgTable('cost_estimations', {
  id: serial('id').primaryKey(),
  questionnaire_id: integer('questionnaire_id').notNull(),
  base_cost: numeric('base_cost', { precision: 10, scale: 2 }).notNull(),
  data_storage_cost: numeric('data_storage_cost', { precision: 10, scale: 2 }).notNull(),
  compute_cost: numeric('compute_cost', { precision: 10, scale: 2 }).notNull(),
  functionality_cost: numeric('functionality_cost', { precision: 10, scale: 2 }).notNull(),
  compliance_cost: numeric('compliance_cost', { precision: 10, scale: 2 }).notNull(),
  support_cost: numeric('support_cost', { precision: 10, scale: 2 }).notNull(),
  total_monthly_cost: numeric('total_monthly_cost', { precision: 10, scale: 2 }).notNull(),
  total_annual_cost: numeric('total_annual_cost', { precision: 10, scale: 2 }).notNull(),
  cost_breakdown: jsonb('cost_breakdown').notNull(), // Store detailed breakdown
  recommendations: jsonb('recommendations').notNull(), // Store array of recommendations
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const questionnaireResponsesRelations = relations(questionnaireResponsesTable, ({ one }) => ({
  costEstimation: one(costEstimationsTable, {
    fields: [questionnaireResponsesTable.id],
    references: [costEstimationsTable.questionnaire_id],
  }),
}));

export const costEstimationsRelations = relations(costEstimationsTable, ({ one }) => ({
  questionnaireResponse: one(questionnaireResponsesTable, {
    fields: [costEstimationsTable.questionnaire_id],
    references: [questionnaireResponsesTable.id],
  }),
}));

// TypeScript types for the tables
export type QuestionnaireResponse = typeof questionnaireResponsesTable.$inferSelect;
export type NewQuestionnaireResponse = typeof questionnaireResponsesTable.$inferInsert;
export type CostEstimation = typeof costEstimationsTable.$inferSelect;
export type NewCostEstimation = typeof costEstimationsTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  questionnaireResponses: questionnaireResponsesTable,
  costEstimations: costEstimationsTable
};
