'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface GlobalInvoiceSettings {
  id?: string;
  contractorName: string;
  abn: string;
  bankBsb: string;
  bankAccount: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postcode: string;
}

interface InvoiceTemplate {
  id?: string;
  templateName: string;
  clientName: string;
  dayRate: number;
  gstPercentage: number;
  customContractorName?: string;
  customAbn?: string;
  customBankBsb?: string;
  customBankAccount?: string;
  customAddress?: string;
  isDefault: boolean;
  isActive: boolean;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // Global settings state
  const [globalSettings, setGlobalSettings] = useState<GlobalInvoiceSettings>({
    contractorName: '',
    abn: '',
    bankBsb: '',
    bankAccount: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postcode: '',
  });

  // Templates state
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<InvoiceTemplate | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('global');

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      // Fetch global settings
      const settingsResponse = await fetch('/api/invoice/settings');
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json();
        if (settings) {
          setGlobalSettings(settings);
        }
      }

      // Fetch templates
      const templatesResponse = await fetch('/api/invoice/templates');
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGlobalSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/invoice/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(globalSettings),
      });

      if (response.ok) {
        alert('Global settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const saveTemplate = async (template: InvoiceTemplate) => {
    try {
      const url = template.id 
        ? `/api/invoice/templates/${template.id}`
        : '/api/invoice/templates';
      
      const method = template.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });

      if (response.ok) {
        await fetchData(); // Refresh data
        setShowTemplateForm(false);
        setEditingTemplate(null);
        alert('Template saved successfully!');
      } else {
        alert('Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/invoice/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData(); // Refresh data
        alert('Template deleted successfully!');
      } else {
        alert('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template');
    }
  };

  if (!session) {
    return <div className="p-8">Please log in to access settings.</div>;
  }

  if (loading) {
    return <div className="p-8">Loading settings...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Invoice Settings</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            ← Back to Timesheet
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('global')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'global'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Global Settings
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'templates'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Invoice Templates
              </button>
            </nav>
          </div>
        </div>

        {/* Global Settings Tab */}
        {activeTab === 'global' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Your Contractor Details</h2>
            <p className="text-gray-600 mb-6">These are your default contractor details that will appear on all invoices unless overridden by template-specific settings.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contractor Name *
                </label>
                <input
                  type="text"
                  value={globalSettings.contractorName}
                  onChange={(e) => setGlobalSettings({...globalSettings, contractorName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ABN *
                </label>
                <input
                  type="text"
                  value={globalSettings.abn}
                  onChange={(e) => setGlobalSettings({...globalSettings, abn: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank BSB *
                </label>
                <input
                  type="text"
                  value={globalSettings.bankBsb}
                  onChange={(e) => setGlobalSettings({...globalSettings, bankBsb: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 064-496"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Account *
                </label>
                <input
                  type="text"
                  value={globalSettings.bankAccount}
                  onChange={(e) => setGlobalSettings({...globalSettings, bankAccount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 1733 3825"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  value={globalSettings.addressLine1}
                  onChange={(e) => setGlobalSettings({...globalSettings, addressLine1: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Unit 5, 188 Gladstone Road"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={globalSettings.addressLine2}
                  onChange={(e) => setGlobalSettings({...globalSettings, addressLine2: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional additional address line"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={globalSettings.city}
                  onChange={(e) => setGlobalSettings({...globalSettings, city: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Highgate Hill Brisbane"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={globalSettings.state}
                  onChange={(e) => setGlobalSettings({...globalSettings, state: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. QLD"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postcode *
                </label>
                <input
                  type="text"
                  value={globalSettings.postcode}
                  onChange={(e) => setGlobalSettings({...globalSettings, postcode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 4101"
                  required
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={saveGlobalSettings}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Global Settings'}
              </button>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            {/* Templates Header */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Invoice Templates</h2>
                  <p className="text-gray-600 mt-1">Create different templates for different clients with custom rates and settings.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingTemplate({
                      templateName: '',
                      clientName: '',
                      dayRate: 1250,
                      gstPercentage: 0.1,
                      isDefault: false,
                      isActive: true,
                    });
                    setShowTemplateForm(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  + New Template
                </button>
              </div>

              {/* Templates List */}
              {templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No invoice templates yet. Create your first template to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-lg">{template.templateName}</h3>
                            {template.isDefault && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Client:</span> {template.clientName}
                            </div>
                            <div>
                              <span className="font-medium">Rate:</span> ${template.dayRate.toLocaleString()}/day
                            </div>
                            <div>
                              <span className="font-medium">GST:</span> {(template.gstPercentage * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => {
                              setEditingTemplate(template);
                              setShowTemplateForm(true);
                            }}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => template.id && deleteTemplate(template.id)}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Template Form Modal */}
            {showTemplateForm && editingTemplate && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold">
                        {editingTemplate.id ? 'Edit Template' : 'New Template'}
                      </h3>
                      <button
                        onClick={() => {
                          setShowTemplateForm(false);
                          setEditingTemplate(null);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <span className="text-2xl">×</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Basic Template Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Template Name *
                          </label>
                          <input
                            type="text"
                            value={editingTemplate.templateName}
                            onChange={(e) => setEditingTemplate({...editingTemplate, templateName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. Client A - Development"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Client Name *
                          </label>
                          <input
                            type="text"
                            value={editingTemplate.clientName}
                            onChange={(e) => setEditingTemplate({...editingTemplate, clientName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. Acme Corporation"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Day Rate ($) *
                          </label>
                          <input
                            type="number"
                            value={editingTemplate.dayRate}
                            onChange={(e) => setEditingTemplate({...editingTemplate, dayRate: parseFloat(e.target.value) || 0})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            step="0.01"
                            min="0"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            GST Percentage *
                          </label>
                          <select
                            value={editingTemplate.gstPercentage}
                            onChange={(e) => setEditingTemplate({...editingTemplate, gstPercentage: parseFloat(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="0">0% (GST Free)</option>
                            <option value="0.1">10% (Standard GST)</option>
                            <option value="0.15">15%</option>
                          </select>
                        </div>
                      </div>

                      {/* Template Settings */}
                      <div className="flex items-center space-x-4 pt-4 border-t">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editingTemplate.isDefault}
                            onChange={(e) => setEditingTemplate({...editingTemplate, isDefault: e.target.checked})}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Set as default template</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editingTemplate.isActive}
                            onChange={(e) => setEditingTemplate({...editingTemplate, isActive: e.target.checked})}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Active template</span>
                        </label>
                      </div>

                      {/* Custom Overrides Section */}
                      <div className="pt-4 border-t">
                        <h4 className="text-md font-medium text-gray-900 mb-3">Custom Contractor Details (Optional)</h4>
                        <p className="text-sm text-gray-600 mb-4">Override global contractor details for this template. Leave blank to use global settings.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Custom Contractor Name
                            </label>
                            <input
                              type="text"
                              value={editingTemplate.customContractorName || ''}
                              onChange={(e) => setEditingTemplate({...editingTemplate, customContractorName: e.target.value || undefined})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Leave blank to use global setting"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Custom ABN
                            </label>
                            <input
                              type="text"
                              value={editingTemplate.customAbn || ''}
                              onChange={(e) => setEditingTemplate({...editingTemplate, customAbn: e.target.value || undefined})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Leave blank to use global setting"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Custom Bank BSB
                            </label>
                            <input
                              type="text"
                              value={editingTemplate.customBankBsb || ''}
                              onChange={(e) => setEditingTemplate({...editingTemplate, customBankBsb: e.target.value || undefined})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Leave blank to use global setting"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Custom Bank Account
                            </label>
                            <input
                              type="text"
                              value={editingTemplate.customBankAccount || ''}
                              onChange={(e) => setEditingTemplate({...editingTemplate, customBankAccount: e.target.value || undefined})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Leave blank to use global setting"
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Custom Address
                            </label>
                            <input
                              type="text"
                              value={editingTemplate.customAddress || ''}
                              onChange={(e) => setEditingTemplate({...editingTemplate, customAddress: e.target.value || undefined})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Leave blank to use global setting"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                      <button
                        onClick={() => {
                          setShowTemplateForm(false);
                          setEditingTemplate(null);
                        }}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveTemplate(editingTemplate)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Save Template
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}