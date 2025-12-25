/**
 * Dashboard Service - Provides real data for organization dashboard
 */

import { getPaymentRequestsByOrg, getUsersByOrg } from './database';
import { User, Organization } from '@/types';

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
  currentApprovalLevel?: number;
  orgId: string;
  attachments?: string[];
  metadata?: Record<string, any>;
}

export interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  paidRequests: number;
  rejectedRequests: number;
  totalAmount: number;
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
  averageApprovalTime: number;
  activeWorkflows: number;
}

export interface DashboardActivity {
  id: string;
  type: 'PAYMENT_REQUEST' | 'APPROVAL' | 'PAYMENT' | 'REJECTION';
  title: string;
  description: string;
  amount?: number;
  currency?: string;
  status: string;
  timestamp: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
  metadata?: Record<string, any>;
}

export interface PaymentRequestWithDetails extends PaymentRequest {
  requesterName?: string;
  requesterEmail?: string;
  currentApproverName?: string;
  workflowStatus?: string;
  estimatedCompletion?: Date;
}

class DashboardService {
  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(orgId: string): Promise<DashboardStats> {
    try {
      const paymentRequests = await getPaymentRequestsByOrg(orgId);
      
      const stats: DashboardStats = {
        totalRequests: paymentRequests.length,
        pendingRequests: paymentRequests.filter(r => r.status === 'PENDING').length,
        approvedRequests: paymentRequests.filter(r => r.status === 'APPROVED').length,
        paidRequests: paymentRequests.filter(r => r.status === 'PAID').length,
        rejectedRequests: paymentRequests.filter(r => r.status === 'REJECTED').length,
        totalAmount: paymentRequests.reduce((sum, r) => sum + r.amount, 0),
        pendingAmount: paymentRequests.filter(r => r.status === 'PENDING').reduce((sum, r) => sum + r.amount, 0),
        approvedAmount: paymentRequests.filter(r => r.status === 'APPROVED').reduce((sum, r) => sum + r.amount, 0),
        paidAmount: paymentRequests.filter(r => r.status === 'PAID').reduce((sum, r) => sum + r.amount, 0),
        averageApprovalTime: this.calculateAverageApprovalTime(paymentRequests),
        activeWorkflows: paymentRequests.filter(r => r.status === 'PENDING').length
      };

      return stats;
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * Get recent payment requests with enhanced details
   */
  async getRecentPaymentRequests(orgId: string, limit: number = 10): Promise<PaymentRequestWithDetails[]> {
    try {
      const paymentRequests = await getPaymentRequestsByOrg(orgId);
      const users = await getUsersByOrg(orgId);
      
      // Sort by most recent first
      const sortedRequests = paymentRequests
        .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
        .slice(0, limit);

      // Enhance with user details
      const enhancedRequests: PaymentRequestWithDetails[] = sortedRequests.map(request => {
        const requester = users.find(u => u.id === request.requestedBy);
        
        return {
          ...request,
          requesterName: requester?.name || 'Unknown User',
          requesterEmail: requester?.email || '',
          workflowStatus: this.getWorkflowStatus(request),
          estimatedCompletion: this.estimateCompletion(request)
        };
      });

      return enhancedRequests;
    } catch (error) {
      console.error('Failed to get recent payment requests:', error);
      return [];
    }
  }

  /**
   * Get recent dashboard activity
   */
  async getRecentActivity(orgId: string, limit: number = 20): Promise<DashboardActivity[]> {
    try {
      const paymentRequests = await getPaymentRequestsByOrg(orgId);
      const users = await getUsersByOrg(orgId);
      
      const activities: DashboardActivity[] = [];

      // Generate activities from payment requests
      paymentRequests.forEach(request => {
        const requester = users.find(u => u.id === request.requestedBy);
        
        // Payment request creation activity
        activities.push({
          id: `request-${request.id}`,
          type: 'PAYMENT_REQUEST',
          title: 'Payment Request Submitted',
          description: `${request.title} - ${request.currency} ${request.amount.toLocaleString()}`,
          amount: request.amount,
          currency: request.currency,
          status: request.status,
          timestamp: new Date(request.requestedAt),
          user: {
            id: request.requestedBy,
            name: requester?.name || 'Unknown User',
            email: requester?.email || ''
          },
          metadata: {
            category: request.category,
            urgency: request.urgency
          }
        });

        // Add approval/rejection activities based on status
        if (request.status === 'APPROVED') {
          activities.push({
            id: `approval-${request.id}`,
            type: 'APPROVAL',
            title: 'Payment Request Approved',
            description: `${request.title} approved for processing`,
            amount: request.amount,
            currency: request.currency,
            status: 'APPROVED',
            timestamp: new Date(request.requestedAt.getTime() + (24 * 60 * 60 * 1000)), // Mock approval time
            user: {
              id: 'system',
              name: 'System',
              email: 'system@organization.com'
            }
          });
        }

        if (request.status === 'PAID') {
          activities.push({
            id: `payment-${request.id}`,
            type: 'PAYMENT',
            title: 'Payment Processed',
            description: `${request.title} payment completed`,
            amount: request.amount,
            currency: request.currency,
            status: 'PAID',
            timestamp: new Date(request.requestedAt.getTime() + (48 * 60 * 60 * 1000)), // Mock payment time
            user: {
              id: 'system',
              name: 'Finance System',
              email: 'finance@organization.com'
            }
          });
        }

        if (request.status === 'REJECTED') {
          activities.push({
            id: `rejection-${request.id}`,
            type: 'REJECTION',
            title: 'Payment Request Rejected',
            description: `${request.title} was rejected`,
            amount: request.amount,
            currency: request.currency,
            status: 'REJECTED',
            timestamp: new Date(request.requestedAt.getTime() + (12 * 60 * 60 * 1000)), // Mock rejection time
            user: {
              id: 'system',
              name: 'System',
              email: 'system@organization.com'
            }
          });
        }
      });

      // Sort by most recent first and limit
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
        
    } catch (error) {
      console.error('Failed to get recent activity:', error);
      return [];
    }
  }

  /**
   * Get payment requests requiring user's approval
   */
  async getPendingApprovals(orgId: string, userId: string, userRole: string): Promise<PaymentRequestWithDetails[]> {
    try {
      const paymentRequests = await getPaymentRequestsByOrg(orgId);
      const users = await getUsersByOrg(orgId);
      
      // Filter requests that need this user's approval
      const pendingForUser = paymentRequests.filter(request => {
        if (request.status !== 'PENDING') return false;
        
        // Simple approval logic - in production, this would check the actual workflow
        const currentLevel = request.currentApprovalLevel || 1;
        
        // Level 1: ORG_ADMIN or ORG_MEMBER can approve
        if (currentLevel === 1 && ['ORG_ADMIN', 'ORG_MEMBER'].includes(userRole)) {
          return true;
        }
        
        // Level 2: ORG_FINANCE or ORG_ADMIN can approve
        if (currentLevel === 2 && ['ORG_FINANCE', 'ORG_ADMIN'].includes(userRole)) {
          return true;
        }
        
        // Level 3: Only ORG_ADMIN can approve
        if (currentLevel === 3 && userRole === 'ORG_ADMIN') {
          return true;
        }
        
        return false;
      });

      // Enhance with user details
      const enhancedRequests: PaymentRequestWithDetails[] = pendingForUser.map(request => {
        const requester = users.find(u => u.id === request.requestedBy);
        
        return {
          ...request,
          requesterName: requester?.name || 'Unknown User',
          requesterEmail: requester?.email || '',
          workflowStatus: this.getWorkflowStatus(request),
          estimatedCompletion: this.estimateCompletion(request)
        };
      });

      return enhancedRequests.sort((a, b) => 
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      );
      
    } catch (error) {
      console.error('Failed to get pending approvals:', error);
      return [];
    }
  }

  /**
   * Get organization performance metrics
   */
  async getPerformanceMetrics(orgId: string): Promise<{
    monthlyVolume: number;
    averageRequestSize: number;
    approvalRate: number;
    averageProcessingTime: number;
    topCategories: Array<{ category: string; count: number; amount: number }>;
    monthlyTrend: Array<{ month: string; requests: number; amount: number }>;
  }> {
    try {
      const paymentRequests = await getPaymentRequestsByOrg(orgId);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      // Current month requests
      const monthlyRequests = paymentRequests.filter(r => {
        const requestDate = new Date(r.requestedAt);
        return requestDate.getMonth() === currentMonth && requestDate.getFullYear() === currentYear;
      });

      const monthlyVolume = monthlyRequests.reduce((sum, r) => sum + r.amount, 0);
      const averageRequestSize = paymentRequests.length > 0 ? 
        paymentRequests.reduce((sum, r) => sum + r.amount, 0) / paymentRequests.length : 0;
      
      const approvedCount = paymentRequests.filter(r => ['APPROVED', 'PAID'].includes(r.status)).length;
      const approvalRate = paymentRequests.length > 0 ? (approvedCount / paymentRequests.length) * 100 : 0;
      
      const averageProcessingTime = this.calculateAverageApprovalTime(paymentRequests);

      // Top categories
      const categoryStats = new Map<string, { count: number; amount: number }>();
      paymentRequests.forEach(request => {
        const existing = categoryStats.get(request.category) || { count: 0, amount: 0 };
        categoryStats.set(request.category, {
          count: existing.count + 1,
          amount: existing.amount + request.amount
        });
      });

      const topCategories = Array.from(categoryStats.entries())
        .map(([category, stats]) => ({ category, ...stats }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Monthly trend (last 6 months)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthRequests = paymentRequests.filter(r => {
          const requestDate = new Date(r.requestedAt);
          return requestDate.getMonth() === date.getMonth() && 
                 requestDate.getFullYear() === date.getFullYear();
        });
        
        monthlyTrend.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          requests: monthRequests.length,
          amount: monthRequests.reduce((sum, r) => sum + r.amount, 0)
        });
      }

      return {
        monthlyVolume,
        averageRequestSize,
        approvalRate,
        averageProcessingTime,
        topCategories,
        monthlyTrend
      };
      
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return {
        monthlyVolume: 0,
        averageRequestSize: 0,
        approvalRate: 0,
        averageProcessingTime: 0,
        topCategories: [],
        monthlyTrend: []
      };
    }
  }

  /**
   * Private helper methods
   */
  private getEmptyStats(): DashboardStats {
    return {
      totalRequests: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      paidRequests: 0,
      rejectedRequests: 0,
      totalAmount: 0,
      pendingAmount: 0,
      approvedAmount: 0,
      paidAmount: 0,
      averageApprovalTime: 0,
      activeWorkflows: 0
    };
  }

  private calculateAverageApprovalTime(requests: PaymentRequest[]): number {
    const approvedRequests = requests.filter(r => ['APPROVED', 'PAID'].includes(r.status));
    if (approvedRequests.length === 0) return 0;
    
    // Mock calculation - in production, you'd track actual approval timestamps
    const totalHours = approvedRequests.reduce((sum, request) => {
      // Simulate approval time based on urgency
      const baseHours = request.urgency === 'HIGH' ? 4 : 
                       request.urgency === 'MEDIUM' ? 24 : 48;
      return sum + baseHours;
    }, 0);
    
    return Math.round(totalHours / approvedRequests.length);
  }

  private getWorkflowStatus(request: PaymentRequest): string {
    switch (request.status) {
      case 'PENDING':
        const level = request.currentApprovalLevel || 1;
        return `Pending Level ${level} Approval`;
      case 'APPROVED':
        return 'Approved - Processing Payment';
      case 'PAID':
        return 'Payment Completed';
      case 'REJECTED':
        return 'Request Rejected';
      default:
        return 'Unknown Status';
    }
  }

  private estimateCompletion(request: PaymentRequest): Date {
    const baseDate = new Date(request.requestedAt);
    
    if (request.status === 'PAID') {
      return baseDate; // Already completed
    }
    
    // Estimate based on urgency and current level
    const currentLevel = request.currentApprovalLevel || 1;
    const remainingLevels = Math.max(0, 3 - currentLevel);
    
    let estimatedHours = 0;
    if (request.urgency === 'HIGH') {
      estimatedHours = remainingLevels * 4 + 24; // 4 hours per level + 24 for payment
    } else if (request.urgency === 'MEDIUM') {
      estimatedHours = remainingLevels * 24 + 48; // 24 hours per level + 48 for payment
    } else {
      estimatedHours = remainingLevels * 48 + 72; // 48 hours per level + 72 for payment
    }
    
    return new Date(baseDate.getTime() + (estimatedHours * 60 * 60 * 1000));
  }
}

export const dashboardService = new DashboardService();