import { EmailTemplate } from './gemini-service';

export interface WorkflowEmailTemplate extends EmailTemplate {
  id: string;
  name: string;
  type: 'approval_request' | 'approval_update' | 'payment_status' | 'reminder' | 'welcome' | 'custom';
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  orgId: string;
  createdBy: string;
}

export class TemplateManager {
  private static instance: TemplateManager;
  private templates: Map<string, WorkflowEmailTemplate> = new Map();

  static getInstance(): TemplateManager {
    if (!TemplateManager.instance) {
      TemplateManager.instance = new TemplateManager();
    }
    return TemplateManager.instance;
  }

  /**
   * Save a generated template to the workflow system
   */
  saveTemplate(
    template: EmailTemplate,
    orgId: string,
    userId: string,
    name: string,
    type: WorkflowEmailTemplate['type']
  ): WorkflowEmailTemplate {
    const workflowTemplate: WorkflowEmailTemplate = {
      ...template,
      id: this.generateTemplateId(),
      name,
      type,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      orgId,
      createdBy: userId
    };

    this.templates.set(workflowTemplate.id, workflowTemplate);
    
    // Save to localStorage for persistence (in a real app, this would be saved to database)
    this.saveToStorage();
    
    return workflowTemplate;
  }

  /**
   * Get all templates for an organization
   */
  getTemplatesByOrg(orgId: string): WorkflowEmailTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.orgId === orgId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Get templates by type
   */
  getTemplatesByType(orgId: string, type: WorkflowEmailTemplate['type']): WorkflowEmailTemplate[] {
    return this.getTemplatesByOrg(orgId)
      .filter(template => template.type === type);
  }

  /**
   * Get active template for a specific type
   */
  getActiveTemplate(orgId: string, type: WorkflowEmailTemplate['type']): WorkflowEmailTemplate | null {
    const templates = this.getTemplatesByType(orgId, type);
    return templates.find(template => template.isActive) || null;
  }

  /**
   * Update template
   */
  updateTemplate(templateId: string, updates: Partial<WorkflowEmailTemplate>): WorkflowEmailTemplate | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date()
    };

    this.templates.set(templateId, updatedTemplate);
    this.saveToStorage();
    
    return updatedTemplate;
  }

  /**
   * Delete template
   */
  deleteTemplate(templateId: string): boolean {
    const deleted = this.templates.delete(templateId);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * Set template as active (deactivates others of same type)
   */
  setActiveTemplate(templateId: string): boolean {
    const template = this.templates.get(templateId);
    if (!template) return false;

    // Deactivate other templates of the same type
    Array.from(this.templates.values())
      .filter(t => t.orgId === template.orgId && t.type === template.type && t.id !== templateId)
      .forEach(t => {
        t.isActive = false;
        this.templates.set(t.id, t);
      });

    // Activate the selected template
    template.isActive = true;
    this.templates.set(templateId, template);
    
    this.saveToStorage();
    return true;
  }

  /**
   * Generate template for workflow node
   */
  generateWorkflowTemplate(
    type: WorkflowEmailTemplate['type'],
    context: {
      organizationName: string;
      recipientRole: string;
      stepName: string;
      stepNumber: number;
    }
  ): EmailTemplate {
    const templates = {
      approval_request: {
        subject: `[${context.organizationName}] Approval Required: {{requestTitle}}`,
        body: `Dear {{approverName}},

You have a new payment request requiring your approval at ${context.stepName} (Step ${context.stepNumber}).

📋 Request Details:
• Title: {{requestTitle}}
• Amount: {{amount}}
• Requested by: {{requesterName}}
• Category: {{category}}
• Urgency: {{urgency}}

Please review and take action on this request.

{{approvalUrl}}

Best regards,
${context.organizationName} Payment System`,
        variables: ['{{approverName}}', '{{requestTitle}}', '{{amount}}', '{{requesterName}}', '{{category}}', '{{urgency}}', '{{approvalUrl}}']
      },
      approval_update: {
        subject: `[${context.organizationName}] Payment Request Update: {{requestTitle}}`,
        body: `Dear {{requesterName}},

Your payment request has been updated.

📋 Request: {{requestTitle}}
💰 Amount: {{amount}}
✅ Status: {{status}}
📍 Current Step: ${context.stepName}

{{statusMessage}}

You can track your request status here: {{statusUrl}}

Best regards,
${context.organizationName} Payment System`,
        variables: ['{{requesterName}}', '{{requestTitle}}', '{{amount}}', '{{status}}', '{{statusMessage}}', '{{statusUrl}}']
      },
      payment_status: {
        subject: `[${context.organizationName}] Payment Processed: {{requestTitle}}`,
        body: `Dear {{requesterName}},

Your payment request has been successfully processed.

📋 Request: {{requestTitle}}
💰 Amount: {{amount}}
✅ Status: Payment Completed
📅 Processed Date: {{processedDate}}

Transaction details and receipts will be sent separately.

Best regards,
${context.organizationName} Finance Team`,
        variables: ['{{requesterName}}', '{{requestTitle}}', '{{amount}}', '{{processedDate}}']
      },
      reminder: {
        subject: `[${context.organizationName}] Reminder: Approval Pending for {{requestTitle}}`,
        body: `Dear {{approverName}},

This is a friendly reminder that you have a pending approval request.

📋 Request: {{requestTitle}}
💰 Amount: {{amount}}
⏰ Submitted: {{submittedDate}}
📍 Waiting at: ${context.stepName}

Please review when you have a moment: {{approvalUrl}}

Best regards,
${context.organizationName} Payment System`,
        variables: ['{{approverName}}', '{{requestTitle}}', '{{amount}}', '{{submittedDate}}', '{{approvalUrl}}']
      },
      welcome: {
        subject: `Welcome to ${context.organizationName} Payment System`,
        body: `Dear {{userName}},

Welcome to the ${context.organizationName} payment approval system!

Your account has been set up with the following details:
• Role: {{userRole}}
• Department: {{department}}
• Access Level: {{accessLevel}}

You can now:
• Submit payment requests
• Review and approve requests (if applicable)
• Track payment status
• Access reports and analytics

Get started: {{loginUrl}}

Best regards,
${context.organizationName} Admin Team`,
        variables: ['{{userName}}', '{{userRole}}', '{{department}}', '{{accessLevel}}', '{{loginUrl}}']
      },
      custom: {
        subject: `[${context.organizationName}] {{subject}}`,
        body: `Dear {{recipientName}},

{{content}}

Best regards,
${context.organizationName}`,
        variables: ['{{recipientName}}', '{{subject}}', '{{content}}']
      }
    };

    return templates[type] || templates.custom;
  }

  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      const templatesArray = Array.from(this.templates.entries());
      localStorage.setItem('workflowEmailTemplates', JSON.stringify(templatesArray));
    }
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('workflowEmailTemplates');
      if (stored) {
        try {
          const templatesArray = JSON.parse(stored);
          this.templates = new Map(templatesArray.map(([id, template]: [string, any]) => [
            id,
            {
              ...template,
              createdAt: new Date(template.createdAt),
              updatedAt: new Date(template.updatedAt)
            }
          ]));
        } catch (error) {
          console.error('Failed to load templates from storage:', error);
        }
      }
    }
  }

  constructor() {
    this.loadFromStorage();
  }
}

export const templateManager = TemplateManager.getInstance();