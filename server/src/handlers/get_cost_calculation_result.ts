
import { db } from '../db';
import { questionnaireResponsesTable, costEstimationsTable } from '../db/schema';
import { type GetQuestionnaireBySessionInput, type CostCalculationResult } from '../schema';
import { eq } from 'drizzle-orm';

export async function getCostCalculationResult(input: GetQuestionnaireBySessionInput): Promise<CostCalculationResult | null> {
  try {
    // Get questionnaire by session_id
    const questionnaireResults = await db.select()
      .from(questionnaireResponsesTable)
      .where(eq(questionnaireResponsesTable.session_id, input.session_id))
      .execute();

    if (questionnaireResults.length === 0) {
      return null;
    }

    const questionnaireData = questionnaireResults[0];

    // Check if cost estimation already exists
    const existingEstimations = await db.select()
      .from(costEstimationsTable)
      .where(eq(costEstimationsTable.questionnaire_id, questionnaireData.id))
      .execute();

    let estimationData;

    if (existingEstimations.length > 0) {
      // Use existing estimation
      estimationData = existingEstimations[0];
    } else {
      // Calculate new cost estimation
      const calculatedEstimation = calculateCostEstimation(questionnaireData);
      
      // Save the new estimation to database
      const insertResult = await db.insert(costEstimationsTable)
        .values({
          questionnaire_id: questionnaireData.id,
          base_cost: calculatedEstimation.base_cost.toString(),
          data_storage_cost: calculatedEstimation.data_storage_cost.toString(),
          compute_cost: calculatedEstimation.compute_cost.toString(),
          functionality_cost: calculatedEstimation.functionality_cost.toString(),
          compliance_cost: calculatedEstimation.compliance_cost.toString(),
          support_cost: calculatedEstimation.support_cost.toString(),
          total_monthly_cost: calculatedEstimation.total_monthly_cost.toString(),
          total_annual_cost: calculatedEstimation.total_annual_cost.toString(),
          cost_breakdown: calculatedEstimation.cost_breakdown,
          recommendations: calculatedEstimation.recommendations
        })
        .returning()
        .execute();

      estimationData = insertResult[0];
    }

    // Convert questionnaire numeric fields to numbers and cast jsonb fields
    const questionnaire = {
      ...questionnaireData,
      monthly_data_volume_gb: parseFloat(questionnaireData.monthly_data_volume_gb),
      required_functionalities: questionnaireData.required_functionalities as ("etl" | "data_warehousing" | "ml" | "analytics" | "real_time")[]
    };

    // Convert estimation numeric fields to numbers and cast jsonb fields
    const estimation = {
      ...estimationData,
      base_cost: parseFloat(estimationData.base_cost),
      data_storage_cost: parseFloat(estimationData.data_storage_cost),
      compute_cost: parseFloat(estimationData.compute_cost),
      functionality_cost: parseFloat(estimationData.functionality_cost),
      compliance_cost: parseFloat(estimationData.compliance_cost),
      support_cost: parseFloat(estimationData.support_cost),
      total_monthly_cost: parseFloat(estimationData.total_monthly_cost),
      total_annual_cost: parseFloat(estimationData.total_annual_cost),
      cost_breakdown: estimationData.cost_breakdown as Record<string, number>,
      recommendations: estimationData.recommendations as string[]
    };

    return {
      questionnaire,
      estimation
    };
  } catch (error) {
    console.error('Get cost calculation result failed:', error);
    throw error;
  }
}

// Internal cost calculation function
function calculateCostEstimation(questionnaire: typeof questionnaireResponsesTable.$inferSelect) {
  // Base cost calculation based on data size
  const baseCosts: Record<string, number> = {
    small: 100,
    medium: 300,
    large: 800,
    enterprise: 2000
  };

  const base_cost = baseCosts[questionnaire.data_size] || 100;

  // Data storage cost: $0.10 per GB per month
  const data_storage_cost = parseFloat(questionnaire.monthly_data_volume_gb) * 0.10;

  // Compute cost based on concurrent users: $5 per user
  const compute_cost = questionnaire.concurrent_users * 5;

  // Functionality cost: $50 per functionality
  const required_functionalities = questionnaire.required_functionalities as ("etl" | "data_warehousing" | "ml" | "analytics" | "real_time")[];
  const functionality_cost = required_functionalities.length * 50;

  // Compliance cost: additional 25% if compliance required
  const compliance_cost = questionnaire.compliance_requirements ? 
    (base_cost + data_storage_cost + compute_cost + functionality_cost) * 0.25 : 0;

  // Support cost: $10 per developer
  const support_cost = questionnaire.developer_count * 10;

  const total_monthly_cost = base_cost + data_storage_cost + compute_cost + 
    functionality_cost + compliance_cost + support_cost;
  
  const total_annual_cost = total_monthly_cost * 12;

  // Generate cost breakdown
  const cost_breakdown: Record<string, number> = {
    base_cost,
    data_storage_cost,
    compute_cost,
    functionality_cost,
    compliance_cost,
    support_cost
  };

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (questionnaire.data_size === 'enterprise') {
    recommendations.push('Consider dedicated infrastructure for enterprise-scale deployments');
  }
  
  if (questionnaire.compliance_requirements) {
    recommendations.push('Implement comprehensive audit logging and data encryption');
  }
  
  if (questionnaire.high_availability_needed) {
    recommendations.push('Set up multi-region deployment for high availability');
  }
  
  if (questionnaire.concurrent_users > 100) {
    recommendations.push('Consider implementing load balancing and auto-scaling');
  }

  return {
    base_cost,
    data_storage_cost,
    compute_cost,
    functionality_cost,
    compliance_cost,
    support_cost,
    total_monthly_cost,
    total_annual_cost,
    cost_breakdown,
    recommendations
  };
}
