
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionnaireResponsesTable } from '../db/schema';
import { type CreateQuestionnaireInput, type GetQuestionnaireBySessionInput } from '../schema';
import { getQuestionnaireBySession } from '../handlers/get_questionnaire_by_session';

// Test data
const testQuestionnaireInput: CreateQuestionnaireInput = {
  session_id: 'test-session-123',
  company_name: 'Test Company',
  industry: 'technology',
  data_size: 'medium',
  developer_count: 5,
  required_functionalities: ['etl', 'analytics'],
  deployment_preference: 'cloud',
  monthly_data_volume_gb: 100.50,
  concurrent_users: 25,
  compliance_requirements: true,
  high_availability_needed: false
};

const searchInput: GetQuestionnaireBySessionInput = {
  session_id: 'test-session-123'
};

describe('getQuestionnaireBySession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return questionnaire when session exists', async () => {
    // Create test questionnaire
    await db.insert(questionnaireResponsesTable)
      .values({
        ...testQuestionnaireInput,
        monthly_data_volume_gb: testQuestionnaireInput.monthly_data_volume_gb.toString(),
        required_functionalities: testQuestionnaireInput.required_functionalities
      })
      .execute();

    const result = await getQuestionnaireBySession(searchInput);

    expect(result).not.toBeNull();
    expect(result!.session_id).toEqual('test-session-123');
    expect(result!.company_name).toEqual('Test Company');
    expect(result!.industry).toEqual('technology');
    expect(result!.data_size).toEqual('medium');
    expect(result!.developer_count).toEqual(5);
    expect(result!.required_functionalities).toEqual(['etl', 'analytics']);
    expect(result!.deployment_preference).toEqual('cloud');
    expect(result!.monthly_data_volume_gb).toEqual(100.50);
    expect(typeof result!.monthly_data_volume_gb).toEqual('number');
    expect(result!.concurrent_users).toEqual(25);
    expect(result!.compliance_requirements).toEqual(true);
    expect(result!.high_availability_needed).toEqual(false);
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when session does not exist', async () => {
    const nonExistentInput: GetQuestionnaireBySessionInput = {
      session_id: 'non-existent-session'
    };

    const result = await getQuestionnaireBySession(nonExistentInput);

    expect(result).toBeNull();
  });

  it('should return correct questionnaire when multiple sessions exist', async () => {
    // Create multiple questionnaires
    const questionnaire1 = {
      ...testQuestionnaireInput,
      session_id: 'session-1',
      company_name: 'Company 1'
    };

    const questionnaire2 = {
      ...testQuestionnaireInput,
      session_id: 'session-2',
      company_name: 'Company 2'
    };

    await db.insert(questionnaireResponsesTable)
      .values([
        {
          ...questionnaire1,
          monthly_data_volume_gb: questionnaire1.monthly_data_volume_gb.toString(),
          required_functionalities: questionnaire1.required_functionalities
        },
        {
          ...questionnaire2,
          monthly_data_volume_gb: questionnaire2.monthly_data_volume_gb.toString(),
          required_functionalities: questionnaire2.required_functionalities
        }
      ])
      .execute();

    const result = await getQuestionnaireBySession({ session_id: 'session-2' });

    expect(result).not.toBeNull();
    expect(result!.session_id).toEqual('session-2');
    expect(result!.company_name).toEqual('Company 2');
  });

  it('should handle null company name correctly', async () => {
    const questionnaireWithNullCompany = {
      ...testQuestionnaireInput,
      company_name: null
    };

    await db.insert(questionnaireResponsesTable)
      .values({
        ...questionnaireWithNullCompany,
        monthly_data_volume_gb: questionnaireWithNullCompany.monthly_data_volume_gb.toString(),
        required_functionalities: questionnaireWithNullCompany.required_functionalities
      })
      .execute();

    const result = await getQuestionnaireBySession(searchInput);

    expect(result).not.toBeNull();
    expect(result!.company_name).toBeNull();
    expect(result!.session_id).toEqual('test-session-123');
  });
});
