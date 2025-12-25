'use client';

import { useState } from 'react';
import {
  SparklesIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  LightBulbIcon,
  ArrowPathIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { geminiEmailService, EmailTemplateRequest, EmailTemplate } from '@/lib/gemini-service';
import toast from 'react-hot-toast';

interface AIEmailTemplateBuilderProps {
  onTemplateGenerated: (template: EmailTemplate) => void;
  initialContext?: Partial<EmailTemplateRequest['context']>;
  templateType?: EmailTemplateRequest['type'];
}

export default function AIEmailTemplateBuilder({ 
  onTemplateGenerated, 
  initialContext = {},
  templateType = 'custom'
}: AIEmailTemplateBuilderProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generatedTemplates, setGeneratedTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  
  const [request, setRequest] = useState<EmailTemplateRequest>({
    type: templateType,
    context: {
      organizationName: 'Your Organization',
      tone: 'professional',
      language: 'English',
      urgency: 'medium',
      ...initialContext
    },
    customPrompt: ''
  });

  const templateTypes = [
    { value: 'approval_request', label: 'Approval Request', icon: DocumentTextIcon },
    { value: 'approval_update', label: 'Approval Update', icon: CheckCircleIcon },
    { value: 'payment_status', label: 'Payment Status', icon: PaperAirplaneIcon },
    { value: 'reminder', label: 'Reminder', icon: ExclamationTriangleIcon },
    { value: 'welcome', label: 'Welcome Email', icon: SparklesIcon },
    { value: 'custom', label: 'Custom Template', icon: LightBulbIcon }
  ];

  const tones = [
    { value: 'formal', label: 'Formal', description: 'Corporate and official' },
    { value: 'professional', label: 'Professional', description: 'Business-friendly' },
    { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' }
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-red-600' }
  ];

  const handleGenerate = async () => {
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      toast.error('Gemini API key not configured');
      return;
    }

    setIsGenerating(true);
    try {
      const template = await geminiEmailService.generateEmailTemplate(request);
      setGeneratedTemplates([template]);
      setSelectedTemplate(template);
      toast.success('Email template generated successfully!');
    } catch (error) {
      console.error('Error generating template:', error);
      toast.error('Failed to generate template. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateVariations = async () => {
    if (!selectedTemplate) return;
    
    setIsGenerating(true);
    try {
      const variations = await geminiEmailService.suggestEmailVariations(
        `${selectedTemplate.subject}\n\n${selectedTemplate.body}`,
        3
      );
      setGeneratedTemplates(variations);
      toast.success('Template variations generated!');
    } catch (error) {
      console.error('Error generating variations:', error);
      toast.error('Failed to generate variations. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    onTemplateGenerated(template);
    
    // Save template to workflow system
    if (typeof window !== 'undefined') {
      localStorage.setItem('workflowEmailTemplate', JSON.stringify(template));
    }
    
    toast.success('Template applied to workflow successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Email Template Builder</h3>
            <p className="text-sm text-gray-600">Generate professional email templates with AI assistance</p>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-4">
          {/* Template Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Template Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {templateTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => setRequest(prev => ({ ...prev, type: type.value as any }))}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      request.type === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{type.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                value={request.context.organizationName || ''}
                onChange={(e) => setRequest(prev => ({
                  ...prev,
                  context: { ...prev.context, organizationName: e.target.value }
                }))}
                className="input-field"
                placeholder="Your Organization"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tone
              </label>
              <select
                value={request.context.tone || 'professional'}
                onChange={(e) => setRequest(prev => ({
                  ...prev,
                  context: { ...prev.context, tone: e.target.value as any }
                }))}
                className="input-field"
              >
                {tones.map(tone => (
                  <option key={tone.value} value={tone.value}>
                    {tone.label} - {tone.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Advanced Settings */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
              <ArrowPathIcon className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Role
                  </label>
                  <input
                    type="text"
                    value={request.context.recipientRole || ''}
                    onChange={(e) => setRequest(prev => ({
                      ...prev,
                      context: { ...prev.context, recipientRole: e.target.value }
                    }))}
                    className="input-field"
                    placeholder="Manager, Director, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency Level
                  </label>
                  <select
                    value={request.context.urgency || 'medium'}
                    onChange={(e) => setRequest(prev => ({
                      ...prev,
                      context: { ...prev.context, urgency: e.target.value as any }
                    }))}
                    className="input-field"
                  >
                    {urgencyLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={request.context.language || 'English'}
                    onChange={(e) => setRequest(prev => ({
                      ...prev,
                      context: { ...prev.context, language: e.target.value }
                    }))}
                    className="input-field"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>
              </div>

              {request.type === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Instructions
                  </label>
                  <textarea
                    value={request.customPrompt || ''}
                    onChange={(e) => setRequest(prev => ({ ...prev, customPrompt: e.target.value }))}
                    className="input-field h-24"
                    placeholder="Describe what kind of email template you need..."
                  />
                </div>
              )}
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-end space-x-3">
            {selectedTemplate && (
              <button
                onClick={handleGenerateVariations}
                disabled={isGenerating}
                className="btn-secondary flex items-center space-x-2"
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span>Generate Variations</span>
              </button>
            )}
            
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="btn-primary flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4" />
                  <span>Generate Template</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Templates */}
      {generatedTemplates.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Generated Templates</h4>
          
          <div className="grid grid-cols-1 gap-4">
            {generatedTemplates.map((template, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl border p-6 transition-all ${
                  selectedTemplate === template
                    ? 'border-blue-500 ring-2 ring-blue-100'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-900">Template {index + 1}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedTemplate(template)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="btn-primary text-sm px-3 py-1"
                    >
                      Use This Template
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Subject Line
                    </label>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-900">{template.subject}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Email Body
                    </label>
                    <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                      <pre className="text-sm text-gray-900 whitespace-pre-wrap font-sans">
                        {template.body}
                      </pre>
                    </div>
                  </div>

                  {template.variables.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Variables ({template.variables.length})
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable, varIndex) => (
                          <span
                            key={varIndex}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {variable}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Key Notice */}
      {!process.env.NEXT_PUBLIC_GEMINI_API_KEY && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">API Key Required</h4>
              <p className="text-sm text-yellow-700 mt-1">
                To use AI-powered email templates, please configure your Gemini API key in the environment variables.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}