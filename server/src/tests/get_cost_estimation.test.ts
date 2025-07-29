
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionnaireResponsesTable, costEstimationsTable } from '../db/schema';
import { type GetCostEstimationInput, type CreateQuestionnaireInput } from '../schema';
import { getCostEstimation } from '../handlers/get_cost_estimation';

// Test questionnaire data
const testQuestionnaireInput: CreateQuestionnaireInput = {
  session_id: 'test-session-123',
  company_name: 'Test Company',
  industry: 'technology',
  data_size: 'medium',
  developer_count: 5,
  required_functionalities: ['etl', 'analytics'],
  deployment_preference: 'cloud',
  monthly_data_volume_gb: 100,
  concurrent_users: 20,
  compliance_requirements: true,
  high_availability_needed: true
};

describe('getCostEstimation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return cost estimation when it exists', async () => {
    // Create questionnaire first
    const questionnaireResult = await db.insert(questionnaireResponsesTable)
      .values({
        ...testQuestionnaireInput,
        monthly_data_volume_gb: testQuestionnaireInput.monthly_data_volume_gb.toString(),
        required_functionalities: testQuestionnaireInput.required_functionalities
      })
      .returning()
      .execute();

    const questionnaireId = questionnaireResult[0].id;

    // Create cost estimation
    const costData = {
      questionnaire_id: questionnaireId,
      base_cost: '500.00',
      data_storage_cost: '150.00',
      compute_cost: '300.00',
      functionality_cost: '200.00',
      compliance_cost: '100.00',
      support_cost: '50.00',
      total_monthly_cost: '1300.00',
      total_annual_cost: '15600.00',
      cost_breakdown: { storage: 150, compute: 300, features: 200 },
      recommendations: ['Consider upgrading to enterprise plan', 'Enable automated backups']
    };

    await db.insert(costEstimationsTable)
      .values(costData)
      .execute();

    // Test the handler
    const input: GetCostEstimationInput = {
      questionnaire_id: questionnaireId
    };

    const result = await getCostEstimation(input);

    expect(result).not.toBeNull();
    expect(result!.questionnaire_id).toEqual(questionnaireId);
    expect(result!.base_cost).toEqual(500.00);
    expect(result!.data_storage_cost).toEqual(150.00);
    expect(result!.compute_cost).toEqual(300.00);
    expect(result!.functionality_cost).toEqual(200.00);
    expect(result!.compliance_cost).toEqual(100.00);
    expect(result!.support_cost).toEqual(50.00);
    expect(result!.total_monthly_cost).toEqual(1300.00);
    expect(result!.total_annual_cost).toEqual(15600.00);
    expect(result!.cost_breakdown).toEqual({ storage: 150, compute: 300, features: 200 });
    expect(result!.recommendations).toEqual(['Consider upgrading to enterprise plan', 'Enable automated backups']);
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when cost estimation does not exist', async () => {
    const input: GetCostEstimationInput = {
      questionnaire_id: 999
    };

    const result = await getCostEstimation(input);

    expect(result).toBeNull();
  });

  it('should verify numeric types are correctly converted', async () => {
    // Create questionnaire first
    const questionnaireResult = await db.insert(questionnaireResponsesTable)
      .values({
        ...testQuestionnaireInput,
        monthly_data_volume_gb: testQuestionnaireInput.monthly_data_volume_gb.toString(),
        required_functionalities: testQuestionnaireInput.required_functionalities
      })
      .returning()
      .execute();

    const questionnaireId = questionnaireResult[0].id;

    // Create cost estimation with specific numeric values
    await db.insert(costEstimationsTable)
      .values({
        questionnaire_id: questionnaireId,
        base_cost: '1234.56',
        data_storage_cost: '789.10',
        compute_cost: '456.78',
        functionality_cost: '321.99',
        compliance_cost: '111.11',
        support_cost: '222.22',
        total_monthly_cost: '3135.76',
        total_annual_cost: '37629.12',
        cost_breakdown: { test: 123.45 },
        recommendations: ['Test recommendation']
      })
      .execute();

    const input: GetCostEstimationInput = {
      questionnaire_id: questionnaireId
    };

    const result = await getCostEstimation(input);

    expect(result).not.toBeNull();
    expect(typeof result!.base_cost).toBe('number');
    expect(typeof result!.data_storage_cost).toBe('number');
    expect(typeof result!.compute_cost).toBe('number');
    expect(typeof result!.functionality_cost).toBe('number');
    expect(typeof result!.compliance_cost).toBe('number');
    expect(typeof result!.support_cost).toBe('number');
    expect(typeof result!.total_monthly_cost).toBe('number');
    expect(typeof result!.total_annual_cost).toBe('number');
    expect(result!.base_cost).toEqual(1234.56);
    expect(result!.total_annual_cost).toEqual(37629.12);
  });
});
