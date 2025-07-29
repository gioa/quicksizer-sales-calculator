
import { db } from '../db';
import { costEstimationsTable } from '../db/schema';
import { type QuestionnaireResponse, type CostEstimation } from '../schema';

export const calculateCostEstimation = async (questionnaire: QuestionnaireResponse): Promise<CostEstimation> => {
  try {
    // Base cost calculation based on data size
    const baseCostMap = {
      small: 500,
      medium: 1000,
      large: 2000,
      enterprise: 5000
    };
    const baseCost = baseCostMap[questionnaire.data_size];

    // Data storage cost - $0.1 per GB for small/medium, $0.05 for large/enterprise
    const storageRateMap = {
      small: 0.1,
      medium: 0.1,
      large: 0.05,
      enterprise: 0.03
    };
    const dataStorageCost = questionnaire.monthly_data_volume_gb * storageRateMap[questionnaire.data_size];

    // Compute cost based on developer count and concurrent users
    const computeCost = (questionnaire.developer_count * 150) + (questionnaire.concurrent_users * 10);

    // Functionality costs
    const functionalityCostMap = {
      etl: 300,
      data_warehousing: 500,
      ml: 800,
      analytics: 400,
      real_time: 600
    };
    const functionalityCost = questionnaire.required_functionalities.reduce((total, func) => {
      return total + (functionalityCostMap[func] || 0);
    }, 0);

    // Compliance cost
    const complianceCost = questionnaire.compliance_requirements ? 1000 : 0;

    // Support cost based on availability needs and deployment
    let supportCost = questionnaire.high_availability_needed ? 1500 : 500;
    if (questionnaire.deployment_preference === 'on_premise') {
      supportCost *= 1.5; // 50% premium for on-premise
    } else if (questionnaire.deployment_preference === 'hybrid') {
      supportCost *= 1.3; // 30% premium for hybrid
    }

    // Calculate totals
    const totalMonthlyCost = baseCost + dataStorageCost + computeCost + functionalityCost + complianceCost + supportCost;
    const totalAnnualCost = totalMonthlyCost * 12 * 0.9; // 10% annual discount

    // Generate cost breakdown
    const costBreakdown: Record<string, number> = {
      'Base Platform': baseCost,
      'Data Storage': dataStorageCost,
      'Compute Resources': computeCost,
      'Functionalities': functionalityCost,
      'Compliance': complianceCost,
      'Support': supportCost
    };

    // Generate recommendations based on configuration
    const recommendations: string[] = [];
    
    // Always provide at least one basic recommendation
    recommendations.push('Review usage patterns monthly to optimize costs');
    
    if (totalMonthlyCost > 5000) {
      recommendations.push('Consider annual billing for 10% discount on total costs');
    }
    
    if (dataStorageCost > totalMonthlyCost * 0.3) {
      recommendations.push('Data storage represents a large portion of costs - consider data retention policies');
    }
    
    if (questionnaire.required_functionalities.length > 2) {
      recommendations.push('Multiple functionalities selected - consider phased implementation to spread costs');
    }
    
    if (questionnaire.deployment_preference === 'on_premise') {
      recommendations.push('On-premise deployment increases support costs - evaluate cloud options for savings');
    }
    
    if (questionnaire.compliance_requirements && questionnaire.industry === 'finance') {
      recommendations.push('Financial compliance requires additional security measures - budget for quarterly audits');
    }
    
    if (questionnaire.concurrent_users > 1000) {
      recommendations.push('High user concurrency - consider load balancing and caching strategies');
    }

    // Save to database
    const result = await db.insert(costEstimationsTable)
      .values({
        questionnaire_id: questionnaire.id,
        base_cost: baseCost.toString(),
        data_storage_cost: dataStorageCost.toString(),
        compute_cost: computeCost.toString(),
        functionality_cost: functionalityCost.toString(),
        compliance_cost: complianceCost.toString(),
        support_cost: supportCost.toString(),
        total_monthly_cost: totalMonthlyCost.toString(),
        total_annual_cost: totalAnnualCost.toString(),
        cost_breakdown: costBreakdown,
        recommendations: recommendations
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers
    const estimation = result[0];
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
      cost_breakdown: costBreakdown,
      recommendations: recommendations
    };
  } catch (error) {
    console.error('Cost estimation calculation failed:', error);
    throw error;
  }
};
