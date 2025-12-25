/**
 * Collection Email Service - Handles payment collection requests
 */

import { User, Organization } from '@/types';

export interface CollectionRequest {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  collectionEmail: string;
  collectionMessage?: string;
  invoiceNumber?: string;
  dueDate?: Date;
  requestedBy: string;
  requestedAt: Date;
  orgId: string;
  status: 'SENT' | 'VIEWED' | 'PAID' | 'EXPIRED';
}

export interface OrganizationPaymentDetails {
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
    accountType: 'SAVINGS' | 'CURRENT';
  };
  upiDetails?: {
    upiId: string;
    qrCodeImage?: string;
  };
  preferredPaymentMethod: 'BANK' | 'UPI' | 'BOTH';
}

class CollectionEmailService {
  private baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  /**
   * Send payment collection request email
   */
  async sendCollectionRequest(
    collectionRequest: CollectionRequest,
    organization: Organization,
    requester: User,
    paymentDetails: OrganizationPaymentDetails
  ): Promise<boolean> {
    try {
      const emailData = this.buildCollectionEmail(
        collectionRequest,
        organization,
        requester,
        paymentDetails
      );
      
      console.log('📧 Sending payment collection email:', {
        to: collectionRequest.collectionEmail,
        subject: emailData.subject,
        body: emailData.body.substring(0, 200) + '...'
      });

      // Simulate email sending
      await this.simulateEmailSend(emailData, collectionRequest.collectionEmail);
      
      return true;
    } catch (error) {
      console.error('Failed to send collection request email:', error);
      return false;
    }
  }

  /**
   * Send payment reminder email
   */
  async sendPaymentReminder(
    collectionRequest: CollectionRequest,
    organization: Organization,
    paymentDetails: OrganizationPaymentDetails,
    daysOverdue: number
  ): Promise<boolean> {
    try {
      const emailData = this.buildReminderEmail(
        collectionRequest,
        organization,
        paymentDetails,
        daysOverdue
      );
      
      console.log('📧 Sending payment reminder email:', {
        to: collectionRequest.collectionEmail,
        subject: emailData.subject
      });

      await this.simulateEmailSend(emailData, collectionRequest.collectionEmail);
      
      return true;
    } catch (error) {
      console.error('Failed to send payment reminder email:', error);
      return false;
    }
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(
    collectionRequest: CollectionRequest,
    organization: Organization,
    requester: User,
    paymentAmount: number,
    transactionId?: string
  ): Promise<boolean> {
    try {
      const emailData = this.buildConfirmationEmail(
        collectionRequest,
        organization,
        requester,
        paymentAmount,
        transactionId
      );
      
      console.log('📧 Sending payment confirmation email:', {
        to: collectionRequest.collectionEmail,
        cc: requester.email,
        subject: emailData.subject
      });

      // Send to both client and requester
      await Promise.all([
        this.simulateEmailSend(emailData, collectionRequest.collectionEmail),
        this.simulateEmailSend(emailData, requester.email)
      ]);
      
      return true;
    } catch (error) {
      console.error('Failed to send payment confirmation email:', error);
      return false;
    }
  }

  /**
   * Build collection request email
   */
  private buildCollectionEmail(
    collectionRequest: CollectionRequest,
    organization: Organization,
    requester: User,
    paymentDetails: OrganizationPaymentDetails
  ): { subject: string; body: string } {
    const paymentUrl = `${this.baseUrl}/pay/${collectionRequest.id}`;
    
    const subject = `Payment Request from ${organization.name} - ${collectionRequest.currency} ${collectionRequest.amount.toLocaleString()}`;
    
    let paymentInstructions = '';
    
    if (paymentDetails.preferredPaymentMethod === 'BANK' || paymentDetails.preferredPaymentMethod === 'BOTH') {
      paymentInstructions += `
<div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <h3 style="color: #1f2937; margin: 0 0 15px 0;">🏦 Bank Transfer Details</h3>
  <table style="width: 100%; border-collapse: collapse;">
    <tr><td style="padding: 5px 0; font-weight: bold;">Account Name:</td><td>${paymentDetails.bankDetails?.accountHolderName}</td></tr>
    <tr><td style="padding: 5px 0; font-weight: bold;">Account Number:</td><td>${paymentDetails.bankDetails?.accountNumber}</td></tr>
    <tr><td style="padding: 5px 0; font-weight: bold;">IFSC Code:</td><td>${paymentDetails.bankDetails?.ifscCode}</td></tr>
    <tr><td style="padding: 5px 0; font-weight: bold;">Bank Name:</td><td>${paymentDetails.bankDetails?.bankName}</td></tr>
  </table>
</div>`;
    }
    
    if (paymentDetails.preferredPaymentMethod === 'UPI' || paymentDetails.preferredPaymentMethod === 'BOTH') {
      paymentInstructions += `
<div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <h3 style="color: #1f2937; margin: 0 0 15px 0;">📱 UPI Payment Details</h3>
  <p><strong>UPI ID:</strong> ${paymentDetails.upiDetails?.upiId}</p>
  ${paymentDetails.upiDetails?.qrCodeImage ? '<p>You can also scan the QR code attached to this email for quick payment.</p>' : ''}
</div>`;
    }

    const body = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Request</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
    
    <!-- Header -->
    <div style="background-color: #3b82f6; color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">Payment Request</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">From ${organization.name}</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <p style="font-size: 16px; margin-bottom: 20px;">Dear Valued Client,</p>
      
      ${collectionRequest.collectionMessage ? `
      <div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
        <p style="margin: 0; font-style: italic;">${collectionRequest.collectionMessage}</p>
      </div>
      ` : ''}
      
      <!-- Payment Details -->
      <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <h2 style="color: #92400e; margin: 0 0 10px 0;">Payment Amount</h2>
        <div style="font-size: 36px; font-weight: bold; color: #92400e;">
          ${collectionRequest.currency} ${collectionRequest.amount.toLocaleString()}
        </div>
        ${collectionRequest.invoiceNumber ? `<p style="margin: 10px 0 0 0; color: #92400e;">Invoice: ${collectionRequest.invoiceNumber}</p>` : ''}
      </div>
      
      <!-- Request Details -->
      <div style="margin: 20px 0;">
        <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Request Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr><td style="padding: 8px 0; font-weight: bold;">Description:</td><td>${collectionRequest.title}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Request Date:</td><td>${collectionRequest.requestedAt.toLocaleDateString()}</td></tr>
          ${collectionRequest.dueDate ? `<tr><td style="padding: 8px 0; font-weight: bold;">Due Date:</td><td>${collectionRequest.dueDate.toLocaleDateString()}</td></tr>` : ''}
          <tr><td style="padding: 8px 0; font-weight: bold;">Requested by:</td><td>${requester.name} (${requester.email})</td></tr>
        </table>
      </div>
      
      <!-- Payment Instructions -->
      <div style="margin: 30px 0;">
        <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Payment Instructions</h3>
        ${paymentInstructions}
      </div>
      
      <!-- Important Notes -->
      <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
        <h4 style="color: #dc2626; margin: 0 0 10px 0;">Important Notes:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #7f1d1d;">
          <li>Please include the invoice number (if provided) in your payment reference</li>
          <li>Send payment confirmation to ${requester.email} after completing the transaction</li>
          <li>Contact us immediately if you have any questions about this request</li>
        </ul>
      </div>
      
      <!-- Contact Information -->
      <div style="margin: 30px 0; text-align: center; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
        <h4 style="color: #1f2937; margin: 0 0 10px 0;">Need Help?</h4>
        <p style="margin: 0; color: #6b7280;">
          Contact: ${requester.name}<br>
          Email: ${requester.email}<br>
          Organization: ${organization.name}
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
      <p style="margin: 0;">This is an automated payment request from ${organization.name}</p>
      <p style="margin: 5px 0 0 0;">Please do not reply to this email directly</p>
    </div>
  </div>
</body>
</html>`;

    return { subject, body };
  }

  /**
   * Build payment reminder email
   */
  private buildReminderEmail(
    collectionRequest: CollectionRequest,
    organization: Organization,
    paymentDetails: OrganizationPaymentDetails,
    daysOverdue: number
  ): { subject: string; body: string } {
    const subject = `Payment Reminder - ${organization.name} - ${daysOverdue} days overdue`;
    
    const body = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h2 style="color: #dc2626; margin: 0 0 15px 0;">⚠️ Payment Reminder</h2>
    <p>Dear Client,</p>
    <p>This is a friendly reminder that your payment of <strong>${collectionRequest.currency} ${collectionRequest.amount.toLocaleString()}</strong> is now <strong>${daysOverdue} days overdue</strong>.</p>
    <p><strong>Original Request:</strong> ${collectionRequest.title}</p>
    ${collectionRequest.invoiceNumber ? `<p><strong>Invoice Number:</strong> ${collectionRequest.invoiceNumber}</p>` : ''}
    <p>Please process the payment at your earliest convenience to avoid any service disruption.</p>
    <p>If you have already made the payment, please send us the transaction details.</p>
    <p>Thank you for your prompt attention to this matter.</p>
    <p>Best regards,<br>${organization.name}</p>
  </div>
</body>
</html>`;

    return { subject, body };
  }

  /**
   * Build payment confirmation email
   */
  private buildConfirmationEmail(
    collectionRequest: CollectionRequest,
    organization: Organization,
    requester: User,
    paymentAmount: number,
    transactionId?: string
  ): { subject: string; body: string } {
    const subject = `Payment Received - ${organization.name} - ${collectionRequest.currency} ${paymentAmount.toLocaleString()}`;
    
    const body = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h2 style="color: #16a34a; margin: 0 0 15px 0;">✅ Payment Received</h2>
    <p>Dear Client,</p>
    <p>Thank you! We have successfully received your payment of <strong>${collectionRequest.currency} ${paymentAmount.toLocaleString()}</strong>.</p>
    <p><strong>Payment Details:</strong></p>
    <ul>
      <li>Amount: ${collectionRequest.currency} ${paymentAmount.toLocaleString()}</li>
      <li>Request: ${collectionRequest.title}</li>
      ${collectionRequest.invoiceNumber ? `<li>Invoice: ${collectionRequest.invoiceNumber}</li>` : ''}
      ${transactionId ? `<li>Transaction ID: ${transactionId}</li>` : ''}
      <li>Received: ${new Date().toLocaleDateString()}</li>
    </ul>
    <p>This payment has been processed and your account is now up to date.</p>
    <p>Thank you for your business!</p>
    <p>Best regards,<br>${organization.name}</p>
  </div>
</body>
</html>`;

    return { subject, body };
  }

  /**
   * Simulate email sending
   */
  private async simulateEmailSend(emailData: { subject: string; body: string }, to: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`✅ Collection email sent to ${to}`);
        console.log(`📧 Subject: ${emailData.subject}`);
        resolve();
      }, 100);
    });
  }
}

export const collectionEmailService = new CollectionEmailService();