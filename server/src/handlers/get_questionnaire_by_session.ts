
import { db } from '../db';
import { questionnaireResponsesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetQuestionnaireBySessionInput, type QuestionnaireResponse, functionalityEnum } from '../schema';

export const getQuestionnaireBySession = async (input: GetQuestionnaireBySessionInput): Promise<QuestionnaireResponse | null> => {
  try {
    // Query questionnaire by session_id
    const results = await db.select()
      .from(questionnaireResponsesTable)
      .where(eq(questionnaireResponsesTable.session_id, input.session_id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const questionnaire = results[0];

    // Convert numeric fields back to numbers and parse JSON fields with proper typing
    return {
      ...questionnaire,
      monthly_data_volume_gb: parseFloat(questionnaire.monthly_data_volume_gb),
      required_functionalities: questionnaire.required_functionalities as Array<typeof functionalityEnum._type>
    };
  } catch (error) {
    console.error('Failed to get questionnaire by session:', error);
    throw error;
  }
};
