
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionnaireResponsesTable } from '../db/schema';
import { type CreateQuestionnaireInput } from '../schema';
import { getAllQuestionnaires } from '../handlers/get_all_questionnaires';

// Test data
const testQuestionnaire1: CreateQuestionnaireInput = {
  session_id: 'session-1',
  company_name: 'Test Company 1',
  industry: 'finance',
  data_size: 'medium',
  developer_count: 5,
  required_functionalities: ['etl', 'analytics'],
  deployment_preference: 'cloud',
  monthly_data_volume_gb: 100.50,
  concurrent_users: 25,
  compliance_requirements: true,
  high_availability_needed: true
};

const testQuestionnaire2: CreateQuestionnaireInput = {
  session_id: 'session-2',
  company_name: 'Test Company 2',
  industry: 'healthcare',
  data_size: 'large',
  developer_count: 10,
  required_functionalities: ['ml', 'real_time'],
  deployment_preference: 'on_premise',
  monthly_data_volume_gb: 500.75,
  concurrent_users: 100,
  compliance_requirements: false,
  high_availability_needed: true
};

describe('getAllQuestionnaires', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no questionnaires exist', async () => {
    const result = await getAllQuestionnaires();
    expect(result).toEqual([]);
  });

  it('should return all questionnaires', async () => {
    // Create test data
    await db.insert(questionnaireResponsesTable)
      .values([
        {
          ...testQuestionnaire1,
          monthly_data_volume_gb: testQuestionnaire1.monthly_data_volume_gb.toString(),
          required_functionalities: JSON.stringify(testQuestionnaire1.required_functionalities)
        },
        {
          ...testQuestionnaire2,
          monthly_data_volume_gb: testQuestionnaire2.monthly_data_volume_gb.toString(),
          required_functionalities: JSON.stringify(testQuestionnaire2.required_functionalities)
        }
      ])
      .execute();

    const result = await getAllQuestionnaires();

    expect(result).toHaveLength(2);
    
    // Verify first questionnaire (should be ordered by created_at desc)
    const q1 = result.find(q => q.session_id === 'session-1');
    expect(q1).toBeDefined();
    expect(q1!.company_name).toEqual('Test Company 1');
    expect(q1!.industry).toEqual('finance');
    expect(q1!.data_size).toEqual('medium');
    expect(q1!.developer_count).toEqual(5);
    expect(q1!.required_functionalities).toEqual(['etl', 'analytics']);
    expect(q1!.deployment_preference).toEqual('cloud');
    expect(q1!.monthly_data_volume_gb).toEqual(100.50);
    expect(typeof q1!.monthly_data_volume_gb).toEqual('number');
    expect(q1!.concurrent_users).toEqual(25);
    expect(q1!.compliance_requirements).toEqual(true);
    expect(q1!.high_availability_needed).toEqual(true);
    expect(q1!.id).toBeDefined();
    expect(q1!.created_at).toBeInstanceOf(Date);

    // Verify second questionnaire
    const q2 = result.find(q => q.session_id === 'session-2');
    expect(q2).toBeDefined();
    expect(q2!.company_name).toEqual('Test Company 2');
    expect(q2!.industry).toEqual('healthcare');
    expect(q2!.data_size).toEqual('large');
    expect(q2!.developer_count).toEqual(10);
    expect(q2!.required_functionalities).toEqual(['ml', 'real_time']);
    expect(q2!.deployment_preference).toEqual('on_premise');
    expect(q2!.monthly_data_volume_gb).toEqual(500.75);
    expect(typeof q2!.monthly_data_volume_gb).toEqual('number');
    expect(q2!.concurrent_users).toEqual(100);
    expect(q2!.compliance_requirements).toEqual(false);
    expect(q2!.high_availability_needed).toEqual(true);
  });

  it('should return questionnaires ordered by created_at descending', async () => {
    // Create first questionnaire
    const firstResult = await db.insert(questionnaireResponsesTable)
      .values({
        ...testQuestionnaire1,
        monthly_data_volume_gb: testQuestionnaire1.monthly_data_volume_gb.toString(),
        required_functionalities: JSON.stringify(testQuestionnaire1.required_functionalities)
      })
      .returning()
      .execute();

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second questionnaire
    const secondResult = await db.insert(questionnaireResponsesTable)
      .values({
        ...testQuestionnaire2,
        monthly_data_volume_gb: testQuestionnaire2.monthly_data_volume_gb.toString(),
        required_functionalities: JSON.stringify(testQuestionnaire2.required_functionalities)
      })
      .returning()
      .execute();

    const result = await getAllQuestionnaires();

    expect(result).toHaveLength(2);
    // Most recent should be first (session-2 was created second)
    expect(result[0].session_id).toEqual('session-2');
    expect(result[1].session_id).toEqual('session-1');
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should handle questionnaire with null company name', async () => {
    const questionnaireWithNullCompany = {
      ...testQuestionnaire1,
      company_name: null
    };

    await db.insert(questionnaireResponsesTable)
      .values({
        ...questionnaireWithNullCompany,
        monthly_data_volume_gb: questionnaireWithNullCompany.monthly_data_volume_gb.toString(),
        required_functionalities: JSON.stringify(questionnaireWithNullCompany.required_functionalities)
      })
      .execute();

    const result = await getAllQuestionnaires();

    expect(result).toHaveLength(1);
    expect(result[0].company_name).toBeNull();
    expect(result[0].session_id).toEqual('session-1');
  });
});
