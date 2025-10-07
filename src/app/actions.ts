'use server';

import { answerDocumentQuestions, type AnswerDocumentQuestionsInput, type AnswerDocumentQuestionsOutput } from '@/ai/flows/answer-document-questions';
import { z } from 'zod';

const actionSchema = z.object({
  documentText: z.string().min(1, { message: "Document text cannot be empty." }),
  question: z.string().min(1, { message: "Question cannot be empty." }),
});

type ActionResponse = AnswerDocumentQuestionsOutput | { error: string };

export async function askQuestionAction(params: AnswerDocumentQuestionsInput): Promise<ActionResponse> {
  const parsed = actionSchema.safeParse(params);
  
  if (!parsed.success) {
    const errorMessage = parsed.error.errors.map((e) => e.message).join(", ");
    return { error: `Invalid input: ${errorMessage}` };
  }

  try {
    const result = await answerDocumentQuestions(parsed.data);
    return result;
  } catch (e) {
    console.error("Error in askQuestionAction:", e);
    // This provides a generic error to the user for security.
    return { error: 'An unexpected error occurred while processing your question.' };
  }
}
