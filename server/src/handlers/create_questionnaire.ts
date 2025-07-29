
import { db } from '../db';
import { questionnaireResponsesTable } from '../db/schema';
import { type CreateQuestionnaireInput, type QuestionnaireResponse } from '../schema';

export const createQuestionnaire = async (input: CreateQuestionnaireInput): Promise<QuestionnaireResponse> => {
  try {
    // Insert questionnaire response record
    const result = await db.insert(questionnaireResponsesTable)
      .values({
        session_id: input.session_id,
        company_name: input.company_name,
        industry: input.industry,
        data_size: input.data_size,
        developer_count: input.developer_count,
        required_functionalities: input.required_functionalities,
        deployment_preference: input.deployment_preference,
        monthly_data_volume_gb: input.monthly_data_volume_gb.toString(), // Convert number to string for numeric column
        concurrent_users: input.concurrent_users,
        compliance_requirements: input.compliance_requirements,
        high_availability_needed: input.high_availability_needed
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers and cast required_functionalities to proper type
    const questionnaire = result[0];
    return {
      ...questionnaire,
      monthly_data_volume_gb: parseFloat(questionnaire.monthly_data_volume_gb), // Convert string back to number
      required_functionalities: questionnaire.required_functionalities as ("etl" | "data_warehousing" | "ml" | "analytics" | "real_time")[]
    };
  } catch (error) {
    console.error('Questionnaire creation failed:', error);
    throw error;
  }
};
