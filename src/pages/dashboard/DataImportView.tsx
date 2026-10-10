import React, { useState } from 'react';
import {
  UploadCloud,
  Database,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Download,
  Info,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';

type Step = 1 | 2 | 3 | 4 | 5;

// Define the schema requirements and steps
const IMPORT_STEPS = [
  {
    step: 1,
    title: 'Foundations',
    description: 'Independent tables with no foreign keys.',
    tables: [
      { key: 'stores', name: 'Stores', desc: 'Store locations and formats' },
      { key: 'demographics', name: 'Demographics', desc: 'Age, gender, and income groups' },
      { key: 'product_categories', name: 'Product Categories', desc: 'Taxonomy and catalog groups' }
    ]
  },
  {
    step: 2,
    title: 'Products',
    description: 'Requires Product Categories.',
    tables: [
      { key: 'products', name: 'Products', desc: 'SKUs, prices, and brands' }
    ]
  },
  {
    step: 3,
    title: 'Customers',
    description: 'Requires Demographics.',
    tables: [
      { key: 'customers', name: 'Customers', desc: 'Customer profiles and cohorts' }
    ]
  },
  {
    step: 4,
    title: 'Transactions',
    description: 'Requires Stores and Customers.',
    tables: [
      { key: 'sales_transactions', name: 'Sales Transactions', desc: 'Orders and payment channels' }
    ]
  },
  {
    step: 5,
    title: 'Sales Items',
    description: 'Requires Transactions and Products.',
    tables: [
      { key: 'sales_items', name: 'Sales Items', desc: 'Line item details and quantities' }
    ]
  }
];

// Initial record counts
const INITIAL_COUNTS: Record<string, number> = {
  stores: 0,
  demographics: 0,
  product_categories: 0,
  products: 0,
  customers: 0,
  sales_transactions: 0,
  sales_items: 0,
};

import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';

export const DataImportView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [counts, setCounts] = useState(INITIAL_COUNTS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State to track if a file was dropped/selected for a table (mock)
  const [uploadedTables, setUploadedTables] = useState<Record<string, boolean>>({});

  const fetchAllCounts = async () => {
    if (!user) return;
    setIsRefreshing(true);
    
    try {
      const tables = Object.keys(INITIAL_COUNTS);
      const newCounts = { ...counts };
      
      await Promise.all(
        tables.map(async (table) => {
          let countQuery = supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          if (user?.id) {
            countQuery = countQuery.eq('owner_id', user.id);
          }
            
          const { count, error } = await countQuery;
          if (!error && count !== null) {
            newCounts[table] = count;
          }
        })
      );
      
      setCounts(newCounts);
    } catch (err) {
      console.error('Error fetching counts:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllCounts();
  }, [user]);

  const handleRefresh = () => {
    fetchAllCounts();
  };

  const [dragActive, setDragActive] = useState<Record<string, boolean>>({});

  const processFile = (file: File, tableKey: string) => {
    if (!user) {
      alert('Authentication required: Please sign in to import data.');
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const { data } = results;
          if (!data || data.length === 0) {
            alert('File is empty or invalid.');
            return;
          }

          // Multi-tenant security & data integrity:
          // 1. Force owner_id to current user so rows cannot be associated with any other tenant.
          // 2. Convert empty strings to null so foreign keys and numeric fields don't throw cast errors.
          const sanitizedRows = data.map((row: any) => {
            const cleaned: Record<string, any> = {
              ...row,
              owner_id: user.id,
            };
            Object.keys(cleaned).forEach((k) => {
              if (cleaned[k] === '' || cleaned[k] === undefined) {
                cleaned[k] = null;
              }
            });
            return cleaned;
          });

          // Insert in chunks of 500 to prevent payload limits
          const CHUNK_SIZE = 500;
          let insertedCount = 0;

          for (let i = 0; i < sanitizedRows.length; i += CHUNK_SIZE) {
            const chunk = sanitizedRows.slice(i, i + CHUNK_SIZE);
            const { error } = await supabase.from(tableKey).insert(chunk);

            if (error) {
              console.error('Supabase error on chunk:', error);
              throw new Error(error.message);
            }
            insertedCount += chunk.length;
          }

          setUploadedTables(prev => ({ ...prev, [tableKey]: true }));
          setCounts(prev => ({ ...prev, [tableKey]: prev[tableKey] + insertedCount }));
          alert(`Successfully imported ${insertedCount} rows into ${tableKey} for your account!`);
        } catch (err: any) {
          console.error(err);
          alert(`Error importing data into ${tableKey}: ${err.message || 'An unexpected error occurred.'}`);
        }
      },
      error: (error) => {
        alert(`Error parsing CSV: ${error.message}`);
      }
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, tableKey: string) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    processFile(file, tableKey);
  };

  const handleDrag = (e: React.DragEvent, tableKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(prev => ({ ...prev, [tableKey]: true }));
    } else if (e.type === 'dragleave') {
      setDragActive(prev => ({ ...prev, [tableKey]: false }));
    }
  };

  const handleDrop = (e: React.DragEvent, tableKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [tableKey]: false }));
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], tableKey);
    }
  };

  const downloadTemplate = (tableKey: string) => {
    const templates: Record<string, string[]> = {
      stores: ['store_code', 'store_name', 'city', 'state', 'region', 'store_type', 'opening_date', 'manager_name', 'latitude', 'longitude', 'is_active'],
      demographics: ['age_group', 'gender', 'income_group', 'education_level', 'occupation', 'marital_status'],
      product_categories: ['category_name', 'description'],
      products: ['product_code', 'product_name', 'category_id', 'brand', 'unit_price', 'cost_price', 'is_active'],
      customers: ['customer_code', 'full_name', 'email', 'phone', 'date_of_birth', 'gender', 'demographic_id', 'city', 'state', 'region', 'registration_date', 'customer_segment'],
      sales_transactions: ['transaction_code', 'store_id', 'customer_id', 'transaction_date', 'status', 'payment_method', 'sales_channel'],
      sales_items: ['transaction_id', 'product_id', 'quantity', 'unit_price', 'discount_amount', 'tax_amount']
    };

    const headers = templates[tableKey];
    if (!headers) return;

    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${tableKey}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentStepData = IMPORT_STEPS.find(s => s.step === currentStep)!;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-20">
      
      {/* Header & Record Counts */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Current Database Records</h2>
          </div>
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Counts
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(counts).map(([key, count]) => (
            <div key={key} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-between h-[84px]">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                {key.replace('_', ' ')}
              </div>
              <div className="flex items-end justify-between">
                <span className="text-xl font-black text-slate-900">{(count as number).toLocaleString()}</span>
                {(count as number) > 0 && (
                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md">
                    LOADED
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stepper Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-6">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-blue-900">Relational Import Wizard</h3>
            <p className="text-sm text-blue-700 mt-1">
              To prevent Foreign Key constraints from failing, you must upload data in the exact order below. 
              Child tables cannot be imported until their parent records exist.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {IMPORT_STEPS.map((stepInfo) => (
            <button
              key={stepInfo.step}
              onClick={() => setCurrentStep(stepInfo.step as Step)}
              className={`text-left p-3 rounded-xl border transition-all ${
                currentStep === stepInfo.step 
                  ? 'bg-white border-blue-400 shadow-sm ring-1 ring-blue-400/20' 
                  : currentStep > stepInfo.step
                    ? 'bg-white/50 border-blue-200 hover:bg-white hover:border-blue-300'
                    : 'bg-white/40 border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider mb-1 flex justify-between items-center">
                <span className={currentStep === stepInfo.step ? 'text-blue-700' : 'text-slate-500'}>
                  Step {stepInfo.step}
                </span>
                {currentStep > stepInfo.step && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
              </div>
              <div className={`font-bold text-sm ${currentStep === stepInfo.step ? 'text-slate-900' : 'text-slate-700'}`}>
                {stepInfo.title}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Cards for Current Step */}
      <div className="space-y-4">
        {currentStepData.tables.map((table) => (
          <div key={table.key} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-900">{table.name}</h3>
                  <span className="bg-slate-100 text-slate-600 font-mono text-[10px] px-2 py-1 rounded-md border border-slate-200">
                    table: {table.key}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{table.desc}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {(counts[table.key] as number) > 0 && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {counts[table.key] as number} rows
                  </span>
                )}
                <button 
                  onClick={() => downloadTemplate(table.key)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Template
                </button>
              </div>
            </div>

            {/* Dropzone */}
            <div 
              onDragEnter={(e) => handleDrag(e, table.key)}
              onDragLeave={(e) => handleDrag(e, table.key)}
              onDragOver={(e) => handleDrag(e, table.key)}
              onDrop={(e) => handleDrop(e, table.key)}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                uploadedTables[table.key] 
                  ? 'bg-emerald-50/50 border-emerald-200' 
                  : dragActive[table.key]
                    ? 'bg-emerald-50/50 border-emerald-400 scale-[1.02] shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100/50 border-slate-200 hover:border-emerald-300'
              }`}
            >
              {uploadedTables[table.key] ? (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-slate-900">File Processed Successfully</div>
                  <button 
                    onClick={() => setUploadedTables(prev => ({ ...prev, [table.key]: false }))}
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    Upload another file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-white border border-slate-200 text-slate-400 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">
                    Click or drag and drop your <span className="text-emerald-600">{table.name}</span> CSV
                  </h4>
                  <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
                    Ensure columns match the database schema. Standard UTF-8 CSV files with header rows supported.
                  </p>
                  
                  <label className="inline-flex items-center gap-2 bg-white border border-slate-200 text-emerald-700 font-bold text-sm px-5 py-2.5 rounded-xl cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm">
                    <FileSpreadsheet className="w-4 h-4" />
                    Browse CSV File
                    <input 
                      type="file" 
                      accept=".csv" 
                      className="hidden" 
                      onChange={(e) => handleFileUpload(e, table.key)} 
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 lg:pl-[292px] z-20">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <button 
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1) as Step)}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Step
          </button>
          
          <div className="text-xs font-bold text-slate-400 tracking-wider">
            STEP {currentStep} OF 5
          </div>

          {currentStep === 5 ? (
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 transition-colors shadow-md"
            >
              Finish Import
              <CheckCircle2 className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={() => setCurrentStep(prev => Math.min(5, prev + 1) as Step)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-md"
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
