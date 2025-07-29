
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionnaireResponsesTable, costEstimationsTable } from '../db/schema';
import { type GetQuestionnaireBySessionInput, type CreateQuestionnaireInput } from '../schema';
import { getCostCalculationResult } from '../handlers/get_cost_calculation_result';
import { eq } from 'drizzle-orm';

// Test input for questionnaire
const testQuestionnaireInput: CreateQuestionnaireInput = {
  session_id: 'test-session-123',
  company_name: 'Test Company',
  industry: 'technology',
  data_size: 'medium',
  developer_count: 5,
  required_functionalities: ['etl', 'analytics'],
  deployment_preference: 'cloud',
  monthly_data_volume_gb: 100,
  concurrent_users: 25,
  compliance_requirements: true,
  high_availability_needed: false
};

const testInput: GetQuestionnaireBySessionInput = {
  session_id: 'test-session-123'
};

describe('getCostCalculationResult', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent session', async () => {
    const result = await getCostCalculationResult({ session_id: 'non-existent' });
    expect(result).toBeNull();
  });

  it('should calculate and return cost result for new questionnaire', async () => {
    // Create questionnaire first
    await db.insert(questionnaireResponsesTable)
      .values({
        session_id: testQuestionnaireInput.session_id,
        company_name: testQuestionnaireInput.company_name,
        industry: testQuestionnaireInput.industry,
        data_size: testQuestionnaireInput.data_size,
        developer_count: testQuestionnaireInput.developer_count,
        required_functionalities: testQuestionnaireInput.required_functionalities,
        deployment_preference: testQuestionnaireInput.deployment_preference,
        monthly_data_volume_gb: testQuestionnaireInput.monthly_data_volume_gb.toString(),
        concurrent_users: testQuestionnaireInput.concurrent_users,
        compliance_requirements: testQuestionnaireInput.compliance_requirements,
        high_availability_needed: testQuestionnaireInput.high_availability_needed
      })
      .execute();

    const result = await getCostCalculationResult(testInput);

    expect(result).toBeDefined();
    expect(result!.questionnaire.session_id).toEqual('test-session-123');
    expect(result!.questionnaire.company_name).toEqual('Test Company');
    expect(result!.questionnaire.industry).toEqual('technology');
    expect(result!.questionnaire.data_size).toEqual('medium');
    expect(typeof result!.questionnaire.monthly_data_volume_gb).toBe('number');
    expect(result!.questionnaire.monthly_data_volume_gb).toEqual(100);
    expect(result!.questionnaire.required_functionalities).toEqual(['etl', 'analytics']);

    // Verify cost estimation fields
    expect(result!.estimation.questionnaire_id).toEqual(result!.questionnaire.id);
    expect(typeof result!.estimation.base_cost).toBe('number');
    expect(typeof result!.estimation.data_storage_cost).toBe('number');
    expect(typeof result!.estimation.compute_cost).toBe('number');
    expect(typeof result!.estimation.functionality_cost).toBe('number');
    expect(typeof result!.estimation.compliance_cost).toBe('number');
    expect(typeof result!.estimation.support_cost).toBe('number');
    expect(typeof result!.estimation.total_monthly_cost).toBe('number');
    expect(typeof result!.estimation.total_annual_cost).toBe('number');
    expect(result!.estimation.cost_breakdown).toBeDefined();
    expect(typeof result!.estimation.cost_breakdown).toBe('object');
    expect(result!.estimation.recommendations).toBeInstanceOf(Array);
  });

  it('should return existing cost estimation if already calculated', async () => {
    // Create questionnaire first
    const questionnaireResult = await db.insert(questionnaireResponsesTable)
      .values({
        session_id: testQuestionnaireInput.session_id,
        company_name: testQuestionnaireInput.company_name,
        industry: testQuestionnaireInput.industry,
        data_size: testQuestionnaireInput.data_size,
        developer_count: testQuestionnaireInput.developer_count,
        required_functionalities: testQuestionnaireInput.required_functionalities,
        deployment_preference: testQuestionnaireInput.deployment_preference,
        monthly_data_volume_gb: testQuestionnaireInput.monthly_data_volume_gb.toString(),
        concurrent_users: testQuestionnaireInput.concurrent_users,
        compliance_requirements: testQuestionnaireInput.compliance_requirements,
        high_availability_needed: testQuestionnaireInput.high_availability_needed
      })
      .returning()
      .execute();

    // Create existing cost estimation
    await db.insert(costEstimationsTable)
      .values({
        questionnaire_id: questionnaireResult[0].id,
        base_cost: '500.00',
        data_storage_cost: '10.00',
        compute_cost: '125.00',
        functionality_cost: '100.00',
        compliance_cost: '183.75',
        support_cost: '50.00',
        total_monthly_cost: '968.75',
        total_annual_cost: '11625.00',
        cost_breakdown: { base: 500, storage: 10 },
        recommendations: ['Test recommendation']
      })
      .execute();

    const result = await getCostCalculationResult(testInput);

    expect(result).toBeDefined();
    expect(result!.estimation.base_cost).toEqual(500);
    expect(result!.estimation.data_storage_cost).toEqual(10);
    expect(result!.estimation.total_monthly_cost).toEqual(968.75);
    expect(result!.estimation.total_annual_cost).toEqual(11625);
    expect(result!.estimation.cost_breakdown).toEqual({ base: 500, storage: 10 });
    expect(result!.estimation.recommendations).toEqual(['Test recommendation']);
  });

  it('should save new cost estimation to database', async () => {
    // Create questionnaire first
    const questionnaireResult = await db.insert(questionnaireResponsesTable)
      .values({
        session_id: testQuestionnaireInput.session_id,
        company_name: testQuestionnaireInput.company_name,
        industry: testQuestionnaireInput.industry,
        data_size: testQuestionnaireInput.data_size,
        developer_count: testQuestionnaireInput.developer_count,
        required_functionalities: testQuestionnaireInput.required_functionalities,
        deployment_preference: testQuestionnaireInput.deployment_preference,
        monthly_data_volume_gb: testQuestionnaireInput.monthly_data_volume_gb.toString(),
        concurrent_users: testQuestionnaireInput.concurrent_users,
        compliance_requirements: testQuestionnaireInput.compliance_requirements,
        high_availability_needed: testQuestionnaireInput.high_availability_needed
      })
      .returning()
      .execute();

    await getCostCalculationResult(testInput);

    // Verify cost estimation was saved to database
    const savedEstimations = await db.select()
      .from(costEstimationsTable)
      .where(eq(costEstimationsTable.questionnaire_id, questionnaireResult[0].id))
      .execute();

    expect(savedEstimations).toHaveLength(1);
    expect(savedEstimations[0].questionnaire_id).toEqual(questionnaireResult[0].id);
    expect(parseFloat(savedEstimations[0].base_cost)).toEqual(300);
    expect(parseFloat(savedEstimations[0].data_storage_cost)).toEqual(10);
    expect(parseFloat(savedEstimations[0].compute_cost)).toEqual(125);
    expect(parseFloat(savedEstimations[0].functionality_cost)).toEqual(100);
    expect(savedEstimations[0].created_at).toBeInstanceOf(Date);
  });

  it('should calculate costs correctly for different scenarios', async () => {
    // Test enterprise scenario with high compliance
    const enterpriseInput: CreateQuestionnaireInput = {
      session_id: 'enterprise-session',
      company_name: 'Enterprise Corp',
      industry: 'finance',
      data_size: 'enterprise',
      developer_count: 20,
      required_functionalities: ['etl', 'data_warehousing', 'ml', 'analytics'],
      deployment_preference: 'hybrid',
      monthly_data_volume_gb: 1000,
      concurrent_users: 200,
      compliance_requirements: true,
      high_availability_needed: true
    };

    await db.insert(questionnaireResponsesTable)
      .values({
        session_id: enterpriseInput.session_id,
        company_name: enterpriseInput.company_name,
        industry: enterpriseInput.industry,
        data_size: enterpriseInput.data_size,
        developer_count: enterpriseInput.developer_count,
        required_functionalities: enterpriseInput.required_functionalities,
        deployment_preference: enterpriseInput.deployment_preference,
        monthly_data_volume_gb: enterpriseInput.monthly_data_volume_gb.toString(),
        concurrent_users: enterpriseInput.concurrent_users,
        compliance_requirements: enterpriseInput.compliance_requirements,
        high_availability_needed: enterpriseInput.high_availability_needed
      })
      .execute();

    const result = await getCostCalculationResult({ session_id: 'enterprise-session' });

    expect(result).toBeDefined();
    expect(result!.estimation.base_cost).toEqual(2000); // Enterprise base cost
    expect(result!.estimation.data_storage_cost).toEqual(100); // 1000 GB * $0.10
    expect(result!.estimation.compute_cost).toEqual(1000); // 200 users * $5
    expect(result!.estimation.functionality_cost).toEqual(200); // 4 functionalities * $50
    expect(result!.estimation.support_cost).toEqual(200); // 20 developers * $10
    expect(result!.estimation.compliance_cost).toBeGreaterThan(0); // 25% of other costs
    expect(result!.estimation.recommendations.length).toBeGreaterThan(0);
    expect(result!.estimation.recommendations).toContain('Consider dedicated infrastructure for enterprise-scale deployments');
    expect(result!.estimation.recommendations).toContain('Set up multi-region deployment for high availability');
  });

  it('should generate appropriate recommendations', async () => {
    // Test small company with no special requirements
    const smallInput: CreateQuestionnaireInput = {
      session_id: 'small-session',
      company_name: 'Small Corp',
      industry: 'retail',
      data_size: 'small',
      developer_count: 2,
      required_functionalities: ['analytics'],
      deployment_preference: 'cloud',
      monthly_data_volume_gb: 10,
      concurrent_users: 5,
      compliance_requirements: false,
      high_availability_needed: false
    };

    await db.insert(questionnaireResponsesTable)
      .values({
        session_id: smallInput.session_id,
        company_name: smallInput.company_name,
        industry: smallInput.industry,
        data_size: smallInput.data_size,
        developer_count: smallInput.developer_count,
        required_functionalities: smallInput.required_functionalities,
        deployment_preference: smallInput.deployment_preference,
        monthly_data_volume_gb: smallInput.monthly_data_volume_gb.toString(),
        concurrent_users: smallInput.concurrent_users,
        compliance_requirements: smallInput.compliance_requirements,
        high_availability_needed: smallInput.high_availability_needed
      })
      .execute();

    const result = await getCostCalculationResult({ session_id: 'small-session' });

    expect(result).toBeDefined();
    // Small company should have minimal recommendations
    expect(result!.estimation.recommendations.length).toEqual(0);
  });
});
