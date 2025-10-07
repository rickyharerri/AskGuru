'use server';

/**
 * @fileOverview This file defines a Genkit flow for answering questions about the content of an uploaded document.
 *
 * It includes:
 * - `answerDocumentQuestions`: An asynchronous function that takes a document and a question as input and returns an answer extracted from the document.
 * - `AnswerDocumentQuestionsInput`: The input type for the `answerDocumentQuestions` function.
 * - `AnswerDocumentQuestionsOutput`: The output type for the `answerDocumentQuestions` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema
const AnswerDocumentQuestionsInputSchema = z.object({
  documentText: z.string().describe('The text content of the document.'),
  question: z.string().describe('The question to be answered about the document.'),
});

export type AnswerDocumentQuestionsInput = z.infer<typeof AnswerDocumentQuestionsInputSchema>;

// Define the output schema
const AnswerDocumentQuestionsOutputSchema = z.object({
  answer: z.string().describe('The answer to the question, extracted from the document.'),
  snippet: z.string().optional().describe('A relevant snippet from the document that supports the answer.'),
});

export type AnswerDocumentQuestionsOutput = z.infer<typeof AnswerDocumentQuestionsOutputSchema>;

// Define the main function that will be called from the outside
export async function answerDocumentQuestions(input: AnswerDocumentQuestionsInput): Promise<AnswerDocumentQuestionsOutput> {
  return answerDocumentQuestionsFlow(input);
}

// Define the prompt
const answerDocumentQuestionsPrompt = ai.definePrompt({
  name: 'answerDocumentQuestionsPrompt',
  input: {
    schema: AnswerDocumentQuestionsInputSchema,
  },
  output: {
    schema: AnswerDocumentQuestionsOutputSchema,
  },
  prompt: `You are an expert at answering questions about documents. You will be given the content of a document and a question. Your job is to answer the question based on the information in the document.

  Document Content:
  {{documentText}}

  Question:
  {{question}}

  Answer:
`,
});

// Define the flow
const answerDocumentQuestionsFlow = ai.defineFlow(
  {
    name: 'answerDocumentQuestionsFlow',
    inputSchema: AnswerDocumentQuestionsInputSchema,
    outputSchema: AnswerDocumentQuestionsOutputSchema,
  },
  async input => {
    const {output} = await answerDocumentQuestionsPrompt(input);
    return output!;
  }
);
