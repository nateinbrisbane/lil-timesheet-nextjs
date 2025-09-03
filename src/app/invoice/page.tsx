'use client';

import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';

interface DayEntry {
  id: string;
  date: string;
  startTime: string | null;
  breakHours: number | null;
  breakMinutes: number | null;
  finishTime: string | null;
}

interface TimesheetData {
  id: string;
  weekStart: string;
  days: DayEntry[];
}

interface GlobalInvoiceSettings {
  contractorName: string;
  abn: string;
  bankBsb: string;
  bankAccount: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postcode: string;
}

interface InvoiceTemplate {
  id: string;
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
}

function InvoicePageContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [timesheetData, setTimesheetData] = useState<TimesheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [globalSettings, setGlobalSettings] = useState<GlobalInvoiceSettings | null>(null);
  const [invoiceTemplates, setInvoiceTemplates] = useState<InvoiceTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);

  const weekStart = searchParams.get('weekStart');
  const templateId = searchParams.get('templateId');

  useEffect(() => {
    if (weekStart) {
      fetchTimesheetData();
      fetchInvoiceData();
      generateInvoiceNumber();
    }
  }, [weekStart, templateId]);

  const fetchInvoiceData = async () => {
    try {
      // Fetch global settings
      const settingsResponse = await fetch('/api/invoice/settings');
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json();
        setGlobalSettings(settings);
      }

      // Fetch templates
      const templatesResponse = await fetch('/api/invoice/templates');
      if (templatesResponse.ok) {
        const templates = await templatesResponse.json();
        setInvoiceTemplates(templates);
        
        // Select template based on URL param or default
        if (templateId) {
          const template = templates.find((t: InvoiceTemplate) => t.id === templateId);
          setSelectedTemplate(template || templates.find((t: InvoiceTemplate) => t.isDefault) || templates[0]);
        } else {
          setSelectedTemplate(templates.find((t: InvoiceTemplate) => t.isDefault) || templates[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching invoice data:', error);
    }
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    setInvoiceNumber(`${year}${month}${day}${random}`);
  };

  const fetchTimesheetData = async () => {
    try {
      const response = await fetch(`/api/timesheet?weekStart=${weekStart}`);
      if (response.ok) {
        const data = await response.json();
        setTimesheetData(data);
      }
    } catch (error) {
      console.error('Error fetching timesheet:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateHours = (day: DayEntry): number => {
    if (!day.startTime || !day.finishTime) return 0;

    const [startHour, startMin] = day.startTime.split(':').map(Number);
    const [finishHour, finishMin] = day.finishTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const finishMinutes = finishHour * 60 + finishMin;
    const breakMinutes = (day.breakHours || 0) * 60 + (day.breakMinutes || 0);
    
    const totalMinutes = finishMinutes - startMinutes - breakMinutes;
    return Math.max(0, totalMinutes / 60);
  };

  const getTotalHours = (): number => {
    if (!timesheetData) return 0;
    return timesheetData.days.reduce((total, day) => total + calculateHours(day), 0);
  };

  const getDaysWorked = (): number => {
    const totalHours = getTotalHours();
    return totalHours / 8; // 8 hours = 1 day
  };

  const getWeekEndingDate = (): string => {
    if (!weekStart) return '';
    const startDate = new Date(weekStart);
    const endDate = addDays(startDate, 6); // Sunday
    return format(endDate, 'dd MMM');
  };

  const getDayRate = (): number => {
    return selectedTemplate?.dayRate || 0;
  };

  const getGstPercentage = (): number => {
    return selectedTemplate?.gstPercentage || 0.1;
  };

  const getContractorDetails = () => {
    if (!globalSettings) return null;
    
    return {
      name: selectedTemplate?.customContractorName || globalSettings.contractorName,
      abn: selectedTemplate?.customAbn || globalSettings.abn,
      bankBsb: selectedTemplate?.customBankBsb || globalSettings.bankBsb,
      bankAccount: selectedTemplate?.customBankAccount || globalSettings.bankAccount,
      address: selectedTemplate?.customAddress || 
        `${globalSettings.addressLine1}${globalSettings.addressLine2 ? ', ' + globalSettings.addressLine2 : ''} ${globalSettings.city} ${globalSettings.state} ${globalSettings.postcode}`
    };
  };

  const daysWorked = getDaysWorked();
  const subtotalBeforeGST = daysWorked * getDayRate();
  const gstAmount = subtotalBeforeGST * getGstPercentage();
  const totalIncludingGST = subtotalBeforeGST * 1.1;

  if (!session) {
    return <div className="p-8">Please log in to view invoices.</div>;
  }

  if (loading) {
    return <div className="p-8">Loading invoice...</div>;
  }

  if (!globalSettings || !selectedTemplate) {
    return (
      <div className="p-8">
        <p>Invoice settings not configured. Please set up your invoice settings and templates first.</p>
        <button
          onClick={() => router.push('/settings')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Go to Settings
        </button>
      </div>
    );
  }

  const contractorDetails = getContractorDetails();

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Print/Back buttons - hidden when printing */}
      <div className="print:hidden p-4 bg-gray-50 flex justify-between items-center">
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          ← Back to Timesheet
        </button>
        
        <div className="flex items-center gap-4">
          {invoiceTemplates.length > 1 && (
            <select
              value={selectedTemplate?.id || ''}
              onChange={(e) => {
                const template = invoiceTemplates.find(t => t.id === e.target.value);
                setSelectedTemplate(template || null);
              }}
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {invoiceTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.templateName} - {template.clientName}
                </option>
              ))}
            </select>
          )}
          
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Print Invoice
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto p-8 bg-white">
        {/* Header */}
        <div className="border-b-4 border-blue-600 pb-4 mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-6">TAX INVOICE</h1>
          
          <div className="space-y-2 text-lg">
            <div>
              <span className="font-medium">Invoice #:</span> {invoiceNumber}
            </div>
            <div>
              <span className="font-medium">Contractor:</span> {contractorDetails?.name}
            </div>
            <div>
              <span className="font-medium">ABN:</span> {contractorDetails?.abn}
            </div>
            <div>
              <span className="font-medium">Bank Account:</span> BSB {contractorDetails?.bankBsb} Account {contractorDetails?.bankAccount}
            </div>
            <div>
              <span className="font-medium">Address:</span> {contractorDetails?.address}
            </div>
            <div>
              <span className="font-medium">Client:</span> {selectedTemplate?.clientName}
            </div>
          </div>
        </div>

        {/* Invoice Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-orange-100">
                <th className="border border-gray-400 px-4 py-3 text-left font-medium">Week Ending</th>
                <th className="border border-gray-400 px-4 py-3 text-left font-medium">Days Worked</th>
                <th className="border border-gray-400 px-4 py-3 text-left font-medium">Rate Per Day ($)</th>
                <th className="border border-gray-400 px-4 py-3 text-left font-medium">Subtotal Before GST ($)</th>
                <th className="border border-gray-400 px-4 py-3 text-left font-medium">GST {(getGstPercentage() * 100).toFixed(0)}% ($)</th>
                <th className="border border-gray-400 px-4 py-3 text-left font-medium">Total Including GST ($)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-400 px-4 py-3">{getWeekEndingDate()}</td>
                <td className="border border-gray-400 px-4 py-3">{daysWorked.toFixed(1)}</td>
                <td className="border border-gray-400 px-4 py-3">${getDayRate().toLocaleString('en-AU', { minimumFractionDigits: 2 })}</td>
                <td className="border border-gray-400 px-4 py-3">${subtotalBeforeGST.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</td>
                <td className="border border-gray-400 px-4 py-3">${gstAmount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</td>
                <td className="border border-gray-400 px-4 py-3">${totalIncludingGST.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr className="bg-orange-50 font-medium">
                <td className="border border-gray-400 px-4 py-3">Total</td>
                <td className="border border-gray-400 px-4 py-3">{daysWorked.toFixed(1)}</td>
                <td className="border border-gray-400 px-4 py-3">-</td>
                <td className="border border-gray-400 px-4 py-3">${subtotalBeforeGST.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</td>
                <td className="border border-gray-400 px-4 py-3">${gstAmount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</td>
                <td className="border border-gray-400 px-4 py-3">${totalIncludingGST.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer for print */}
        <div className="text-sm text-gray-600 mt-12 print:block hidden">
          <p>Total Hours Worked: {getTotalHours().toFixed(2)} hours</p>
        </div>
      </div>

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 1in;
            size: A4;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div className="p-8">Loading invoice...</div>}>
      <InvoicePageContent />
    </Suspense>
  );
}