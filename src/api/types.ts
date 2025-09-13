export interface ParsedFormData {
  productName?: string;
  productValue?: number;
  currency?: string;
  orderNumber?: string;
  purchaseDate?: string; // YYYY-MM-DD string
  company?: string;
  otherCompany?: string; // For domains
  firstName?: string;
  lastName?: string;
  issueType?: string;
  description?: string;
}