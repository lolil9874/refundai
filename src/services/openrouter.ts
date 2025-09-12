import OpenAI from 'openai';

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
  defaultHeaders: {
    'HTTP-Referer': window.location.origin,
    'X-Title': 'REFUND.AI',
  },
  dangerouslyAllowBrowser: true, // Allow browser usage
});

export interface ParsedFormData {
  productName?: string;
  productValue?: number;
  currency?: string;
  orderNumber?: string;
  purchaseDate?: string;
  company?: string;
  otherCompany?: string;
  firstName?: string;
  lastName?: string;
  issueType?: string;
  description?: string;
}

export async function parseOCRTextWithLLM(ocrText: string): Promise<ParsedFormData> {
  try {
    const completion = await openrouter.chat.completions.create({
      model: 'nvidia/nemotron-nano-9b-v2:free',
      messages: [
        {
          role: 'system',
          content: `You are an expert at extracting structured information from receipts and invoices. 
          Extract the following information and return it as a JSON object:
          - productName, productValue, currency, orderNumber, purchaseDate (YYYY-MM-DD), company, firstName, lastName.
          If a field is not found, omit it. Return only valid JSON.`
        },
        {
          role: 'user',
          content: `Extract information from this text:\n\n${ocrText}`
        }
      ],
      temperature: 0.1,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from LLM');
    }

    // Extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch (error) {
    console.error('Error calling OpenRouter:', error);
    throw error;
  }
}