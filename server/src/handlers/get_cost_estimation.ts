
import { db } from '../db';
import { costEstimationsTable } from '../db/schema';
import { type GetCostEstimationInput, type CostEstimation } from '../schema';
import { eq } from 'drizzle-orm';

export const getCostEstimation = async (input: GetCostEstimationInput): Promise<CostEstimation | null> => {
  try {
    const results = await db.select()
      .from(costEstimationsTable)
      .where(eq(costEstimationsTable.questionnaire_id, input.questionnaire_id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const estimation = results[0];
    
    // Convert numeric fields back to numbers
    return {
      ...estimation,
      base_cost: parseFloat(estimation.base_cost),
      data_storage_cost: parseFloat(estimation.data_storage_cost),
      compute_cost: parseFloat(estimation.compute_cost),
      functionality_cost: parseFloat(estimation.functionality_cost),
      compliance_cost: parseFloat(estimation.compliance_cost),
      support_cost: parseFloat(estimation.support_cost),
      total_monthly_cost: parseFloat(estimation.total_monthly_cost),
      total_annual_cost: parseFloat(estimation.total_annual_cost),
      cost_breakdown: estimation.cost_breakdown as Record<string, number>,
      recommendations: estimation.recommendations as string[]
    };
  } catch (error) {
    console.error('Cost estimation retrieval failed:', error);
    throw error;
  }
};
