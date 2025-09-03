'use client';

import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';

interface DayData {
  date: string;
  start: string | null;
  breakHours: string;
  breakMinutes: string;
  finish: string | null;
  total: string;
}

interface TimesheetData {
  weekStart: string;
  weeklyTotal: string;
  data: Record<string, DayData>;
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
  const [invoiceDataLoading, setInvoiceDataLoading] = useState(true);
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
      console.log('Settings response status:', settingsResponse.status);
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json();
        console.log('Settings data:', settings);
        if (settings && settings.id) {
          setGlobalSettings(settings);
        } else {
          console.log('No global settings found');
        }
      } else {
        console.log('Settings fetch failed:', settingsResponse.status, settingsResponse.statusText);
      }

      // Fetch templates
      const templatesResponse = await fetch('/api/invoice/templates');
      console.log('Templates response status:', templatesResponse.status);
      if (templatesResponse.ok) {
        const templates = await templatesResponse.json();
        console.log('Templates data:', templates);
        setInvoiceTemplates(templates);
        
        // Select template based on URL param or default
        if (templateId) {
          const template = templates.find((t: InvoiceTemplate) => t.id === templateId);
          setSelectedTemplate(template || templates.find((t: InvoiceTemplate) => t.isDefault) || templates[0]);
        } else {
          setSelectedTemplate(templates.find((t: InvoiceTemplate) => t.isDefault) || templates[0]);
        }
      } else {
        console.log('Templates fetch failed:', templatesResponse.status, templatesResponse.statusText);
      }
    } catch (error) {
      console.error('Error fetching invoice data:', error);
    } finally {
      setInvoiceDataLoading(false);
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
        const result = await response.json();
        if (result.success) {
          setTimesheetData(result.data);
        }
      } else if (response.status === 404) {
        // Timesheet doesn't exist for this week - create empty data
        setTimesheetData({
          weekStart: weekStart || '',
          weeklyTotal: '0:00',
          data: {
            mon: { date: '', start: null, breakHours: '0', breakMinutes: '0', finish: null, total: '0:00' },
            tue: { date: '', start: null, breakHours: '0', breakMinutes: '0', finish: null, total: '0:00' },
            wed: { date: '', start: null, breakHours: '0', breakMinutes: '0', finish: null, total: '0:00' },
            thu: { date: '', start: null, breakHours: '0', breakMinutes: '0', finish: null, total: '0:00' },
            fri: { date: '', start: null, breakHours: '0', breakMinutes: '0', finish: null, total: '0:00' },
            sat: { date: '', start: null, breakHours: '0', breakMinutes: '0', finish: null, total: '0:00' },
            sun: { date: '', start: null, breakHours: '0', breakMinutes: '0', finish: null, total: '0:00' }
          }
        });
      } else {
        console.error('Failed to fetch timesheet:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching timesheet:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateHours = (dayData: DayData): number => {
    if (!dayData.start || !dayData.finish) return 0;

    const [startHour, startMin] = dayData.start.split(':').map(Number);
    const [finishHour, finishMin] = dayData.finish.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const finishMinutes = finishHour * 60 + finishMin;
    const breakMinutes = parseInt(dayData.breakHours || '0') * 60 + parseInt(dayData.breakMinutes || '0');
    
    const totalMinutes = finishMinutes - startMinutes - breakMinutes;
    return Math.max(0, totalMinutes / 60);
  };

  const getTotalHours = (): number => {
    if (!timesheetData) return 0;
    return Object.values(timesheetData.data).reduce((total, dayData) => total + calculateHours(dayData), 0);
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
  const dayRate = getDayRate();
  const gstPercentage = getGstPercentage();
  
  const subtotalBeforeGST = daysWorked * dayRate;
  const gstAmount = subtotalBeforeGST * gstPercentage;
  const totalIncludingGST = subtotalBeforeGST * (1 + gstPercentage);

  if (!session) {
    return <div className="p-4 sm:p-8">Please log in to view invoices.</div>;
  }

  if (loading || invoiceDataLoading) {
    return <div className="p-4 sm:p-8">Loading invoice...</div>;
  }

  console.log('Checking settings state:', { globalSettings: !!globalSettings, selectedTemplate: !!selectedTemplate, loading, invoiceDataLoading });
  
  if (!globalSettings || !selectedTemplate) {
    return (
      <div className="p-4 sm:p-8">
        <p className="text-sm sm:text-base">Invoice settings not configured. Please set up your invoice settings and templates first.</p>
        <button
          onClick={() => router.push('/settings')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm sm:text-base"
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

  return (
    <div className="min-h-screen bg-white">
      {/* Print button - hidden when printing */}
      <div className="print:hidden p-3 sm:p-4 bg-gray-50 flex justify-center sm:justify-end">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          {invoiceTemplates.length > 1 && (
            <select
              value={selectedTemplate?.id || ''}
              onChange={(e) => {
                const template = invoiceTemplates.find(t => t.id === e.target.value);
                setSelectedTemplate(template || null);
              }}
              className="w-full sm:w-auto px-2 sm:px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm sm:text-base"
          >
            Print Invoice
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto p-4 sm:p-8 bg-white">
        {/* Header */}
        <div className="border-b-4 border-blue-600 pb-3 sm:pb-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-blue-600 mb-4 sm:mb-6">TAX INVOICE</h1>
          
          <div className="space-y-1 sm:space-y-2 text-sm sm:text-lg">
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
        <div className="mb-6 sm:mb-8">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-orange-100">
                  <th className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-xs sm:text-sm">Week Ending</th>
                  <th className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-xs sm:text-sm">Days</th>
                  <th className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-xs sm:text-sm">Rate/Day ($)</th>
                  <th className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-xs sm:text-sm">Subtotal ($)</th>
                  <th className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-xs sm:text-sm">GST {(getGstPercentage() * 100).toFixed(0)}% ($)</th>
                  <th className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-xs sm:text-sm">Total ($)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{getWeekEndingDate()}</td>
                  <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{daysWorked.toFixed(1)}</td>
                  <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">${getDayRate().toLocaleString('en-AU', { minimumFractionDigits: 2 })}</td>
                  <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">${subtotalBeforeGST.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</td>
                  <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">${gstAmount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</td>
                  <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">${totalIncludingGST.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className="bg-orange-50 font-medium">
                  <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">Total</td>
                  <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{daysWorked.toFixed(1)}</td>
                  <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">-</td>
                  <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">${subtotalBeforeGST.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</td>
                  <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">${gstAmount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</td>
                  <td className="border border-gray-400 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">${totalIncludingGST.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer for print */}
        <div className="text-xs sm:text-sm text-gray-600 mt-8 sm:mt-12 print:block hidden">
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
          
          /* Hide navigation and page wrapper during print */
          nav,
          .bg-gray-50 {
            display: none !important;
          }
          
          /* Ensure invoice content takes full width when printing */
          .min-h-screen {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div className="p-4 sm:p-8">Loading invoice...</div>}>
      <InvoicePageContent />
    </Suspense>
  );
}