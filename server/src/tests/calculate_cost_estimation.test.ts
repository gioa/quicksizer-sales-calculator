
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionnaireResponsesTable, costEstimationsTable } from '../db/schema';
import { type QuestionnaireResponse } from '../schema';
import { calculateCostEstimation } from '../handlers/calculate_cost_estimation';
import { eq } from 'drizzle-orm';

// Test questionnaire data
const baseQuestionnaire: QuestionnaireResponse = {
  id: 1,
  session_id: 'test-session-123',
  company_name: 'Test Company',
  industry: 'technology',
  data_size: 'medium',
  developer_count: 5,
  required_functionalities: ['etl', 'analytics'],
  deployment_preference: 'cloud',
  monthly_data_volume_gb: 100,
  concurrent_users: 50,
  compliance_requirements: false,
  high_availability_needed: false,
  created_at: new Date()
};

describe('calculateCostEstimation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should calculate basic cost estimation correctly', async () => {
    // Create prerequisite questionnaire record
    await db.insert(questionnaireResponsesTable)
      .values({
        session_id: baseQuestionnaire.session_id,
        company_name: baseQuestionnaire.company_name,
        industry: baseQuestionnaire.industry,
        data_size: baseQuestionnaire.data_size,
        developer_count: baseQuestionnaire.developer_count,
        required_functionalities: baseQuestionnaire.required_functionalities,
        deployment_preference: baseQuestionnaire.deployment_preference,
        monthly_data_volume_gb: baseQuestionnaire.monthly_data_volume_gb.toString(),
        concurrent_users: baseQuestionnaire.concurrent_users,
        compliance_requirements: baseQuestionnaire.compliance_requirements,
        high_availability_needed: baseQuestionnaire.high_availability_needed
      })
      .execute();

    const result = await calculateCostEstimation(baseQuestionnaire);

    // Verify basic structure
    expect(result.id).toBeDefined();
    expect(result.questionnaire_id).toEqual(1);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify cost calculations
    expect(typeof result.base_cost).toBe('number');
    expect(typeof result.data_storage_cost).toBe('number');
    expect(typeof result.compute_cost).toBe('number');
    expect(typeof result.functionality_cost).toBe('number');
    expect(typeof result.compliance_cost).toBe('number');
    expect(typeof result.support_cost).toBe('number');
    expect(typeof result.total_monthly_cost).toBe('number');
    expect(typeof result.total_annual_cost).toBe('number');

    // Verify cost breakdown structure
    expect(result.cost_breakdown).toBeDefined();
    expect(typeof result.cost_breakdown).toBe('object');
    expect(result.cost_breakdown['Base Platform']).toBeDefined();
    expect(result.cost_breakdown['Data Storage']).toBeDefined();
    expect(result.cost_breakdown['Compute Resources']).toBeDefined();

    // Verify recommendations - should always have at least one
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations.some(r => r.includes('Review usage patterns'))).toBe(true);
  });

  it('should calculate higher costs for enterprise data size', async () => {
    const enterpriseQuestionnaire: QuestionnaireResponse = {
      ...baseQuestionnaire,
      data_size: 'enterprise',
      monthly_data_volume_gb: 10000
    };

    await db.insert(questionnaireResponsesTable)
      .values({
        session_id: enterpriseQuestionnaire.session_id,
        company_name: enterpriseQuestionnaire.company_name,
        industry: enterpriseQuestionnaire.industry,
        data_size: enterpriseQuestionnaire.data_size,
        developer_count: enterpriseQuestionnaire.developer_count,
        required_functionalities: enterpriseQuestionnaire.required_functionalities,
        deployment_preference: enterpriseQuestionnaire.deployment_preference,
        monthly_data_volume_gb: enterpriseQuestionnaire.monthly_data_volume_gb.toString(),
        concurrent_users: enterpriseQuestionnaire.concurrent_users,
        compliance_requirements: enterpriseQuestionnaire.compliance_requirements,
        high_availability_needed: enterpriseQuestionnaire.high_availability_needed
      })
      .execute();

    const result = await calculateCostEstimation(enterpriseQuestionnaire);

    // Enterprise should have higher base cost than medium
    expect(result.base_cost).toBeGreaterThan(1000);
    expect(result.total_monthly_cost).toBeGreaterThan(3000);
  });

  it('should add compliance and high availability costs', async () => {
    const premiumQuestionnaire: QuestionnaireResponse = {
      ...baseQuestionnaire,
      compliance_requirements: true,
      high_availability_needed: true,
      deployment_preference: 'on_premise'
    };

    await db.insert(questionnaireResponsesTable)
      .values({
        session_id: premiumQuestionnaire.session_id,
        company_name: premiumQuestionnaire.company_name,
        industry: premiumQuestionnaire.industry,
        data_size: premiumQuestionnaire.data_size,
        developer_count: premiumQuestionnaire.developer_count,
        required_functionalities: premiumQuestionnaire.required_functionalities,
        deployment_preference: premiumQuestionnaire.deployment_preference,
        monthly_data_volume_gb: premiumQuestionnaire.monthly_data_volume_gb.toString(),
        concurrent_users: premiumQuestionnaire.concurrent_users,
        compliance_requirements: premiumQuestionnaire.compliance_requirements,
        high_availability_needed: premiumQuestionnaire.high_availability_needed
      })
      .execute();

    const result = await calculateCostEstimation(premiumQuestionnaire);

    // Should have compliance cost
    expect(result.compliance_cost).toBeGreaterThan(0);
    
    // Should have higher support cost for HA and on-premise
    expect(result.support_cost).toBeGreaterThan(1000);
    
    // Should include compliance-related recommendations
    expect(result.recommendations.some(r => r.includes('premise'))).toBe(true);
  });

  it('should save estimation to database', async () => {
    await db.insert(questionnaireResponsesTable)
      .values({
        session_id: baseQuestionnaire.session_id,
        company_name: baseQuestionnaire.company_name,
        industry: baseQuestionnaire.industry,
        data_size: baseQuestionnaire.data_size,
        developer_count: baseQuestionnaire.developer_count,
        required_functionalities: baseQuestionnaire.required_functionalities,
        deployment_preference: baseQuestionnaire.deployment_preference,
        monthly_data_volume_gb: baseQuestionnaire.monthly_data_volume_gb.toString(),
        concurrent_users: baseQuestionnaire.concurrent_users,
        compliance_requirements: baseQuestionnaire.compliance_requirements,
        high_availability_needed: baseQuestionnaire.high_availability_needed
      })
      .execute();

    const result = await calculateCostEstimation(baseQuestionnaire);

    // Verify record was saved to database
    const savedEstimations = await db.select()
      .from(costEstimationsTable)
      .where(eq(costEstimationsTable.id, result.id))
      .execute();

    expect(savedEstimations).toHaveLength(1);
    const saved = savedEstimations[0];
    
    expect(saved.questionnaire_id).toEqual(baseQuestionnaire.id);
    expect(parseFloat(saved.total_monthly_cost)).toEqual(result.total_monthly_cost);
    expect(parseFloat(saved.total_annual_cost)).toEqual(result.total_annual_cost);
    expect(Array.isArray(saved.recommendations)).toBe(true);
    expect(typeof saved.cost_breakdown).toBe('object');
  });

  it('should calculate functionality costs correctly', async () => {
    const mlQuestionnaire: QuestionnaireResponse = {
      ...baseQuestionnaire,
      required_functionalities: ['ml', 'real_time', 'data_warehousing']
    };

    await db.insert(questionnaireResponsesTable)
      .values({
        session_id: mlQuestionnaire.session_id,
        company_name: mlQuestionnaire.company_name,
        industry: mlQuestionnaire.industry,
        data_size: mlQuestionnaire.data_size,
        developer_count: mlQuestionnaire.developer_count,
        required_functionalities: mlQuestionnaire.required_functionalities,
        deployment_preference: mlQuestionnaire.deployment_preference,
        monthly_data_volume_gb: mlQuestionnaire.monthly_data_volume_gb.toString(),
        concurrent_users: mlQuestionnaire.concurrent_users,
        compliance_requirements: mlQuestionnaire.compliance_requirements,
        high_availability_needed: mlQuestionnaire.high_availability_needed
      })
      .execute();

    const result = await calculateCostEstimation(mlQuestionnaire);

    // Should have higher functionality cost for ML and multiple features
    expect(result.functionality_cost).toBeGreaterThan(1000);
    
    // Should recommend phased implementation for multiple functionalities (>2)
    expect(result.recommendations.some(r => r.includes('phased implementation'))).toBe(true);
  });

  it('should apply annual discount correctly', async () => {
    await db.insert(questionnaireResponsesTable)
      .values({
        session_id: baseQuestionnaire.session_id,
        company_name: baseQuestionnaire.company_name,
        industry: baseQuestionnaire.industry,
        data_size: baseQuestionnaire.data_size,
        developer_count: baseQuestionnaire.developer_count,
        required_functionalities: baseQuestionnaire.required_functionalities,
        deployment_preference: baseQuestionnaire.deployment_preference,
        monthly_data_volume_gb: baseQuestionnaire.monthly_data_volume_gb.toString(),
        concurrent_users: baseQuestionnaire.concurrent_users,
        compliance_requirements: baseQuestionnaire.compliance_requirements,
        high_availability_needed: baseQuestionnaire.high_availability_needed
      })
      .execute();

    const result = await calculateCostEstimation(baseQuestionnaire);

    // Annual cost should be monthly * 12 * 0.9 (10% discount)
    const expectedAnnual = result.total_monthly_cost * 12 * 0.9;
    expect(Math.abs(result.total_annual_cost - expectedAnnual)).toBeLessThan(0.01);
  });
});
