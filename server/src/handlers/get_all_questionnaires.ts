
import { db } from '../db';
import { questionnaireResponsesTable } from '../db/schema';
import { type QuestionnaireResponse } from '../schema';
import { desc } from 'drizzle-orm';

export const getAllQuestionnaires = async (): Promise<QuestionnaireResponse[]> => {
  try {
    // Get all questionnaire responses, ordered by most recent first
    const results = await db.select()
      .from(questionnaireResponsesTable)
      .orderBy(desc(questionnaireResponsesTable.created_at))
      .execute();

    // Convert numeric fields back to numbers and ensure proper typing
    return results.map(questionnaire => ({
      ...questionnaire,
      monthly_data_volume_gb: parseFloat(questionnaire.monthly_data_volume_gb),
      required_functionalities: questionnaire.required_functionalities as ('etl' | 'data_warehousing' | 'ml' | 'analytics' | 'real_time')[]
    }));
  } catch (error) {
    console.error('Failed to get all questionnaires:', error);
    throw error;
  }
};
