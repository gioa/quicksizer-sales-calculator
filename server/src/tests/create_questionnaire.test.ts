
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionnaireResponsesTable } from '../db/schema';
import { type CreateQuestionnaireInput } from '../schema';
import { createQuestionnaire } from '../handlers/create_questionnaire';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateQuestionnaireInput = {
  session_id: 'test-session-123',
  company_name: 'Test Company',
  industry: 'technology',
  data_size: 'medium',
  developer_count: 5,
  required_functionalities: ['etl', 'analytics'],
  deployment_preference: 'cloud',
  monthly_data_volume_gb: 100.5,
  concurrent_users: 50,
  compliance_requirements: true,
  high_availability_needed: false
};

describe('createQuestionnaire', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a questionnaire response', async () => {
    const result = await createQuestionnaire(testInput);

    // Basic field validation
    expect(result.session_id).toEqual('test-session-123');
    expect(result.company_name).toEqual('Test Company');
    expect(result.industry).toEqual('technology');
    expect(result.data_size).toEqual('medium');
    expect(result.developer_count).toEqual(5);
    expect(result.required_functionalities).toEqual(['etl', 'analytics']);
    expect(result.deployment_preference).toEqual('cloud');
    expect(result.monthly_data_volume_gb).toEqual(100.5);
    expect(typeof result.monthly_data_volume_gb).toEqual('number');
    expect(result.concurrent_users).toEqual(50);
    expect(result.compliance_requirements).toEqual(true);
    expect(result.high_availability_needed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save questionnaire to database', async () => {
    const result = await createQuestionnaire(testInput);

    // Query database to verify persistence
    const questionnaires = await db.select()
      .from(questionnaireResponsesTable)
      .where(eq(questionnaireResponsesTable.id, result.id))
      .execute();

    expect(questionnaires).toHaveLength(1);
    const saved = questionnaires[0];
    expect(saved.session_id).toEqual('test-session-123');
    expect(saved.company_name).toEqual('Test Company');
    expect(saved.industry).toEqual('technology');
    expect(saved.data_size).toEqual('medium');
    expect(saved.developer_count).toEqual(5);
    expect(saved.required_functionalities).toEqual(['etl', 'analytics']);
    expect(saved.deployment_preference).toEqual('cloud');
    expect(parseFloat(saved.monthly_data_volume_gb)).toEqual(100.5);
    expect(saved.concurrent_users).toEqual(50);
    expect(saved.compliance_requirements).toEqual(true);
    expect(saved.high_availability_needed).toEqual(false);
    expect(saved.created_at).toBeInstanceOf(Date);
  });

  it('should handle null company name', async () => {
    const inputWithNullCompany = {
      ...testInput,
      company_name: null
    };

    const result = await createQuestionnaire(inputWithNullCompany);

    expect(result.company_name).toBeNull();
    expect(result.session_id).toEqual('test-session-123');
  });

  it('should enforce unique session_id constraint', async () => {
    // Create first questionnaire
    await createQuestionnaire(testInput);

    // Attempt to create second questionnaire with same session_id
    await expect(createQuestionnaire(testInput))
      .rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should handle different enum values correctly', async () => {
    const inputWithDifferentEnums: CreateQuestionnaireInput = {
      ...testInput,
      industry: 'finance',
      data_size: 'enterprise',
      required_functionalities: ['data_warehousing', 'ml', 'real_time'],
      deployment_preference: 'hybrid'
    };

    const result = await createQuestionnaire(inputWithDifferentEnums);

    expect(result.industry).toEqual('finance');
    expect(result.data_size).toEqual('enterprise');
    expect(result.required_functionalities).toEqual(['data_warehousing', 'ml', 'real_time']);
    expect(result.deployment_preference).toEqual('hybrid');
  });
});
