/**
 * Email notification service for approval workflow
 */

import { User, Organization } from '@/types';

export interface EmailTemplate {
  subject: string;
  body: string;
  variables: Record<string, string>;
}

export interface PaymentRequest {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  requestedBy: string;
  requestedAt: Date;
  category: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  currentApprovalLevel: number;
  orgId: string;
}

export interface ApprovalStep {
  stepNumber: number;
  stepName: string;
  approverType: 'ROLE' | 'USER';
  approverValue: string;
  approverEmail?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'TIMEOUT';
  approvedAt?: Date;
  approvedBy?: string;
  comments?: string;
  emailTemplate: string;
}

class EmailService {
  private baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  /**
   * Send approval request email to approver
   */
  async sendApprovalRequest(
    paymentRequest: PaymentRequest,
    approvalStep: ApprovalStep,
    approver: User,
    organization: Organization
  ): Promise<boolean> {
    try {
      const emailData = this.buildApprovalEmail(paymentRequest, approvalStep, approver, organization);
      
      // In a real implementation, you would use a service like SendGrid, AWS SES, etc.
      console.log('📧 Sending approval request email:', {
        to: approver.email,
        subject: emailData.subject,
        body: emailData.body
      });

      // Simulate email sending
      await this.simulateEmailSend(emailData, approver.email);
      
      return true;
    } catch (error) {
      console.error('Failed to send approval request email:', error);
      return false;
    }
  }

  /**
   * Send approval status update to requester
   */
  async sendApprovalUpdate(
    paymentRequest: PaymentRequest,
    approvalStep: ApprovalStep,
    requester: User,
    organization: Organization,
    isApproved: boolean
  ): Promise<boolean> {
    try {
      const emailData = this.buildApprovalUpdateEmail(
        paymentRequest, 
        approvalStep, 
        requester, 
        organization, 
        isApproved
      );
      
      console.log('📧 Sending approval update email:', {
        to: requester.email,
        subject: emailData.subject,
        body: emailData.body
      });

      await this.simulateEmailSend(emailData, requester.email);
      
      return true;
    } catch (error) {
      console.error('Failed to send approval update email:', error);
      return false;
    }
  }

  /**
   * Send final payment status email to all stakeholders
   */
  async sendPaymentStatusEmail(
    paymentRequest: PaymentRequest,
    organization: Organization,
    allStakeholders: User[],
    paymentStatus: 'PROCESSED' | 'FAILED' | 'CANCELLED'
  ): Promise<boolean> {
    try {
      const emailData = this.buildPaymentStatusEmail(paymentRequest, organization, paymentStatus);
      
      // Send to all stakeholders
      const emailPromises = allStakeholders.map(user => {
        console.log('📧 Sending payment status email:', {
          to: user.email,
          subject: emailData.subject,
          body: emailData.body
        });
        return this.simulateEmailSend(emailData, user.email);
      });

      await Promise.all(emailPromises);
      
      return true;
    } catch (error) {
      console.error('Failed to send payment status emails:', error);
      return false;
    }
  }

  /**
   * Send reminder email for pending approvals
   */
  async sendApprovalReminder(
    paymentRequest: PaymentRequest,
    approvalStep: ApprovalStep,
    approver: User,
    organization: Organization,
    hoursRemaining: number
  ): Promise<boolean> {
    try {
      const emailData = this.buildReminderEmail(
        paymentRequest, 
        approvalStep, 
        approver, 
        organization, 
        hoursRemaining
      );
      
      console.log('📧 Sending approval reminder email:', {
        to: approver.email,
        subject: emailData.subject,
        body: emailData.body
      });

      await this.simulateEmailSend(emailData, approver.email);
      
      return true;
    } catch (error) {
      console.error('Failed to send approval reminder email:', error);
      return false;
    }
  }

  /**
   * Build approval request email
   */
  private buildApprovalEmail(
    paymentRequest: PaymentRequest,
    approvalStep: ApprovalStep,
    approver: User,
    organization: Organization
  ): EmailTemplate {
    const approvalUrl = `${this.baseUrl}/org/approvals/review/${paymentRequest.id}`;
    const variables = {
      approverName: approver.name,
      requestTitle: paymentRequest.title,
      amount: `${paymentRequest.currency} ${paymentRequest.amount.toLocaleString()}`,
      requester: paymentRequest.requestedBy,
      organization: organization.name,
      stepName: approvalStep.stepName,
      stepNumber: approvalStep.stepNumber.toString(),
      urgency: paymentRequest.urgency,
      category: paymentRequest.category,
      description: paymentRequest.description,
      approvalUrl: approvalUrl
    };

    const subject = this.replaceVariables(
      `[${organization.name}] Approval Required: {{requestTitle}}`,
      variables
    );

    const body = this.replaceVariables(
      approvalStep.emailTemplate || this.getDefaultApprovalTemplate(),
      variables
    );

    return { subject, body, variables };
  }

  /**
   * Build approval update email
   */
  private buildApprovalUpdateEmail(
    paymentRequest: PaymentRequest,
    approvalStep: ApprovalStep,
    requester: User,
    organization: Organization,
    isApproved: boolean
  ): EmailTemplate {
    const statusUrl = `${this.baseUrl}/org/payments/${paymentRequest.id}`;
    const variables = {
      requesterName: requester.name,
      requestTitle: paymentRequest.title,
      amount: `${paymentRequest.currency} ${paymentRequest.amount.toLocaleString()}`,
      organization: organization.name,
      stepName: approvalStep.stepName,
      status: isApproved ? 'APPROVED' : 'REJECTED',
      statusUrl: statusUrl
    };

    const subject = this.replaceVariables(
      `[${organization.name}] Payment Request {{status}}: {{requestTitle}}`,
      variables
    );

    const body = this.replaceVariables(
      this.getApprovalUpdateTemplate(isApproved),
      variables
    );

    return { subject, body, variables };
  }

  /**
   * Build payment status email
   */
  private buildPaymentStatusEmail(
    paymentRequest: PaymentRequest,
    organization: Organization,
    paymentStatus: 'PROCESSED' | 'FAILED' | 'CANCELLED'
  ): EmailTemplate {
    const statusUrl = `${this.baseUrl}/org/payments/${paymentRequest.id}`;
    const variables = {
      requestTitle: paymentRequest.title,
      amount: `${paymentRequest.currency} ${paymentRequest.amount.toLocaleString()}`,
      organization: organization.name,
      status: paymentStatus,
      statusUrl: statusUrl,
      processedDate: new Date().toLocaleDateString()
    };

    const subject = this.replaceVariables(
      `[${organization.name}] Payment {{status}}: {{requestTitle}}`,
      variables
    );

    const body = this.replaceVariables(
      this.getPaymentStatusTemplate(paymentStatus),
      variables
    );

    return { subject, body, variables };
  }

  /**
   * Build reminder email
   */
  private buildReminderEmail(
    paymentRequest: PaymentRequest,
    approvalStep: ApprovalStep,
    approver: User,
    organization: Organization,
    hoursRemaining: number
  ): EmailTemplate {
    const approvalUrl = `${this.baseUrl}/org/approvals/review/${paymentRequest.id}`;
    const variables = {
      approverName: approver.name,
      requestTitle: paymentRequest.title,
      amount: `${paymentRequest.currency} ${paymentRequest.amount.toLocaleString()}`,
      organization: organization.name,
      stepName: approvalStep.stepName,
      hoursRemaining: hoursRemaining.toString(),
      approvalUrl: approvalUrl
    };

    const subject = this.replaceVariables(
      `[${organization.name}] REMINDER: Approval Required - {{requestTitle}}`,
      variables
    );

    const body = this.replaceVariables(
      this.getReminderTemplate(),
      variables
    );

    return { subject, body, variables };
  }

  /**
   * Replace template variables
   */
  private replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  }

  /**
   * Simulate email sending (replace with actual email service)
   */
  private async simulateEmailSend(emailData: EmailTemplate, to: string): Promise<void> {
    // In production, replace this with actual email service like:
    // - SendGrid
    // - AWS SES
    // - Nodemailer
    // - Resend
    
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`✅ Email sent to ${to}`);
        console.log(`📧 Subject: ${emailData.subject}`);
        console.log(`📝 Body preview: ${emailData.body.substring(0, 100)}...`);
        resolve();
      }, 100);
    });
  }

  /**
   * Default approval email template
   */
  private getDefaultApprovalTemplate(): string {
    return `
Dear {{approverName}},

You have a new payment request requiring your approval:

📋 Request Details:
• Title: {{requestTitle}}
• Amount: {{amount}}
• Requested by: {{requester}}
• Category: {{category}}
• Urgency: {{urgency}}
• Description: {{description}}

🔄 Approval Step: {{stepName}} (Step {{stepNumber}})

Please review and approve this request by clicking the link below:
{{approvalUrl}}

Best regards,
{{organization}} Payment System
    `.trim();
  }

  /**
   * Approval update email template
   */
  private getApprovalUpdateTemplate(isApproved: boolean): string {
    if (isApproved) {
      return `
Dear {{requesterName}},

Good news! Your payment request has been approved at the {{stepName}} level.

📋 Request Details:
• Title: {{requestTitle}}
• Amount: {{amount}}
• Status: {{status}}

Your request is now moving to the next approval step or payment processing.

View full status: {{statusUrl}}

Best regards,
{{organization}} Payment System
      `.trim();
    } else {
      return `
Dear {{requesterName}},

Your payment request has been rejected at the {{stepName}} level.

📋 Request Details:
• Title: {{requestTitle}}
• Amount: {{amount}}
• Status: {{status}}

Please review the feedback and resubmit if necessary.

View full details: {{statusUrl}}

Best regards,
{{organization}} Payment System
      `.trim();
    }
  }

  /**
   * Payment status email template
   */
  private getPaymentStatusTemplate(status: 'PROCESSED' | 'FAILED' | 'CANCELLED'): string {
    const statusMessages = {
      PROCESSED: 'has been successfully processed and payment has been completed.',
      FAILED: 'processing has failed. Please contact support for assistance.',
      CANCELLED: 'has been cancelled as requested.'
    };

    return `
Dear Team,

Payment Request Status Update:

📋 Request Details:
• Title: {{requestTitle}}
• Amount: {{amount}}
• Status: {{status}}
• Processed Date: {{processedDate}}

The payment request {{requestTitle}} ${statusMessages[status]}

View full details: {{statusUrl}}

Best regards,
{{organization}} Payment System
    `.trim();
  }

  /**
   * Reminder email template
   */
  private getReminderTemplate(): string {
    return `
Dear {{approverName}},

⏰ REMINDER: You have a pending payment approval that requires your attention.

📋 Request Details:
• Title: {{requestTitle}}
• Amount: {{amount}}
• Approval Step: {{stepName}}
• Time Remaining: {{hoursRemaining}} hours

Please review and approve this request as soon as possible:
{{approvalUrl}}

This is an automated reminder from {{organization}} Payment System.

Best regards,
{{organization}} Payment System
    `.trim();
  }
}

export const emailService = new EmailService();