/**
 * Visual Workflow Engine - Handles n8n-style node-based workflows
 */

import { emailService } from './email-service';
import { User, Organization } from '@/types';
import { 
  getUser, 
  getOrganization, 
  getUsersByOrg, 
  getPaymentRequest, 
  updatePaymentRequest,
  createWorkflowInstance,
  updateWorkflowInstance,
  getWorkflowInstance
} from './database';

export interface WorkflowNode {
  id: string;
  type: 'start' | 'approval' | 'condition' | 'email' | 'payment' | 'end';
  position: { x: number; y: number };
  data: {
    label: string;
    approverType?: 'ROLE' | 'USER';
    approverValue?: string;
    approverEmail?: string;
    emailTemplate?: string;
    conditions?: any;
    isPaymentTrigger?: boolean;
    autoApprove?: boolean;
    timeoutHours?: number;
    stepOrder?: number;
  };
  inputs: string[];
  outputs: string[];
}

export interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface VisualWorkflowInstance {
  id: string;
  paymentRequestId: string;
  orgId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  currentNodeId: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  nodeStates: Record<string, {
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
    startedAt?: Date;
    completedAt?: Date;
    result?: any;
    error?: string;
    approvedBy?: string;
    comments?: string;
  }>;
  createdAt: Date;
  completedAt?: Date;
  metadata: Record<string, any>;
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
  attachments?: string[];
  metadata?: Record<string, any>;
}

class VisualWorkflowEngine {
  /**
   * Start a new visual workflow
   */
  async startWorkflow(
    paymentRequest: PaymentRequest,
    workflowDefinition: { nodes: WorkflowNode[]; connections: WorkflowConnection[] },
    requester: User,
    organization: Organization
  ): Promise<VisualWorkflowInstance> {
    try {
      const startNode = workflowDefinition.nodes.find(n => n.type === 'start');
      if (!startNode) {
        throw new Error('No start node found in workflow');
      }

      // Create workflow instance
      const workflowInstance: VisualWorkflowInstance = {
        id: `visual-workflow-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        paymentRequestId: paymentRequest.id,
        orgId: paymentRequest.orgId,
        status: 'RUNNING',
        currentNodeId: startNode.id,
        nodes: workflowDefinition.nodes,
        connections: workflowDefinition.connections,
        nodeStates: {},
        createdAt: new Date(),
        metadata: {
          requesterId: requester.id,
          requesterEmail: requester.email,
          totalAmount: paymentRequest.amount,
          currency: paymentRequest.currency,
          organizationName: organization.name
        }
      };

      // Initialize node states
      workflowDefinition.nodes.forEach(node => {
        workflowInstance.nodeStates[node.id] = {
          status: node.id === startNode.id ? 'RUNNING' : 'PENDING'
        };
      });

      // Execute start node
      await this.executeNode(workflowInstance, startNode.id, paymentRequest, organization);

      console.log('🚀 Visual workflow started:', workflowInstance.id);
      return workflowInstance;
    } catch (error) {
      console.error('Failed to start visual workflow:', error);
      throw error;
    }
  }

  /**
   * Process approval decision for a specific node
   */
  async processNodeApproval(
    workflowInstanceId: string,
    nodeId: string,
    isApproved: boolean,
    approver: User,
    comments?: string
  ): Promise<VisualWorkflowInstance> {
    try {
      // In production, fetch from database
      const workflowInstance = await this.getWorkflowInstance(workflowInstanceId);
      if (!workflowInstance) {
        throw new Error('Workflow instance not found');
      }

      const node = workflowInstance.nodes.find(n => n.id === nodeId);
      if (!node || node.type !== 'approval') {
        throw new Error('Invalid approval node');
      }

      // Update node state
      workflowInstance.nodeStates[nodeId] = {
        ...workflowInstance.nodeStates[nodeId],
        status: isApproved ? 'COMPLETED' : 'FAILED',
        completedAt: new Date(),
        result: { approved: isApproved },
        approvedBy: approver.id,
        comments
      };

      console.log(`📝 Node ${nodeId} ${isApproved ? 'approved' : 'rejected'} by ${approver.name}`);

      // Get payment request and organization
      const [paymentRequest, organization] = await Promise.all([
        this.getPaymentRequest(workflowInstance.paymentRequestId),
        getOrganization(workflowInstance.orgId)
      ]);

      if (!paymentRequest || !organization) {
        throw new Error('Payment request or organization not found');
      }

      // Send notification email
      const requester = await getUser(workflowInstance.metadata.requesterId);
      if (requester) {
        await this.sendApprovalNotification(
          paymentRequest,
          node,
          requester,
          organization,
          isApproved,
          approver,
          comments
        );
      }

      if (!isApproved) {
        // Workflow failed - mark as cancelled
        workflowInstance.status = 'FAILED';
        workflowInstance.completedAt = new Date();
        
        // Send failure notification to all stakeholders
        await this.notifyStakeholders(workflowInstance, organization, 'REJECTED');
        
        console.log('❌ Workflow failed at node', nodeId);
        return workflowInstance;
      }

      // Continue to next node
      await this.continueWorkflow(workflowInstance, nodeId, paymentRequest, organization);

      return workflowInstance;
    } catch (error) {
      console.error('Failed to process node approval:', error);
      throw error;
    }
  }

  /**
   * Execute a specific node
   */
  private async executeNode(
    workflowInstance: VisualWorkflowInstance,
    nodeId: string,
    paymentRequest: PaymentRequest,
    organization: Organization
  ): Promise<void> {
    try {
      const node = workflowInstance.nodes.find(n => n.id === nodeId);
      if (!node) {
        throw new Error(`Node ${nodeId} not found`);
      }

      // Update node state to running
      workflowInstance.nodeStates[nodeId] = {
        ...workflowInstance.nodeStates[nodeId],
        status: 'RUNNING',
        startedAt: new Date()
      };

      workflowInstance.currentNodeId = nodeId;

      console.log(`🔄 Executing node: ${node.data.label} (${node.type})`);

      switch (node.type) {
        case 'start':
          await this.executeStartNode(workflowInstance, node, paymentRequest, organization);
          break;
        
        case 'approval':
          await this.executeApprovalNode(workflowInstance, node, paymentRequest, organization);
          break;
        
        case 'condition':
          await this.executeConditionNode(workflowInstance, node, paymentRequest, organization);
          break;
        
        case 'email':
          await this.executeEmailNode(workflowInstance, node, paymentRequest, organization);
          break;
        
        case 'payment':
          await this.executePaymentNode(workflowInstance, node, paymentRequest, organization);
          break;
        
        case 'end':
          await this.executeEndNode(workflowInstance, node, paymentRequest, organization);
          break;
        
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }
    } catch (error) {
      console.error(`Failed to execute node ${nodeId}:`, error);
      
      // Mark node as failed
      workflowInstance.nodeStates[nodeId] = {
        ...workflowInstance.nodeStates[nodeId],
        status: 'FAILED',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      // Mark workflow as failed
      workflowInstance.status = 'FAILED';
      workflowInstance.completedAt = new Date();
      
      throw error;
    }
  }

  /**
   * Execute start node
   */
  private async executeStartNode(
    workflowInstance: VisualWorkflowInstance,
    node: WorkflowNode,
    paymentRequest: PaymentRequest,
    organization: Organization
  ): Promise<void> {
    // Mark start node as completed
    workflowInstance.nodeStates[node.id] = {
      ...workflowInstance.nodeStates[node.id],
      status: 'COMPLETED',
      completedAt: new Date(),
      result: { message: 'Workflow started' }
    };

    // Continue to next node
    await this.continueWorkflow(workflowInstance, node.id, paymentRequest, organization);
  }

  /**
   * Execute approval node
   */
  private async executeApprovalNode(
    workflowInstance: VisualWorkflowInstance,
    node: WorkflowNode,
    paymentRequest: PaymentRequest,
    organization: Organization
  ): Promise<void> {
    try {
      // Resolve approvers
      const approvers = await this.resolveApprovers(
        node.data.approverType!,
        node.data.approverValue!,
        workflowInstance.orgId
      );

      if (approvers.length === 0) {
        throw new Error(`No approvers found for node ${node.id}`);
      }

      // Send approval request emails
      const emailPromises = approvers.map(approver =>
        this.sendApprovalRequest(paymentRequest, node, approver, organization)
      );

      await Promise.all(emailPromises);

      // Schedule reminder emails
      this.scheduleReminders(workflowInstance, node, approvers, paymentRequest, organization);

      // Node stays in RUNNING state until approval is received
      console.log(`📧 Approval requests sent to ${approvers.length} approver(s) for node ${node.id}`);
    } catch (error) {
      console.error('Failed to execute approval node:', error);
      throw error;
    }
  }

  /**
   * Execute condition node
   */
  private async executeConditionNode(
    workflowInstance: VisualWorkflowInstance,
    node: WorkflowNode,
    paymentRequest: PaymentRequest,
    organization: Organization
  ): Promise<void> {
    // Simple condition logic - can be extended
    const conditionMet = this.evaluateCondition(node.data.conditions, paymentRequest);
    
    workflowInstance.nodeStates[node.id] = {
      ...workflowInstance.nodeStates[node.id],
      status: 'COMPLETED',
      completedAt: new Date(),
      result: { conditionMet }
    };

    // Continue to appropriate next node based on condition
    await this.continueWorkflow(workflowInstance, node.id, paymentRequest, organization, conditionMet);
  }

  /**
   * Execute email node
   */
  private async executeEmailNode(
    workflowInstance: VisualWorkflowInstance,
    node: WorkflowNode,
    paymentRequest: PaymentRequest,
    organization: Organization
  ): Promise<void> {
    try {
      // Get all stakeholders for notification
      const stakeholders = await this.getAllStakeholders(workflowInstance, organization);
      
      // Send emails to all stakeholders
      const emailPromises = stakeholders.map(user =>
        this.sendCustomEmail(paymentRequest, node, user, organization)
      );

      await Promise.all(emailPromises);

      workflowInstance.nodeStates[node.id] = {
        ...workflowInstance.nodeStates[node.id],
        status: 'COMPLETED',
        completedAt: new Date(),
        result: { emailsSent: stakeholders.length }
      };

      // Continue to next node
      await this.continueWorkflow(workflowInstance, node.id, paymentRequest, organization);
    } catch (error) {
      console.error('Failed to execute email node:', error);
      throw error;
    }
  }

  /**
   * Execute payment node
   */
  private async executePaymentNode(
    workflowInstance: VisualWorkflowInstance,
    node: WorkflowNode,
    paymentRequest: PaymentRequest,
    organization: Organization
  ): Promise<void> {
    try {
      console.log('💳 Triggering payment processing for:', paymentRequest.id);

      // Simulate payment processing
      const paymentResult = await this.processPayment(paymentRequest);

      workflowInstance.nodeStates[node.id] = {
        ...workflowInstance.nodeStates[node.id],
        status: paymentResult.success ? 'COMPLETED' : 'FAILED',
        completedAt: new Date(),
        result: paymentResult
      };

      if (paymentResult.success) {
        // Update payment request status
        await updatePaymentRequest(paymentRequest.id, { status: 'PAID' });
        
        // Continue to next node
        await this.continueWorkflow(workflowInstance, node.id, paymentRequest, organization);
      } else {
        // Payment failed - stop workflow
        workflowInstance.status = 'FAILED';
        workflowInstance.completedAt = new Date();
        
        // Send failure notification
        const stakeholders = await this.getAllStakeholders(workflowInstance, organization);
        await emailService.sendPaymentStatusEmail(
          paymentRequest,
          organization,
          stakeholders,
          'FAILED'
        );
      }

      console.log(`💰 Payment ${paymentResult.success ? 'processed' : 'failed'} for request ${paymentRequest.id}`);
    } catch (error) {
      console.error('Failed to execute payment node:', error);
      throw error;
    }
  }

  /**
   * Execute end node
   */
  private async executeEndNode(
    workflowInstance: VisualWorkflowInstance,
    node: WorkflowNode,
    paymentRequest: PaymentRequest,
    organization: Organization
  ): Promise<void> {
    // Mark end node as completed
    workflowInstance.nodeStates[node.id] = {
      ...workflowInstance.nodeStates[node.id],
      status: 'COMPLETED',
      completedAt: new Date(),
      result: { message: 'Workflow completed successfully' }
    };

    // Mark workflow as completed
    workflowInstance.status = 'COMPLETED';
    workflowInstance.completedAt = new Date();

    // Send final completion notification
    const stakeholders = await this.getAllStakeholders(workflowInstance, organization);
    await emailService.sendPaymentStatusEmail(
      paymentRequest,
      organization,
      stakeholders,
      'PROCESSED'
    );

    console.log('✅ Visual workflow completed successfully');
  }

  /**
   * Continue workflow to next node(s)
   */
  private async continueWorkflow(
    workflowInstance: VisualWorkflowInstance,
    currentNodeId: string,
    paymentRequest: PaymentRequest,
    organization: Organization,
    conditionResult?: boolean
  ): Promise<void> {
    // Find outgoing connections from current node
    const outgoingConnections = workflowInstance.connections.filter(c => c.source === currentNodeId);
    
    if (outgoingConnections.length === 0) {
      console.log('No outgoing connections found - workflow may be complete');
      return;
    }

    // Execute next nodes
    for (const connection of outgoingConnections) {
      const nextNode = workflowInstance.nodes.find(n => n.id === connection.target);
      if (nextNode) {
        // For condition nodes, only continue if condition is met (simplified logic)
        const currentNode = workflowInstance.nodes.find(n => n.id === currentNodeId);
        if (currentNode?.type === 'condition' && conditionResult === false) {
          // Skip this path if condition not met
          continue;
        }

        await this.executeNode(workflowInstance, nextNode.id, paymentRequest, organization);
      }
    }
  }

  /**
   * Helper methods (similar to original workflow engine)
   */
  private async resolveApprovers(
    approverType: 'ROLE' | 'USER',
    approverValue: string,
    orgId: string
  ): Promise<User[]> {
    try {
      if (approverType === 'USER') {
        const user = await getUser(approverValue);
        return user ? [user] : [];
      } else {
        const orgUsers = await getUsersByOrg(orgId);
        return orgUsers.filter(user => user.role === approverValue && user.active);
      }
    } catch (error) {
      console.error('Failed to resolve approvers:', error);
      return [];
    }
  }

  private async processPayment(paymentRequest: PaymentRequest): Promise<{ success: boolean; transactionId?: string }> {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate 95% success rate
    const success = Math.random() > 0.05;
    
    return {
      success,
      transactionId: success ? `txn_${Date.now()}_${Math.random().toString(36).substring(2)}` : undefined
    };
  }

  private evaluateCondition(conditions: any, paymentRequest: PaymentRequest): boolean {
    // Simple condition evaluation - can be extended
    if (!conditions) return true;
    
    if (conditions.amountThreshold) {
      return paymentRequest.amount >= conditions.amountThreshold;
    }
    
    if (conditions.category) {
      return paymentRequest.category === conditions.category;
    }
    
    return true;
  }

  private async sendApprovalRequest(
    paymentRequest: PaymentRequest,
    node: WorkflowNode,
    approver: User,
    organization: Organization
  ): Promise<void> {
    // Convert to approval step format for email service
    const approvalStep = {
      stepNumber: node.data.stepOrder || 1,
      stepName: node.data.label,
      approverType: node.data.approverType!,
      approverValue: node.data.approverValue!,
      status: 'PENDING' as const,
      emailTemplate: node.data.emailTemplate || 'Default approval request template'
    };

    await emailService.sendApprovalRequest(paymentRequest, approvalStep, approver, organization);
  }

  private async sendApprovalNotification(
    paymentRequest: PaymentRequest,
    node: WorkflowNode,
    requester: User,
    organization: Organization,
    isApproved: boolean,
    approver: User,
    comments?: string
  ): Promise<void> {
    const approvalStep = {
      stepNumber: node.data.stepOrder || 1,
      stepName: node.data.label,
      approverType: node.data.approverType!,
      approverValue: node.data.approverValue!,
      status: isApproved ? 'APPROVED' as const : 'REJECTED' as const,
      emailTemplate: node.data.emailTemplate || 'Default approval update template',
      approvedBy: approver.id,
      comments
    };

    await emailService.sendApprovalUpdate(paymentRequest, approvalStep, requester, organization, isApproved);
  }

  private async sendCustomEmail(
    paymentRequest: PaymentRequest,
    node: WorkflowNode,
    user: User,
    organization: Organization
  ): Promise<void> {
    // Send custom email based on node template
    console.log(`📧 Sending custom email to ${user.email} from node ${node.data.label}`);
    // Implementation would use email service with custom template
  }

  private async getAllStakeholders(
    workflowInstance: VisualWorkflowInstance,
    organization: Organization
  ): Promise<User[]> {
    try {
      const orgUsers = await getUsersByOrg(workflowInstance.orgId);
      
      // Include requester, all approvers, and org admins
      const stakeholderIds = new Set([
        workflowInstance.metadata.requesterId,
        ...Object.values(workflowInstance.nodeStates)
          .filter(state => state.approvedBy)
          .map(state => state.approvedBy!),
        ...orgUsers.filter(u => u.role === 'ORG_ADMIN').map(u => u.id)
      ]);

      return orgUsers.filter(user => stakeholderIds.has(user.id));
    } catch (error) {
      console.error('Failed to get stakeholders:', error);
      return [];
    }
  }

  private scheduleReminders(
    workflowInstance: VisualWorkflowInstance,
    node: WorkflowNode,
    approvers: User[],
    paymentRequest: PaymentRequest,
    organization: Organization
  ): void {
    const timeoutHours = node.data.timeoutHours || 24;
    
    setTimeout(async () => {
      // Check if node is still pending
      const currentState = workflowInstance.nodeStates[node.id];
      if (currentState && currentState.status === 'RUNNING') {
        // Send reminders
        const approvalStep = {
          stepNumber: node.data.stepOrder || 1,
          stepName: node.data.label,
          approverType: node.data.approverType!,
          approverValue: node.data.approverValue!,
          status: 'PENDING' as const,
          emailTemplate: node.data.emailTemplate || 'Default reminder template'
        };

        const reminderPromises = approvers.map(approver =>
          emailService.sendApprovalReminder(
            paymentRequest,
            approvalStep,
            approver,
            organization,
            timeoutHours
          )
        );
        
        await Promise.all(reminderPromises);
        console.log(`⏰ Reminder emails sent for node ${node.id}`);
      }
    }, timeoutHours * 60 * 60 * 1000);
  }

  private async notifyStakeholders(
    workflowInstance: VisualWorkflowInstance,
    organization: Organization,
    status: 'REJECTED' | 'CANCELLED'
  ): Promise<void> {
    try {
      const stakeholders = await this.getAllStakeholders(workflowInstance, organization);
      const paymentRequest = await this.getPaymentRequest(workflowInstance.paymentRequestId);
      
      if (paymentRequest) {
        await emailService.sendPaymentStatusEmail(
          paymentRequest,
          organization,
          stakeholders,
          'CANCELLED'
        );
      }
    } catch (error) {
      console.error('Failed to notify stakeholders:', error);
    }
  }

  private async getWorkflowInstance(workflowInstanceId: string): Promise<VisualWorkflowInstance | null> {
    // In production, this would fetch from database
    console.log('Getting visual workflow instance:', workflowInstanceId);
    return null;
  }

  private async getPaymentRequest(paymentRequestId: string): Promise<PaymentRequest | null> {
    try {
      const request = await getPaymentRequest(paymentRequestId);
      return request;
    } catch (error) {
      console.error('Failed to get payment request:', error);
      return null;
    }
  }
}

export const visualWorkflowEngine = new VisualWorkflowEngine();