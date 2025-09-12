import { useState } from "react";

interface OpenRouterResponse {
  choices: [{
    message: {
      content: string;
    };
  }];
}

interface ParsedFormData {
  productName?: string;
  productValue?: number;
  currency?: string;
  orderNumber?: string;
  purchaseDate?: string;
  company?: string;
  otherCompany?: string;
  country?: string;
  firstName?: string;
  lastName?: string;
  issueCategory?: string;
  issueType?: string;
  description?: string;
}

export function useOpenRouter() {
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseOCRText = async (ocrText: string): Promise<ParsedFormData> => {
    setIsParsing(true);
    setError(null);

    try {
      const prompt = `
You are an expert at parsing receipt and invoice text to extract structured information.
Analyze the following OCR text and extract the relevant information in JSON format.

Focus on extracting:
- Product/service name
- Product value (as number)
- Currency (USD, EUR, GBP, etc.)
- Order number/invoice number
- Purchase date (in YYYY-MM-DD format if possible)
- Company name
- Customer name (split into first and last name if possible)

If a field is not found in the text, omit it from the JSON.

OCR Text:
"""
${ocrText}
"""

Return only valid JSON with the following structure:
{
  "productName": "string",
  "productValue": number,
  "currency": "string",
  "orderNumber": "string",
  "purchaseDate": "string",
  "company": "string",
  "firstName": "string",
  "lastName": "string"
}
`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'RefundAI',
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-nano-9b-v2:free',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: OpenRouterResponse = await response.json();
      const content = data.choices[0].message.content;

      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsedData: ParsedFormData = JSON.parse(jsonMatch[0]);
      return parsedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsParsing(false);
    }
  };

  return { parseOCRText, isParsing, error };
}