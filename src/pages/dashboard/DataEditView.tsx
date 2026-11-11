import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  FileEdit,
  Plus,
  Trash2,
  Edit2,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Store,
  Users,
  Package,
  Layers,
  Receipt,
  ShoppingCart,
  X,
  Target,
  CheckSquare,
  Square,
  MinusSquare,
  AlertTriangle,
  Flame
} from 'lucide-react';

interface ColumnConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'readonly';
  required?: boolean;
  options?: { label: string; value: string | number | boolean }[];
  isCurrency?: boolean;
  isId?: boolean;
}

interface TableDefinition {
  id: string;
  name: string;
  tableName: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  primaryKey: string;
  columns: ColumnConfig[];
}

const TABLE_DEFINITIONS: TableDefinition[] = [
  {
    id: 'stores',
    name: 'Stores',
    tableName: 'stores',
    icon: Store,
    description: 'Retail stores, branch locations, and formats',
    primaryKey: 'id',
    columns: [
      { key: 'id', label: 'ID', type: 'readonly', isId: true },
      { key: 'store_code', label: 'Store Code', type: 'text', required: true },
      { key: 'store_name', label: 'Store Name', type: 'text', required: true },
      { key: 'city', label: 'City', type: 'text' },
      { key: 'state', label: 'State', type: 'text' },
      { key: 'region', label: 'Region', type: 'select', options: [
        { label: 'North', value: 'North' },
        { label: 'South', value: 'South' },
        { label: 'East', value: 'East' },
        { label: 'West', value: 'West' },
        { label: 'Central', value: 'Central' },
      ]},
      { key: 'store_type', label: 'Store Type', type: 'select', options: [
        { label: 'Supermarket', value: 'Supermarket' },
        { label: 'Hypermarket', value: 'Hypermarket' },
        { label: 'Express', value: 'Express' },
        { label: 'Flagship', value: 'Flagship' },
        { label: 'Convenience', value: 'Convenience' },
      ]},
      { key: 'manager_name', label: 'Manager Name', type: 'text' },
      { key: 'opening_date', label: 'Opening Date', type: 'date' },
      { key: 'is_active', label: 'Active', type: 'select', options: [
        { label: 'True', value: true },
        { label: 'False', value: false },
      ]},
    ]
  },
  {
    id: 'customers',
    name: 'Customers',
    tableName: 'customers',
    icon: Users,
    description: 'Customer profiles, contact details, and cohorts',
    primaryKey: 'id',
    columns: [
      { key: 'id', label: 'ID', type: 'readonly', isId: true },
      { key: 'customer_code', label: 'Customer Code', type: 'text', required: true },
      { key: 'full_name', label: 'Full Name', type: 'text', required: true },
      { key: 'email', label: 'Email Address', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'city', label: 'City', type: 'text' },
      { key: 'state', label: 'State', type: 'text' },
      { key: 'region', label: 'Region', type: 'select', options: [
        { label: 'North', value: 'North' },
        { label: 'South', value: 'South' },
        { label: 'East', value: 'East' },
        { label: 'West', value: 'West' },
        { label: 'Central', value: 'Central' },
      ]},
      { key: 'customer_segment', label: 'Segment', type: 'select', options: [
        { label: 'VIP', value: 'VIP' },
        { label: 'Loyal', value: 'Loyal' },
        { label: 'Regular', value: 'Regular' },
        { label: 'At-Risk', value: 'At-Risk' },
        { label: 'New', value: 'New' },
        { label: 'Premium', value: 'Premium' },
      ]},
      { key: 'gender', label: 'Gender', type: 'select', options: [
        { label: 'Male', value: 'Male' },
        { label: 'Female', value: 'Female' },
        { label: 'Other', value: 'Other' },
      ]},
      { key: 'demographic_id', label: 'Demographic ID', type: 'number' },
      { key: 'registration_date', label: 'Registration Date', type: 'date' },
    ]
  },
  {
    id: 'products',
    name: 'Products',
    tableName: 'products',
    icon: Package,
    description: 'Product catalog, SKUs, pricing, and brands',
    primaryKey: 'id',
    columns: [
      { key: 'id', label: 'ID', type: 'readonly', isId: true },
      { key: 'product_code', label: 'Product Code', type: 'text', required: true },
      { key: 'product_name', label: 'Product Name', type: 'text', required: true },
      { key: 'category_id', label: 'Category ID', type: 'number' },
      { key: 'brand', label: 'Brand', type: 'text' },
      { key: 'unit_price', label: 'Unit Price', type: 'number', required: true, isCurrency: true },
      { key: 'cost_price', label: 'Cost Price', type: 'number', isCurrency: true },
      { key: 'is_active', label: 'Active', type: 'select', options: [
        { label: 'True', value: true },
        { label: 'False', value: false },
      ]},
    ]
  },
  {
    id: 'product_categories',
    name: 'Categories',
    tableName: 'product_categories',
    icon: Layers,
    description: 'Taxonomy and catalog category groupings',
    primaryKey: 'id',
    columns: [
      { key: 'id', label: 'ID', type: 'readonly', isId: true },
      { key: 'category_name', label: 'Category Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'text' },
    ]
  },
  {
    id: 'sales_transactions',
    name: 'Transactions',
    tableName: 'sales_transactions',
    icon: Receipt,
    description: 'Orders, channels, statuses, and totals',
    primaryKey: 'id',
    columns: [
      { key: 'id', label: 'ID', type: 'readonly', isId: true },
      { key: 'transaction_code', label: 'Order Code', type: 'text', required: true },
      { key: 'store_id', label: 'Store ID', type: 'number', required: true },
      { key: 'customer_id', label: 'Customer ID', type: 'number' },
      { key: 'transaction_date', label: 'Transaction Date', type: 'date', required: true },
      { key: 'status', label: 'Status', type: 'select', required: true, options: [
        { label: 'Completed', value: 'completed' },
        { label: 'Pending', value: 'pending' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Refunded', value: 'refunded' },
      ]},
      { key: 'payment_method', label: 'Payment Method', type: 'select', options: [
        { label: 'UPI', value: 'UPI' },
        { label: 'Credit Card', value: 'Credit Card' },
        { label: 'Debit Card', value: 'Debit Card' },
        { label: 'Cash', value: 'Cash' },
        { label: 'Net Banking', value: 'Net Banking' },
      ]},
      { key: 'sales_channel', label: 'Sales Channel', type: 'select', options: [
        { label: 'In-Store', value: 'In-Store' },
        { label: 'Online', value: 'Online' },
        { label: 'Mobile App', value: 'Mobile App' },
      ]},
      { key: 'subtotal', label: 'Subtotal', type: 'number', isCurrency: true },
      { key: 'discount_amount', label: 'Discount', type: 'number', isCurrency: true },
      { key: 'tax_amount', label: 'Tax', type: 'number', isCurrency: true },
      { key: 'total_amount', label: 'Total Amount', type: 'number', required: true, isCurrency: true },
    ]
  },
  {
    id: 'sales_items',
    name: 'Sales Items',
    tableName: 'sales_items',
    icon: ShoppingCart,
    description: 'Line item product sales and quantities',
    primaryKey: 'id',
    columns: [
      { key: 'id', label: 'ID', type: 'readonly', isId: true },
      { key: 'transaction_id', label: 'Transaction ID', type: 'number', required: true },
      { key: 'product_id', label: 'Product ID', type: 'number', required: true },
      { key: 'quantity', label: 'Quantity', type: 'number', required: true },
      { key: 'unit_price', label: 'Unit Price', type: 'number', required: true, isCurrency: true },
      { key: 'discount_amount', label: 'Discount', type: 'number', isCurrency: true },
      { key: 'tax_amount', label: 'Tax', type: 'number', isCurrency: true },
      { key: 'total_amount', label: 'Total Amount', type: 'number', isCurrency: true },
    ]
  },
  {
    id: 'demographics',
    name: 'Demographics',
    tableName: 'demographics',
    icon: Database,
    description: 'Demographic profiles, income, and education tiers',
    primaryKey: 'id',
    columns: [
      { key: 'id', label: 'ID', type: 'readonly', isId: true },
      { key: 'age_group', label: 'Age Group', type: 'select', options: [
        { label: '18-24', value: '18-24' },
        { label: '25-34', value: '25-34' },
        { label: '35-44', value: '35-44' },
        { label: '45-54', value: '45-54' },
        { label: '55+', value: '55+' },
      ]},
      { key: 'gender', label: 'Gender', type: 'select', options: [
        { label: 'Male', value: 'Male' },
        { label: 'Female', value: 'Female' },
        { label: 'Other', value: 'Other' },
      ]},
      { key: 'income_group', label: 'Income Group', type: 'select', options: [
        { label: 'Low', value: 'Low' },
        { label: 'Medium', value: 'Medium' },
        { label: 'High', value: 'High' },
        { label: 'Premium', value: 'Premium' },
      ]},
      { key: 'education_level', label: 'Education Level', type: 'text' },
      { key: 'occupation', label: 'Occupation', type: 'text' },
      { key: 'marital_status', label: 'Marital Status', type: 'text' },
    ]
  },
  {
    id: 'store_targets',
    name: 'Store Targets',
    tableName: 'store_targets',
    icon: Target,
    description: 'Monthly store revenue and sales targets',
    primaryKey: 'id',
    columns: [
      { key: 'id', label: 'ID', type: 'readonly', isId: true },
      { key: 'store_id', label: 'Store ID', type: 'number', required: true },
      { key: 'target_month', label: 'Target Month', type: 'date', required: true },
      { key: 'sales_target', label: 'Sales Target', type: 'number', required: true, isCurrency: true },
    ]
  }
];

export const DataEditView: React.FC = () => {
  const { user } = useAuth();
  const [selectedTableId, setSelectedTableId] = useState<string>('customers');
  const [records, setRecords] = useState<any[]>([]);
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Multi-row Selection State
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string | number>>(new Set());

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Modals
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState<boolean>(false);
  const [deleteAllType, setDeleteAllType] = useState<'current_table' | 'all_tables'>('current_table');
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, any>>({});

  const activeTable = useMemo(() => {
    return TABLE_DEFINITIONS.find((t) => t.id === selectedTableId) || TABLE_DEFINITIONS[0];
  }, [selectedTableId]);

  const totalAllRecordsCount = useMemo(() => {
    return Object.values(tableCounts).reduce((sum, count) => sum + count, 0);
  }, [tableCounts]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Fetch record counts for all tables for the current authenticated user
  const fetchCounts = useCallback(async () => {
    if (!user) return;
    try {
      const counts: Record<string, number> = {};
      await Promise.all(
        TABLE_DEFINITIONS.map(async (tab) => {
          const { count, error } = await supabase
            .from(tab.tableName)
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', user.id);
          if (!error && count !== null) {
            counts[tab.id] = count;
          } else {
            counts[tab.id] = 0;
          }
        })
      );
      setTableCounts(counts);
    } catch (err) {
      console.error('Error fetching table counts:', err);
    }
  }, [user]);

  // Fetch active table records
  const fetchRecords = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setSelectedRowIds(new Set());
    try {
      let query = supabase
        .from(activeTable.tableName)
        .select('*')
        .eq('owner_id', user.id)
        .order('id', { ascending: true })
        .limit(2000);

      const { data, error } = await query;
      if (error) {
        throw error;
      }
      setRecords(data || []);
      setTableCounts((prev) => ({ ...prev, [activeTable.id]: (data || []).length }));
    } catch (err: any) {
      console.error('Error loading table data:', err);
      showNotification(`Failed to load ${activeTable.name}: ${err.message}`, 'error');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [user, activeTable]);

  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm('');
    setSortField(null);
    setSelectedRowIds(new Set());
    fetchRecords();
  }, [selectedTableId, fetchRecords]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Currency Formatter (Indian Rupee)
  const formatCurrency = (val: any) => {
    if (val === null || val === undefined || val === '') return '—';
    const num = Number(val);
    if (isNaN(num)) return val;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Filtered & Sorted records
  const filteredRecords = useMemo(() => {
    let result = [...records];

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(lower)
        )
      );
    }

    if (sortField) {
      result.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return result;
  }, [records, searchTerm, sortField, sortAsc]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Check if all visible rows on current page are selected
  const isAllPageSelected = useMemo(() => {
    if (paginatedRecords.length === 0) return false;
    return paginatedRecords.every((row) => selectedRowIds.has(row[activeTable.primaryKey]));
  }, [paginatedRecords, selectedRowIds, activeTable.primaryKey]);

  // Check if some (but not all) visible rows are selected
  const isSomePageSelected = useMemo(() => {
    if (paginatedRecords.length === 0) return false;
    const selectedCount = paginatedRecords.filter((row) => selectedRowIds.has(row[activeTable.primaryKey])).length;
    return selectedCount > 0 && selectedCount < paginatedRecords.length;
  }, [paginatedRecords, selectedRowIds, activeTable.primaryKey]);

  // Toggle single row selection
  const handleToggleRow = (id: string | number) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle select all on current page
  const handleToggleSelectPage = () => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (isAllPageSelected) {
        paginatedRecords.forEach((row) => next.delete(row[activeTable.primaryKey]));
      } else {
        paginatedRecords.forEach((row) => next.add(row[activeTable.primaryKey]));
      }
      return next;
    });
  };

  // Select all matching rows across the entire table
  const handleSelectAllFiltered = () => {
    const allIds = new Set(filteredRecords.map((r) => r[activeTable.primaryKey]));
    setSelectedRowIds(allIds);
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedRowIds(new Set());
  };

  const handleSort = (fieldKey: string) => {
    if (sortField === fieldKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(fieldKey);
      setSortAsc(true);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (record: any) => {
    setEditingRecord(record);
    const initialForm: Record<string, any> = {};
    activeTable.columns.forEach((col) => {
      initialForm[col.key] = record[col.key] ?? '';
    });
    setFormData(initialForm);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setIsAddModalOpen(true);
    const initialForm: Record<string, any> = {};
    activeTable.columns.forEach((col) => {
      if (col.type !== 'readonly') {
        initialForm[col.key] = '';
      }
    });
    setFormData(initialForm);
  };

  // Submit Save Record (Create or Update)
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      // Clean and cast payload
      const payload: Record<string, any> = {
        owner_id: user.id
      };

      activeTable.columns.forEach((col) => {
        if (col.type === 'readonly') return;
        const val = formData[col.key];
        if (val === '' || val === undefined) {
          payload[col.key] = null;
        } else if (col.type === 'number') {
          payload[col.key] = Number(val);
        } else if (col.options && typeof col.options[0]?.value === 'boolean') {
          payload[col.key] = val === 'true' || val === true;
        } else {
          payload[col.key] = val;
        }
      });

      if (editingRecord) {
        // UPDATE
        const pk = activeTable.primaryKey;
        const pkVal = editingRecord[pk];
        const { error } = await supabase
          .from(activeTable.tableName)
          .update(payload)
          .eq(pk, pkVal)
          .eq('owner_id', user.id);

        if (error) throw error;
        showNotification(`Record #${pkVal} updated successfully in ${activeTable.name}`);
        setEditingRecord(null);
      } else {
        // INSERT
        const { error } = await supabase
          .from(activeTable.tableName)
          .insert([payload]);

        if (error) throw error;
        showNotification(`New record added to ${activeTable.name}`);
        setIsAddModalOpen(false);
      }

      fetchRecords();
      fetchCounts();
    } catch (err: any) {
      console.error('Error saving record:', err);
      showNotification(`Failed to save record: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete Single Record
  const handleDeleteRecord = async () => {
    if (!user || deleteConfirmId === null) return;
    setSaving(true);
    try {
      const pk = activeTable.primaryKey;
      const { error } = await supabase
        .from(activeTable.tableName)
        .delete()
        .eq(pk, deleteConfirmId)
        .eq('owner_id', user.id);

      if (error) throw error;
      showNotification(`Record #${deleteConfirmId} deleted from ${activeTable.name}`);
      setSelectedRowIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteConfirmId);
        return next;
      });
      setDeleteConfirmId(null);
      fetchRecords();
      fetchCounts();
    } catch (err: any) {
      console.error('Error deleting record:', err);
      showNotification(`Failed to delete record: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Bulk Delete Multiple Selected Records
  const handleBulkDelete = async () => {
    if (!user || selectedRowIds.size === 0) return;
    setSaving(true);
    try {
      const pk = activeTable.primaryKey;
      const idsToDelete = Array.from(selectedRowIds);

      const { error } = await supabase
        .from(activeTable.tableName)
        .delete()
        .in(pk, idsToDelete)
        .eq('owner_id', user.id);

      if (error) throw error;
      showNotification(`Successfully deleted ${idsToDelete.length} records from ${activeTable.name}`);
      setSelectedRowIds(new Set());
      setIsBulkDeleteModalOpen(false);
      fetchRecords();
      fetchCounts();
    } catch (err: any) {
      console.error('Error in bulk delete:', err);
      showNotification(`Bulk delete failed: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // WIPE OUT / DELETE ALL DETAILS (Per Table or Entire Account)
  const handleDeleteAllDetails = async () => {
    if (!user) return;
    if (deleteAllConfirmText !== 'DELETE ALL') {
      showNotification('Please type "DELETE ALL" exactly to confirm deletion.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (deleteAllType === 'current_table') {
        // Delete all rows in current table for this user
        const { error } = await supabase
          .from(activeTable.tableName)
          .delete()
          .eq('owner_id', user.id);

        if (error) throw error;
        showNotification(`All records from ${activeTable.name} have been completely deleted.`);
      } else {
        // Delete in foreign-key dependency order (children first, parents last)
        const deleteOrder = [
          'sales_items',
          'sales_transactions',
          'store_targets',
          'customers',
          'products',
          'product_categories',
          'demographics',
          'stores'
        ];

        for (const tbl of deleteOrder) {
          const { error } = await supabase
            .from(tbl)
            .delete()
            .eq('owner_id', user.id);

          if (error) {
            console.warn(`Error deleting from ${tbl}:`, error.message);
          }
        }

        showNotification('All database details across all tables have been purged.');
      }

      setIsDeleteAllModalOpen(false);
      setDeleteAllConfirmText('');
      setSelectedRowIds(new Set());
      fetchRecords();
      fetchCounts();
    } catch (err: any) {
      console.error('Error deleting all details:', err);
      showNotification(`Failed to delete details: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-medium transition-all ${
            notification.type === 'success'
              ? 'bg-[#2D6A4F] text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 hover:opacity-75 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-[#E3E9E4] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-2 rounded-lg bg-[#EAF3ED] text-[#2D6A4F]">
              <FileEdit className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-[#17231D]">Data Management & Editor</h1>
          </div>
          <p className="text-sm text-[#647067]">
            Directly browse, filter, edit, insert, multi-select, and delete records across all database tables. All modifications are bound to your user account.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              fetchRecords();
              fetchCounts();
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-[#1E4836] bg-[#F5F7F5] hover:bg-[#EAF3ED] rounded-xl border border-[#E3E9E4] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2D6A4F] hover:bg-[#1E4836] rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add {activeTable.name.slice(0, -1)}
          </button>

          <button
            onClick={() => {
              setDeleteAllType('current_table');
              setDeleteAllConfirmText('');
              setIsDeleteAllModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-colors"
            title="Delete all records from current table or reset account data"
          >
            <Flame className="w-4 h-4 text-red-600" />
            Delete All
          </button>
        </div>
      </div>

      {/* Table Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {TABLE_DEFINITIONS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = tab.id === selectedTableId;
          const count = tableCounts[tab.id] ?? 0;

          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTableId(tab.id)}
              className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left ${
                isSelected
                  ? 'bg-white border-[#2D6A4F] shadow-sm ring-1 ring-[#2D6A4F]'
                  : 'bg-white border-[#E3E9E4] hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span
                  className={`p-1.5 rounded-lg ${
                    isSelected ? 'bg-[#2D6A4F] text-white' : 'bg-[#EAF3ED] text-[#2D6A4F]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-[#EAF3ED] text-[#2D6A4F]'
                      : 'bg-gray-100 text-[#647067]'
                  }`}
                >
                  {count}
                </span>
              </div>
              <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-[#1E4836]' : 'text-[#17231D]'}`}>
                {tab.name}
              </span>
              <span className="text-[10px] text-[#647067] truncate w-full mt-0.5">
                {tab.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-[#E3E9E4] shadow-sm overflow-hidden">
        {/* Toolbar: Search, Filters & Bulk Action Bar */}
        <div className="p-4 border-b border-[#E3E9E4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search in ${activeTable.name.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-[#F5F7F5] border border-[#E3E9E4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#2D6A4F] focus:border-[#2D6A4F]"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-[#647067]">
              Showing <span className="font-semibold text-[#17231D]">{filteredRecords.length}</span> records
            </div>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-[#F5F7F5] border border-[#E3E9E4] rounded-lg text-[#17231D] focus:outline-none"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>

        {/* Floating Bulk Action Bar when rows are selected */}
        {selectedRowIds.size > 0 && (
          <div className="bg-[#EAF3ED] border-b border-[#2D6A4F]/20 px-4 py-2.5 flex items-center justify-between gap-3 text-xs animate-fade-in">
            <div className="flex items-center gap-2 text-[#1E4836] font-semibold">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#2D6A4F] text-white text-[11px]">
                {selectedRowIds.size}
              </span>
              <span>{selectedRowIds.size === 1 ? '1 row selected' : `${selectedRowIds.size} rows selected`}</span>
              
              {selectedRowIds.size < filteredRecords.length && (
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="ml-2 text-[#2D6A4F] hover:underline font-medium cursor-pointer"
                >
                  Select all {filteredRecords.length} matching rows
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-3 py-1.5 rounded-lg border border-[#2D6A4F]/30 text-[#1E4836] hover:bg-white/80 transition-colors font-medium"
              >
                Clear selection
              </button>
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-semibold shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Selected ({selectedRowIds.size})
              </button>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F5F7F5] border-b border-[#E3E9E4] text-xs font-semibold text-[#647067] uppercase tracking-wider">
              <tr>
                {/* Select All Checkbox Header */}
                <th className="w-10 px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectPage}
                    className="flex items-center justify-center text-[#647067] hover:text-[#2D6A4F] transition-colors"
                    title={isAllPageSelected ? 'Deselect all on this page' : 'Select all on this page'}
                  >
                    {isAllPageSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#2D6A4F]" />
                    ) : isSomePageSelected ? (
                      <MinusSquare className="w-4 h-4 text-[#2D6A4F]" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </th>

                {activeTable.columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-3 cursor-pointer hover:text-[#17231D] select-none transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.label}</span>
                      {sortField === col.key && (
                        <span className="text-[#2D6A4F] font-bold">
                          {sortAsc ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E9E4]">
              {loading ? (
                <tr>
                  <td colSpan={activeTable.columns.length + 2} className="py-16 text-center text-[#647067]">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-[#2D6A4F]" />
                      <span>Loading records...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={activeTable.columns.length + 2} className="py-16 text-center">
                    <Database className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-[#17231D]">No records found</p>
                    <p className="text-xs text-[#647067] mt-1">
                      {searchTerm ? 'Try adjusting your search query' : `Click "Add ${activeTable.name.slice(0, -1)}" to create your first entry`}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((row, index) => {
                  const pkVal = row[activeTable.primaryKey];
                  const isSelected = selectedRowIds.has(pkVal);

                  return (
                    <tr
                      key={pkVal || index}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-[#EAF3ED]/60 hover:bg-[#EAF3ED]'
                          : 'hover:bg-gray-50/70'
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="w-10 px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleRow(pkVal)}
                          className="flex items-center justify-center text-[#647067] hover:text-[#2D6A4F] transition-colors"
                          title={isSelected ? 'Deselect row' : 'Select row'}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#2D6A4F]" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-300 hover:text-gray-500" />
                          )}
                        </button>
                      </td>

                      {activeTable.columns.map((col) => {
                        const cellVal = row[col.key];
                        return (
                          <td key={col.key} className="px-4 py-3 text-[#17231D] whitespace-nowrap">
                            {col.isCurrency ? (
                              <span className="font-medium text-[#1E4836]">{formatCurrency(cellVal)}</span>
                            ) : col.isId ? (
                              <span className="font-mono text-xs font-semibold bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                                #{cellVal}
                              </span>
                            ) : typeof cellVal === 'boolean' ? (
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                  cellVal ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {cellVal ? 'Active' : 'Inactive'}
                              </span>
                            ) : cellVal !== null && cellVal !== undefined && cellVal !== '' ? (
                              String(cellVal)
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(row)}
                            className="p-1.5 rounded-lg text-[#647067] hover:text-[#2D6A4F] hover:bg-[#EAF3ED] transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(pkVal)}
                            className="p-1.5 rounded-lg text-[#647067] hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#E3E9E4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#647067]">
          <div className="flex items-center gap-3">
            <div>
              Page <span className="font-semibold text-[#17231D]">{currentPage}</span> of{' '}
              <span className="font-semibold text-[#17231D]">{totalPages}</span>
            </div>
            {selectedRowIds.size > 0 && (
              <span className="text-[#2D6A4F] font-semibold">
                ({selectedRowIds.size} selected)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#E3E9E4] hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-[#17231D]">{currentPage}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#E3E9E4] hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone: Purge All Details Box */}
      <div className="bg-red-50/50 rounded-2xl border border-red-200/80 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-red-100 text-red-600 shrink-0 mt-0.5">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-950">Danger Zone: Purge All Records</h3>
            <p className="text-xs text-red-800/80 mt-0.5 max-w-2xl leading-relaxed">
              Completely delete either all {tableCounts[activeTable.id] ?? 0} records from the active <strong className="font-semibold">{activeTable.name}</strong> table, or wipe out all {totalAllRecordsCount} details across all 8 tables associated with your account.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setDeleteAllType('current_table');
            setDeleteAllConfirmText('');
            setIsDeleteAllModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Trash2 className="w-4 h-4" />
          Purge All Details
        </button>
      </div>

      {/* Add / Edit Record Modal */}
      {(isAddModalOpen || editingRecord) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-[#E3E9E4] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-[#E3E9E4] flex items-center justify-between bg-[#F5F7F5]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-[#EAF3ED] text-[#2D6A4F]">
                  {editingRecord ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#17231D]">
                    {editingRecord ? `Edit ${activeTable.name.slice(0, -1)} (#${editingRecord[activeTable.primaryKey]})` : `New ${activeTable.name.slice(0, -1)}`}
                  </h3>
                  <p className="text-xs text-[#647067]">
                    {editingRecord ? 'Update table columns' : 'Fill in the fields to create a new entry'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingRecord(null);
                  setIsAddModalOpen(false);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeTable.columns
                  .filter((c) => c.type !== 'readonly')
                  .map((col) => (
                    <div key={col.key} className={col.type === 'text' && !col.options ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-semibold text-[#17231D] mb-1.5">
                        {col.label} {col.required && <span className="text-red-500">*</span>}
                      </label>
                      {col.type === 'select' ? (
                        <select
                          required={col.required}
                          value={formData[col.key] !== undefined ? String(formData[col.key]) : ''}
                          onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                          className="w-full px-3 py-2 text-sm bg-[#F5F7F5] border border-[#E3E9E4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#2D6A4F] focus:border-[#2D6A4F]"
                        >
                          <option value="">Select an option</option>
                          {col.options?.map((opt) => (
                            <option key={String(opt.value)} value={String(opt.value)}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                          step={col.type === 'number' ? 'any' : undefined}
                          required={col.required}
                          value={formData[col.key] ?? ''}
                          onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                          placeholder={`Enter ${col.label.toLowerCase()}`}
                          className="w-full px-3 py-2 text-sm bg-[#F5F7F5] border border-[#E3E9E4] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#2D6A4F] focus:border-[#2D6A4F]"
                        />
                      )}
                    </div>
                  ))}
              </div>

              <div className="p-3 bg-[#EAF3ED]/60 rounded-xl border border-[#2D6A4F]/20 text-xs text-[#1E4836] flex items-center gap-2 mt-4">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#2D6A4F]" />
                <span>
                  Record will automatically be bound to your account (<code className="font-mono font-semibold">owner_id</code>).
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E3E9E4]">
                <button
                  type="button"
                  onClick={() => {
                    setEditingRecord(null);
                    setIsAddModalOpen(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-[#647067] hover:text-[#17231D] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-medium text-white bg-[#2D6A4F] hover:bg-[#1E4836] rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingRecord ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-[#E3E9E4] p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#17231D] mb-1">Delete Record</h3>
            <p className="text-xs text-[#647067] mb-6">
              Are you sure you want to delete record #{deleteConfirmId} from <strong className="text-[#17231D]">{activeTable.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-medium text-[#647067] hover:text-[#17231D] border border-[#E3E9E4] rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRecord}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E3E9E4] p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#17231D] mb-1">Delete Selected Records</h3>
            <p className="text-xs text-[#647067] mb-6">
              Are you sure you want to delete <strong className="text-red-600 font-semibold">{selectedRowIds.size}</strong> selected records from <strong className="text-[#17231D]">{activeTable.name}</strong>? This will permanently remove them from your database.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-[#647067] hover:text-[#17231D] border border-[#E3E9E4] rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={saving}
                className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? 'Deleting...' : `Yes, Delete (${selectedRowIds.size})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete ALL Details Modal (Purge) */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-red-200 p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#17231D] text-center mb-1">Purge Database Details</h3>
            <p className="text-xs text-[#647067] text-center mb-5">
              Choose the scope of data you wish to delete. This operation cannot be reversed.
            </p>

            {/* Scope Selector */}
            <div className="space-y-2 mb-4">
              <label
                onClick={() => setDeleteAllType('current_table')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  deleteAllType === 'current_table'
                    ? 'border-red-500 bg-red-50/50 ring-1 ring-red-500'
                    : 'border-[#E3E9E4] hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="deleteScope"
                  checked={deleteAllType === 'current_table'}
                  onChange={() => setDeleteAllType('current_table')}
                  className="mt-0.5 text-red-600 focus:ring-red-500"
                />
                <div className="text-left">
                  <div className="text-xs font-bold text-[#17231D]">
                    Delete all from {activeTable.name} ({tableCounts[activeTable.id] ?? 0} records)
                  </div>
                  <div className="text-[11px] text-[#647067] mt-0.5">
                    Deletes all rows only inside the currently active <strong className="font-semibold">{activeTable.name}</strong> table.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setDeleteAllType('all_tables')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  deleteAllType === 'all_tables'
                    ? 'border-red-500 bg-red-50/50 ring-1 ring-red-500'
                    : 'border-[#E3E9E4] hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="deleteScope"
                  checked={deleteAllType === 'all_tables'}
                  onChange={() => setDeleteAllType('all_tables')}
                  className="mt-0.5 text-red-600 focus:ring-red-500"
                />
                <div className="text-left">
                  <div className="text-xs font-bold text-red-950 flex items-center gap-1.5">
                    <span>Delete ALL tables & records ({totalAllRecordsCount} total)</span>
                  </div>
                  <div className="text-[11px] text-[#647067] mt-0.5">
                    Wipes all stores, customers, products, categories, transactions, and demographics for your account.
                  </div>
                </div>
              </label>
            </div>

            {/* Type to confirm box */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-[#17231D] mb-1.5 text-left">
                Type <span className="font-mono text-red-600 font-bold">DELETE ALL</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteAllConfirmText}
                onChange={(e) => setDeleteAllConfirmText(e.target.value)}
                placeholder="DELETE ALL"
                className="w-full px-3 py-2 text-sm bg-[#F5F7F5] border border-[#E3E9E4] rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-center font-mono font-semibold"
              />
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteAllModalOpen(false);
                  setDeleteAllConfirmText('');
                }}
                className="px-4 py-2 text-xs font-medium text-[#647067] hover:text-[#17231D] border border-[#E3E9E4] rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAllDetails}
                disabled={saving || deleteAllConfirmText !== 'DELETE ALL'}
                className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              >
                {saving ? 'Purging...' : 'Purge Details'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataEditView;
