'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PlusIcon,
  TrashIcon,
  PlayIcon,
  StopIcon,
  UserIcon,
  UsersIcon,
  EnvelopeIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  ArrowRightIcon,
  XMarkIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  ArrowsPointingOutIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon
} from '@heroicons/react/24/outline';
import { ApprovalLevel, User } from '@/types';

interface WorkflowNode {
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

interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

interface Props {
  orgId: string;
  existingLevels: ApprovalLevel[];
  onSave: (workflow: { nodes: WorkflowNode[]; connections: WorkflowConnection[] }) => void;
  users: User[];
}

export default function VisualWorkflowBuilder({ orgId, existingLevels, onSave, users }: Props) {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<WorkflowConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<WorkflowNode | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{ nodeId: string; handle: string } | null>(null);
  const [showNodePalette, setShowNodePalette] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with start and end nodes if empty
    if (nodes.length === 0) {
      const startNode: WorkflowNode = {
        id: 'start-node',
        type: 'start',
        position: { x: 50, y: 250 },
        data: { label: 'Payment Request Submitted' },
        inputs: [],
        outputs: ['output']
      };

      const endNode: WorkflowNode = {
        id: 'end-node',
        type: 'end',
        position: { x: 1000, y: 250 },
        data: { label: 'Payment Completed' },
        inputs: ['input'],
        outputs: []
      };

      // Create approval nodes from existing levels with better positioning
      const approvalNodes: WorkflowNode[] = existingLevels.map((level, index) => ({
        id: `approval-${level.id}`,
        type: 'approval',
        position: { 
          x: 200 + (index * 250), 
          y: 250 + (index % 2 === 0 ? 0 : -100) // Alternate positions for better layout
        },
        data: {
          label: level.levelName,
          approverType: level.approverType,
          approverValue: level.approverValue,
          conditions: level.conditions || null,
          emailTemplate: 'Please review and approve the payment request: {{requestTitle}}',
          timeoutHours: 24,
          stepOrder: level.levelOrder
        },
        inputs: ['input'],
        outputs: ['output']
      }));

      // Create connections between nodes with proper flow
      const initialConnections: WorkflowConnection[] = [];
      
      if (approvalNodes.length > 0) {
        // Connect start to first approval
        initialConnections.push({
          id: 'start-to-first',
          source: 'start-node',
          target: approvalNodes[0].id
        });

        // Connect approvals to each other in sequence
        for (let i = 0; i < approvalNodes.length - 1; i++) {
          initialConnections.push({
            id: `approval-${i}-to-${i + 1}`,
            source: approvalNodes[i].id,
            target: approvalNodes[i + 1].id
          });
        }

        // Connect last approval to end
        initialConnections.push({
          id: 'last-to-end',
          source: approvalNodes[approvalNodes.length - 1].id,
          target: 'end-node'
        });
      } else {
        // If no existing levels, connect start directly to end
        initialConnections.push({
          id: 'start-to-end',
          source: 'start-node',
          target: 'end-node'
        });
      }

      setNodes([startNode, ...approvalNodes, endNode]);
      setConnections(initialConnections);
    }
  }, [existingLevels]);

  const nodeTypes = [
    {
      type: 'approval',
      label: 'Approval Step',
      icon: CheckCircleIcon,
      color: 'bg-blue-500',
      description: 'Requires approval from user or role'
    },
    {
      type: 'condition',
      label: 'Condition',
      icon: CogIcon,
      color: 'bg-purple-500',
      description: 'Branch based on conditions'
    },
    {
      type: 'email',
      label: 'Email Notification',
      icon: EnvelopeIcon,
      color: 'bg-green-500',
      description: 'Send email notification'
    },
    {
      type: 'payment',
      label: 'Payment Trigger',
      icon: BanknotesIcon,
      color: 'bg-orange-500',
      description: 'Trigger payment processing'
    }
  ];

  const addNode = (type: string, position?: { x: number; y: number }) => {
    const defaultPosition = position || { 
      x: 300 + (nodes.length * 50), 
      y: 200 + (Math.random() * 100 - 50) 
    };

    const newNode: WorkflowNode = {
      id: `${type}-${Date.now()}`,
      type: type as any,
      position: defaultPosition,
      data: {
        label: getDefaultLabel(type),
        approverType: type === 'approval' ? 'ROLE' : undefined,
        approverValue: type === 'approval' ? 'ORG_ADMIN' : undefined,
        emailTemplate: type === 'email' ? 'Default email template' : undefined,
        timeoutHours: type === 'approval' ? 24 : undefined,
        stepOrder: nodes.filter(n => n.type === 'approval').length + 1,
        conditions: type === 'approval' ? null : undefined
      },
      inputs: type === 'start' ? [] : ['input'],
      outputs: type === 'end' ? [] : ['output']
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNode(newNode.id);
    setShowNodePalette(false);
  };

  const getDefaultLabel = (type: string) => {
    switch (type) {
      case 'approval': return 'Approval Step';
      case 'condition': return 'Check Condition';
      case 'email': return 'Send Email';
      case 'payment': return 'Process Payment';
      default: return 'New Node';
    }
  };

  const deleteNode = (nodeId: string) => {
    if (nodeId === 'start-node' || nodeId === 'end-node') return;
    
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.source !== nodeId && c.target !== nodeId));
    setSelectedNode(null);
  };

  const updateNode = (nodeId: string, updates: Partial<WorkflowNode['data']>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...updates } }
        : node
    ));
  };

  const startConnection = (nodeId: string, handle: string) => {
    setIsConnecting(true);
    setConnectionStart({ nodeId, handle });
  };

  const completeConnection = (targetNodeId: string, targetHandle: string) => {
    if (!connectionStart || connectionStart.nodeId === targetNodeId) {
      setIsConnecting(false);
      setConnectionStart(null);
      return;
    }

    const newConnection: WorkflowConnection = {
      id: `${connectionStart.nodeId}-${targetNodeId}`,
      source: connectionStart.nodeId,
      target: targetNodeId,
      sourceHandle: connectionStart.handle,
      targetHandle: targetHandle
    };

    setConnections(prev => [...prev.filter(c => c.id !== newConnection.id), newConnection]);
    setIsConnecting(false);
    setConnectionStart(null);
  };

  const deleteConnection = (connectionId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connectionId));
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedNode(null);
      setShowNodePalette(false);
    }
  };

  const handleNodeDrag = (nodeId: string, newPosition: { x: number; y: number }) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, position: newPosition }
        : node
    ));
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.25, Math.min(2, prev + delta)));
  };

  const resetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const fitToScreen = () => {
    if (nodes.length === 0) return;

    const bounds = nodes.reduce((acc, node) => ({
      minX: Math.min(acc.minX, node.position.x),
      maxX: Math.max(acc.maxX, node.position.x + 240),
      minY: Math.min(acc.minY, node.position.y),
      maxY: Math.max(acc.maxY, node.position.y + 80)
    }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const padding = 50;
    const contentWidth = bounds.maxX - bounds.minX + padding * 2;
    const contentHeight = bounds.maxY - bounds.minY + padding * 2;
    
    const scaleX = canvasRect.width / contentWidth;
    const scaleY = canvasRect.height / contentHeight;
    const newZoom = Math.min(scaleX, scaleY, 1);

    setZoom(newZoom);
    setPanOffset({
      x: (canvasRect.width - contentWidth * newZoom) / 2 - bounds.minX * newZoom + padding * newZoom,
      y: (canvasRect.height - contentHeight * newZoom) / 2 - bounds.minY * newZoom + padding * newZoom
    });
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'start': return PlayIcon;
      case 'approval': return CheckCircleIcon;
      case 'condition': return CogIcon;
      case 'email': return EnvelopeIcon;
      case 'payment': return BanknotesIcon;
      case 'end': return StopIcon;
      default: return CogIcon;
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'start': return 'bg-green-500';
      case 'approval': return 'bg-blue-500';
      case 'condition': return 'bg-purple-500';
      case 'email': return 'bg-yellow-500';
      case 'payment': return 'bg-orange-500';
      case 'end': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const saveWorkflow = () => {
    // Validate workflow
    const approvalNodes = nodes.filter(n => n.type === 'approval');
    if (approvalNodes.length === 0) {
      alert('Please add at least one approval step');
      return;
    }

    // Convert to approval levels format
    const workflowData = {
      nodes: nodes.map((node, index) => ({
        ...node,
        data: {
          ...node.data,
          stepOrder: node.type === 'approval' ? index : undefined
        }
      })),
      connections
    };

    onSave(workflowData);
  };

  const selectedNodeData = selectedNode ? nodes.find(n => n.id === selectedNode) : null;

  return (
    <div className="h-full flex bg-gray-100">
      {/* Canvas */}
      <div className="flex-1 relative bg-white overflow-hidden border-r border-gray-200">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
          <button
            onClick={() => setShowNodePalette(!showNodePalette)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Add Node"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-gray-300" />
          
          <button
            onClick={() => handleZoom(0.1)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Zoom In"
          >
            <MagnifyingGlassPlusIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => handleZoom(-0.1)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <MagnifyingGlassMinusIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={fitToScreen}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Fit to Screen"
          >
            <ArrowsPointingOutIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={resetView}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Reset View"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-gray-300" />
          
          <span className="text-sm text-gray-500 px-2">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Canvas Container */}
        <div
          ref={canvasRef}
          className="w-full h-full relative cursor-grab active:cursor-grabbing"
          onClick={handleCanvasClick}
          style={{ minHeight: '600px' }}
          onMouseDown={(e) => {
            if (e.target === canvasRef.current) {
              setIsPanning(true);
              const startX = e.clientX - panOffset.x;
              const startY = e.clientY - panOffset.y;

              const handleMouseMove = (e: MouseEvent) => {
                setPanOffset({
                  x: e.clientX - startX,
                  y: e.clientY - startY
                });
              };

              const handleMouseUp = () => {
                setIsPanning(false);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }
          }}
        >
          {/* Transformed Content */}
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: '100%',
              height: '100%'
            }}
          >
            {/* Grid Background */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                `,
                backgroundSize: `${20 / zoom}px ${20 / zoom}px`,
                width: '200%',
                height: '200%',
                left: '-50%',
                top: '-50%'
              }}
            />

            {/* Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: '200%', height: '200%', left: '-50%', top: '-50%' }}>
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                        refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
                </marker>
                <marker id="arrowhead-blue" markerWidth="10" markerHeight="7" 
                        refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                </marker>
              </defs>
              
              {connections.map(connection => {
                const sourceNode = nodes.find(n => n.id === connection.source);
                const targetNode = nodes.find(n => n.id === connection.target);
                
                if (!sourceNode || !targetNode) return null;

                const sourceX = sourceNode.position.x + 240; // Node width
                const sourceY = sourceNode.position.y + 50; // Half node height
                const targetX = targetNode.position.x;
                const targetY = targetNode.position.y + 50;

                // Calculate control points for smooth curves
                const controlPoint1X = sourceX + Math.abs(targetX - sourceX) * 0.5;
                const controlPoint1Y = sourceY;
                const controlPoint2X = targetX - Math.abs(targetX - sourceX) * 0.5;
                const controlPoint2Y = targetY;

                const isHovered = false; // You can add hover state tracking

                return (
                  <g key={connection.id}>
                    {/* Main connection path */}
                    <path
                      d={`M ${sourceX} ${sourceY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${targetX - 10} ${targetY}`}
                      stroke={isHovered ? "#3b82f6" : "#6b7280"}
                      strokeWidth="3"
                      fill="none"
                      className="hover:stroke-blue-500 cursor-pointer transition-colors duration-200"
                      onClick={() => deleteConnection(connection.id)}
                      style={{ pointerEvents: 'stroke' }}
                      markerEnd={isHovered ? "url(#arrowhead-blue)" : "url(#arrowhead)"}
                    />
                    
                    {/* Connection hover area (invisible but clickable) */}
                    <path
                      d={`M ${sourceX} ${sourceY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${targetX - 10} ${targetY}`}
                      stroke="transparent"
                      strokeWidth="12"
                      fill="none"
                      className="cursor-pointer"
                      onClick={() => deleteConnection(connection.id)}
                      style={{ pointerEvents: 'stroke' }}
                    />
                    
                    {/* Connection label */}
                    <text
                      x={(sourceX + targetX) / 2}
                      y={Math.min(sourceY, targetY) - 15}
                      textAnchor="middle"
                      className="text-xs fill-gray-500 pointer-events-none select-none"
                      fontSize="11"
                      fontWeight="500"
                    >
                      {connection.id.includes('approval') ? 'On Approval' : 
                       connection.id.includes('reject') ? 'On Reject' : 'Next Step'}
                    </text>
                    
                    {/* Delete button on hover */}
                    <circle
                      cx={(sourceX + targetX) / 2}
                      cy={(sourceY + targetY) / 2}
                      r="8"
                      fill="#ef4444"
                      className="opacity-0 hover:opacity-100 cursor-pointer transition-opacity duration-200"
                      onClick={() => deleteConnection(connection.id)}
                      style={{ pointerEvents: 'all' }}
                    />
                    <text
                      x={(sourceX + targetX) / 2}
                      y={(sourceY + targetY) / 2 + 3}
                      textAnchor="middle"
                      className="text-xs fill-white pointer-events-none select-none opacity-0 hover:opacity-100"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      ×
                    </text>
                  </g>
                );
              })}
              
              {/* Active connection line while connecting */}
              {isConnecting && connectionStart && (
                <g>
                  <line
                    x1={nodes.find(n => n.id === connectionStart.nodeId)?.position.x! + 240}
                    y1={nodes.find(n => n.id === connectionStart.nodeId)?.position.y! + 50}
                    x2={nodes.find(n => n.id === connectionStart.nodeId)?.position.x! + 300}
                    y2={nodes.find(n => n.id === connectionStart.nodeId)?.position.y! + 50}
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeDasharray="8,4"
                    className="animate-pulse"
                    markerEnd="url(#arrowhead-blue)"
                  />
                  <text
                    x={nodes.find(n => n.id === connectionStart.nodeId)?.position.x! + 270}
                    y={nodes.find(n => n.id === connectionStart.nodeId)?.position.y! + 35}
                    textAnchor="middle"
                    className="text-xs fill-blue-600 pointer-events-none select-none animate-pulse"
                    fontSize="11"
                    fontWeight="500"
                  >
                    Click target node
                  </text>
                </g>
              )}
            </svg>

            {/* Nodes */}
            {nodes.map(node => {
              const NodeIcon = getNodeIcon(node.type);
              const isSelected = selectedNode === node.id;

              return (
                <div
                  key={node.id}
                  className={`absolute bg-white rounded-xl shadow-lg border-2 cursor-move transition-all duration-200 ${
                    isSelected ? 'border-blue-500 shadow-xl ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                  } hover:shadow-xl`}
                  style={{
                    left: node.position.x,
                    top: node.position.y,
                    width: '240px',
                    minHeight: '100px'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(node.id);
                  }}
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget || e.target instanceof HTMLDivElement) {
                      const startX = e.clientX - node.position.x;
                      const startY = e.clientY - node.position.y;

                      const handleMouseMove = (e: MouseEvent) => {
                        handleNodeDrag(node.id, {
                          x: (e.clientX - startX - panOffset.x) / zoom,
                          y: (e.clientY - startY - panOffset.y) / zoom
                        });
                      };

                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };

                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }
                  }}
                >
                  {/* Node Header */}
                  <div className={`flex items-center justify-between p-4 rounded-t-xl ${getNodeColor(node.type)}`}>
                    <div className="flex items-center space-x-3 text-white">
                      <NodeIcon className="w-6 h-6" />
                      <span className="font-semibold text-sm">{node.data.label}</span>
                    </div>
                    
                    {node.id !== 'start-node' && node.id !== 'end-node' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNode(node.id);
                        }}
                        className="text-white hover:text-red-200 p-1 rounded hover:bg-black/20 transition-colors"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Node Content */}
                  <div className="p-4">
                    {node.type === 'approval' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium text-gray-900">
                            {node.data.approverType === 'USER' ? 'Specific User' : 'Role-Based'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Approver:</span>
                          <span className="font-medium text-gray-900">
                            {node.data.approverValue?.replace('ORG_', '') || 'Not set'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Timeout:</span>
                          <span className="font-medium text-gray-900">{node.data.timeoutHours || 24}h</span>
                        </div>
                        {node.data.isPaymentTrigger && (
                          <div className="flex items-center space-x-2 mt-2">
                            <BanknotesIcon className="w-4 h-4 text-orange-500" />
                            <span className="text-xs text-orange-600 font-medium">Payment Trigger</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {node.type === 'condition' && (
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center space-x-2">
                          <CogIcon className="w-4 h-4" />
                          <span>Amount-based routing</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <UsersIcon className="w-4 h-4" />
                          <span>Department filtering</span>
                        </div>
                      </div>
                    )}
                    
                    {node.type === 'email' && (
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center space-x-2">
                          <EnvelopeIcon className="w-4 h-4" />
                          <span>Notification email</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DocumentDuplicateIcon className="w-4 h-4" />
                          <span>Custom template</span>
                        </div>
                      </div>
                    )}
                    
                    {node.type === 'payment' && (
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center space-x-2">
                          <BanknotesIcon className="w-4 h-4" />
                          <span>Process payment</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>Send confirmation</span>
                        </div>
                      </div>
                    )}

                    {(node.type === 'start' || node.type === 'end') && (
                      <div className="text-sm text-gray-500 italic">
                        {node.type === 'start' ? 'Workflow entry point' : 'Workflow completion'}
                      </div>
                    )}
                  </div>

                  {/* Connection Points */}
                  {node.inputs.length > 0 && (
                    <div
                      className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-3 w-6 h-6 bg-gray-400 rounded-full border-3 border-white cursor-pointer hover:bg-blue-500 transition-colors shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isConnecting) {
                          completeConnection(node.id, 'input');
                        }
                      }}
                      title="Input connection point"
                    />
                  )}
                  
                  {node.outputs.length > 0 && (
                    <div
                      className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-3 w-6 h-6 bg-gray-400 rounded-full border-3 border-white cursor-pointer hover:bg-blue-500 transition-colors shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        startConnection(node.id, 'output');
                      }}
                      title="Output connection point"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Node Palette */}
        {showNodePalette && (
          <div className="absolute top-16 left-4 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-30 min-w-64">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Node
            </h3>
            <div className="space-y-2">
              {nodeTypes.map(nodeType => {
                const Icon = nodeType.icon;
                return (
                  <button
                    key={nodeType.type}
                    onClick={() => addNode(nodeType.type)}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 text-left border border-transparent hover:border-gray-200 transition-all"
                  >
                    <div className={`p-2 rounded-lg ${nodeType.color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{nodeType.label}</div>
                      <div className="text-xs text-gray-500">{nodeType.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Connection Status */}
        {isConnecting && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
            Click on a target node to complete the connection
          </div>
        )}
      </div>

      {/* Properties Panel */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {/* Panel Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
          <button
            onClick={saveWorkflow}
            className="btn-primary text-sm flex items-center space-x-2"
          >
            <CheckCircleIcon className="w-4 h-4" />
            <span>Save Workflow</span>
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedNodeData ? (
            <div className="space-y-6">
              {/* Node Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  {(() => {
                    const Icon = getNodeIcon(selectedNodeData.type);
                    return <Icon className="w-5 h-5 text-gray-600" />;
                  })()}
                  <span className="font-medium text-gray-900 capitalize">{selectedNodeData.type} Node</span>
                </div>
                <p className="text-sm text-gray-600">
                  Configure the properties and behavior of this workflow node.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Node Label
                </label>
                <input
                  type="text"
                  value={selectedNodeData.data.label}
                  onChange={(e) => updateNode(selectedNode!, { label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter node label"
                />
              </div>

              {selectedNodeData.type === 'approval' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Approver Type
                    </label>
                    <select
                      value={selectedNodeData.data.approverType}
                      onChange={(e) => updateNode(selectedNode!, { 
                        approverType: e.target.value as 'ROLE' | 'USER',
                        approverValue: e.target.value === 'ROLE' ? 'ORG_ADMIN' : users[0]?.id || ''
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ROLE">Role-Based</option>
                      <option value="USER">Specific User</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {selectedNodeData.data.approverType === 'ROLE' ? 'Role' : 'User'}
                    </label>
                    {selectedNodeData.data.approverType === 'ROLE' ? (
                      <select
                        value={selectedNodeData.data.approverValue}
                        onChange={(e) => updateNode(selectedNode!, { approverValue: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="ORG_ADMIN">Admin</option>
                        <option value="ORG_FINANCE">Finance</option>
                        <option value="ORG_MEMBER">Member</option>
                        <option value="ORG_AUDITOR">Auditor</option>
                      </select>
                    ) : (
                      <select
                        value={selectedNodeData.data.approverValue}
                        onChange={(e) => updateNode(selectedNode!, { approverValue: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timeout (hours)
                    </label>
                    <input
                      type="number"
                      value={selectedNodeData.data.timeoutHours}
                      onChange={(e) => updateNode(selectedNode!, { timeoutHours: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      max="168"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Time before sending reminder emails (1-168 hours)
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id={`payment-trigger-${selectedNode}`}
                        checked={selectedNodeData.data.isPaymentTrigger || false}
                        onChange={(e) => updateNode(selectedNode!, { isPaymentTrigger: e.target.checked })}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <label htmlFor={`payment-trigger-${selectedNode}`} className="text-sm font-medium text-gray-700">
                          Trigger payment after approval
                        </label>
                        <p className="text-xs text-gray-500">
                          Automatically process payment when this step is approved
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id={`auto-approve-${selectedNode}`}
                        checked={selectedNodeData.data.autoApprove || false}
                        onChange={(e) => updateNode(selectedNode!, { autoApprove: e.target.checked })}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <label htmlFor={`auto-approve-${selectedNode}`} className="text-sm font-medium text-gray-700">
                          Auto-approve after timeout
                        </label>
                        <p className="text-xs text-gray-500">
                          Automatically approve if no response within timeout period
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Template
                    </label>
                    <textarea
                      value={selectedNodeData.data.emailTemplate}
                      onChange={(e) => updateNode(selectedNode!, { emailTemplate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="Use {{requestTitle}}, {{amount}}, {{requester}} as variables"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Available variables: {`{{requestTitle}}, {{amount}}, {{requester}}, {{organization}}`}
                    </p>
                  </div>
                </>
              )}

              {selectedNodeData.type === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Template
                  </label>
                  <textarea
                    value={selectedNodeData.data.emailTemplate}
                    onChange={(e) => updateNode(selectedNode!, { emailTemplate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={6}
                    placeholder="Email content with variables..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use variables like {`{{requestTitle}}, {{amount}}, {{requester}}`} in your template
                  </p>
                </div>
              )}

              {selectedNodeData.type === 'condition' && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">Condition Logic</h4>
                    <p className="text-sm text-yellow-700">
                      Condition nodes allow branching based on payment request properties like amount, category, or department.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Condition Type
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>Amount Threshold</option>
                      <option>Category Match</option>
                      <option>Department Filter</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <CogIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Node Selected</h3>
              <p className="text-gray-600 mb-4">
                Click on a node to edit its properties and configure its behavior.
              </p>
              <button
                onClick={() => setShowNodePalette(true)}
                className="btn-secondary text-sm"
              >
                Add New Node
              </button>
            </div>
          )}
        </div>

        {/* Workflow Stats */}
        <div className="border-t border-gray-200 p-6">
          <h4 className="font-medium text-gray-900 mb-4">Workflow Statistics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{nodes.length}</div>
              <div className="text-xs text-blue-600">Total Nodes</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{nodes.filter(n => n.type === 'approval').length}</div>
              <div className="text-xs text-green-600">Approval Steps</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{connections.length}</div>
              <div className="text-xs text-purple-600">Connections</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">{nodes.filter(n => n.data.isPaymentTrigger).length}</div>
              <div className="text-xs text-orange-600">Payment Triggers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}