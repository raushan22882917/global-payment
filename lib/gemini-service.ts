import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export interface EmailTemplateRequest {
  type: 'approval_request' | 'approval_update' | 'payment_status' | 'reminder' | 'welcome' | 'custom';
  context: {
    organizationName?: string;
    recipientRole?: string;
    paymentAmount?: number;
    currency?: string;
    urgency?: 'low' | 'medium' | 'high';
    tone?: 'formal' | 'friendly' | 'professional';
    language?: string;
  };
  customPrompt?: string;
}

export interface EmailTemplate {
  subject: string;
  body: string;
  variables: string[];
}

export class GeminiEmailService {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generateEmailTemplate(request: EmailTemplateRequest): Promise<EmailTemplate> {
    try {
      const prompt = this.buildPrompt(request);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseResponse(text);
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate email template');
    }
  }

  async improveEmailTemplate(currentTemplate: string, improvements: string[]): Promise<EmailTemplate> {
    try {
      const prompt = `
        Please improve the following email template based on these requirements:
        ${improvements.join(', ')}

        Current template:
        ${currentTemplate}

        Please provide an improved version that:
        - Maintains professional tone
        - Is clear and concise
        - Includes proper email structure
        - Uses appropriate business language
        - Includes necessary placeholders for dynamic content

        Format your response as:
        SUBJECT: [subject line]
        BODY: [email body]
        VARIABLES: [comma-separated list of variables like {{organizationName}}, {{amount}}, etc.]
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseResponse(text);
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to improve email template');
    }
  }

  async suggestEmailVariations(baseTemplate: string, count: number = 3): Promise<EmailTemplate[]> {
    try {
      const prompt = `
        Based on this email template, create ${count} different variations with different tones and styles:
        
        ${baseTemplate}
        
        Create variations that are:
        1. More formal and corporate
        2. Friendly but professional
        3. Concise and direct
        
        For each variation, format as:
        VARIATION X:
        SUBJECT: [subject line]
        BODY: [email body]
        VARIABLES: [comma-separated list of variables]
        ---
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseVariations(text);
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate email variations');
    }
  }

  private buildPrompt(request: EmailTemplateRequest): string {
    const { type, context, customPrompt } = request;
    
    let basePrompt = '';
    
    switch (type) {
      case 'approval_request':
        basePrompt = `Create a professional email template for requesting payment approval. The email should:
        - Be sent to approvers requesting their review
        - Include payment details and approval link
        - Be ${context.tone || 'professional'} in tone
        - Be suitable for ${context.recipientRole || 'manager'} level recipients`;
        break;
        
      case 'approval_update':
        basePrompt = `Create an email template to notify about approval status updates. The email should:
        - Inform about approval/rejection status
        - Include next steps if applicable
        - Be ${context.tone || 'professional'} in tone`;
        break;
        
      case 'payment_status':
        basePrompt = `Create an email template for payment status notifications. The email should:
        - Confirm payment processing status
        - Include transaction details
        - Be reassuring and professional`;
        break;
        
      case 'reminder':
        basePrompt = `Create a polite reminder email template for pending approvals. The email should:
        - Be gentle but effective
        - Include urgency level: ${context.urgency || 'medium'}
        - Maintain professional relationships`;
        break;
        
      case 'welcome':
        basePrompt = `Create a welcome email template for new organization members. The email should:
        - Be warm and welcoming
        - Include getting started information
        - Set expectations for the role`;
        break;
        
      case 'custom':
        basePrompt = customPrompt || 'Create a professional business email template';
        break;
    }

    return `
      ${basePrompt}
      
      Context:
      - Organization: ${context.organizationName || '[Organization Name]'}
      - Currency: ${context.currency || 'USD'}
      - Language: ${context.language || 'English'}
      - Tone: ${context.tone || 'professional'}
      
      Requirements:
      - Use proper business email format
      - Include appropriate placeholders for dynamic content (use {{variableName}} format)
      - Keep it concise but informative
      - Include clear call-to-action if needed
      - Make it mobile-friendly
      
      Format your response exactly as:
      SUBJECT: [subject line with placeholders]
      BODY: [email body with placeholders]
      VARIABLES: [comma-separated list of all variables used, like {{organizationName}}, {{amount}}, {{recipientName}}, etc.]
    `;
  }

  private parseResponse(text: string): EmailTemplate {
    const lines = text.split('\n');
    let subject = '';
    let body = '';
    let variables: string[] = [];
    
    let currentSection = '';
    
    for (const line of lines) {
      if (line.startsWith('SUBJECT:')) {
        subject = line.replace('SUBJECT:', '').trim();
        currentSection = 'subject';
      } else if (line.startsWith('BODY:')) {
        body = line.replace('BODY:', '').trim();
        currentSection = 'body';
      } else if (line.startsWith('VARIABLES:')) {
        const varsText = line.replace('VARIABLES:', '').trim();
        variables = varsText.split(',').map(v => v.trim()).filter(v => v);
        currentSection = 'variables';
      } else if (currentSection === 'body' && line.trim()) {
        body += '\n' + line;
      }
    }
    
    // Extract variables from template if not provided
    if (variables.length === 0) {
      const variableRegex = /\{\{([^}]+)\}\}/g;
      const foundVars = new Set<string>();
      let match;
      
      while ((match = variableRegex.exec(subject + ' ' + body)) !== null) {
        foundVars.add(`{{${match[1]}}}`);
      }
      
      variables = Array.from(foundVars);
    }
    
    return {
      subject: subject || 'Email Subject',
      body: body || 'Email body content',
      variables
    };
  }

  private parseVariations(text: string): EmailTemplate[] {
    const variations: EmailTemplate[] = [];
    const variationBlocks = text.split('VARIATION').filter(block => block.trim());
    
    for (const block of variationBlocks) {
      try {
        const template = this.parseResponse(block);
        if (template.subject && template.body) {
          variations.push(template);
        }
      } catch (error) {
        console.error('Error parsing variation:', error);
      }
    }
    
    return variations.length > 0 ? variations : [this.getDefaultTemplate()];
  }

  private getDefaultTemplate(): EmailTemplate {
    return {
      subject: 'Action Required: {{subject}}',
      body: `Dear {{recipientName}},

I hope this email finds you well.

{{content}}

Please let me know if you have any questions or need additional information.

Best regards,
{{senderName}}
{{organizationName}}`,
      variables: ['{{recipientName}}', '{{subject}}', '{{content}}', '{{senderName}}', '{{organizationName}}']
    };
  }
}

export const geminiEmailService = new GeminiEmailService();