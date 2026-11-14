import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart as PieChartIcon,
  BarChart3,
  Users,
  MapPin,
  IndianRupee,
  ArrowUpRight,
  Search,
  Download,
  RefreshCw,
  Sparkles,
  Briefcase,
  Calendar,
  Compass,
  Tag,
  Database,
  HeartHandshake,
  CheckCircle2,
  Award,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

// Color themes & tokens
const PURPLE_PALETTE = ['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#6D28D9'];

interface DemographicCohort {
  id: string;
  name: string;
  age_group: string;
  gender: string;
  income_group: string;
  education_level: string;
  occupation: string;
  region: string;
  customer_count: number;
  share_pct: number;
  total_spend: number;
  avg_order_value: number;
  order_count: number;
  preferred_channel: 'Online' | 'In-Store' | 'Mobile App';
  top_category: string;
  priority: 'High Growth' | 'Core Base' | 'High Value' | 'Prospect';
}

interface CategoryAffinityItem {
  id: string | number;
  name: string;
  description: string;
  index: number;
}

export const DemographicsView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State controls
  const [loading, setLoading] = useState<boolean>(true);
  const [userCustomerCount, setUserCustomerCount] = useState<number | null>(null);
  const [cohorts, setCohorts] = useState<DemographicCohort[]>([]);
  const [categoryAffinities, setCategoryAffinities] = useState<CategoryAffinityItem[]>([]);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Filters
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('all');
  const [selectedIncomeGroup, setSelectedIncomeGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  // 1. Fetch live tenant demographic records strictly scoped by owner_id
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function loadTenantDemographics() {
      if (!user?.id) {
        if (isMounted) {
          setUserCustomerCount(0);
          setCohorts([]);
          setLoading(false);
        }
        return;
      }

      try {
        // Query customers, demographics, sales transactions, and product categories concurrently
        const [custRes, demoRes, txRes, catRes] = await Promise.all([
          supabase
            .from('customers')
            .select('id, customer_code, full_name, date_of_birth, gender, demographic_id, city, state, region, customer_segment')
            .eq('owner_id', user.id)
            .limit(10000),
          supabase
            .from('demographics')
            .select('id, age_group, gender, income_group, education_level, occupation, marital_status')
            .eq('owner_id', user.id)
            .limit(1000),
          supabase
            .from('sales_transactions')
            .select('id, customer_id, total_amount, sales_channel')
            .eq('owner_id', user.id)
            .limit(10000),
          supabase
            .from('product_categories')
            .select('id, category_name, description')
            .eq('owner_id', user.id)
            .limit(20),
        ]);

        const customers = custRes.data || [];
        const demoProfiles = demoRes.data || [];
        const transactions = txRes.data || [];
        const categories = catRes.data || [];

        if (!isMounted) return;
        setUserCustomerCount(customers.length);

        if (categories.length > 0) {
          setCategoryAffinities(
            categories.map((cat: any, idx: number) => ({
              id: cat.id || idx,
              name: cat.category_name || `Category ${idx + 1}`,
              description: cat.description || 'Active catalog category',
              index: 100,
            }))
          );
        } else {
          setCategoryAffinities([]);
        }

        if (customers.length === 0) {
          setCohorts([]);
          setLoading(false);
          return;
        }

        // Build index lookup maps
        const demoMap = new Map<string, any>();
        demoProfiles.forEach((d) => demoMap.set(String(d.id), d));

        const codeToIdMap = new Map<string, string>();
        customers.forEach((c) => {
          if (c.customer_code) {
            codeToIdMap.set(String(c.customer_code).trim().toLowerCase(), String(c.id));
          }
        });

        // Group transactions by customer_id (string normalized, supports ID & code)
        const customerSpendMap = new Map<string, { spend: number; orders: number; channels: Record<string, number> }>();
        transactions.forEach((tx) => {
          const rawCid = String(tx.customer_id ?? '').trim();
          if (!rawCid) return;
          const resolvedId = codeToIdMap.get(rawCid.toLowerCase()) || rawCid;
          const curr = customerSpendMap.get(resolvedId) || { spend: 0, orders: 0, channels: {} };
          curr.spend += Number(tx.total_amount) || 0;
          curr.orders += 1;
          const ch = tx.sales_channel || 'Direct';
          curr.channels[ch] = (curr.channels[ch] || 0) + 1;
          customerSpendMap.set(resolvedId, curr);
        });

        // Group customers into meaningful demographic cohorts
        const groupMap = new Map<string, {
          age_group: string;
          gender: string;
          income_group: string;
          education_level: string;
          occupation: string;
          region: string;
          customers: number;
          total_spend: number;
          total_orders: number;
          channels: Record<string, number>;
        }>();

        customers.forEach((c) => {
          const d = c.demographic_id ? demoMap.get(String(c.demographic_id)) : null;
          
          // Calculate age group if date_of_birth exists
          let ageGroup = d?.age_group || '25-34';
          if (!d?.age_group && c.date_of_birth) {
            const birthYear = new Date(c.date_of_birth).getFullYear();
            const age = new Date().getFullYear() - birthYear;
            if (age < 25) ageGroup = '18-24';
            else if (age <= 34) ageGroup = '25-34';
            else if (age <= 44) ageGroup = '35-44';
            else if (age <= 54) ageGroup = '45-54';
            else if (age <= 64) ageGroup = '55-64';
            else ageGroup = '65+';
          }

          const gender = c.gender || d?.gender || 'Undisclosed';
          const income = d?.income_group || '₹5L - ₹15L';
          const edu = d?.education_level || 'Graduate';
          const occ = d?.occupation || 'Professional';
          const reg = c.region || 'National';

          const groupKey = `${ageGroup}___${income}___${reg}`;
          const metrics = customerSpendMap.get(String(c.id)) || (c.customer_code ? customerSpendMap.get(String(c.customer_code).trim().toLowerCase()) : undefined) || { spend: 0, orders: 0, channels: {} };

          const existing = groupMap.get(groupKey);
          if (existing) {
            existing.customers += 1;
            existing.total_spend += metrics.spend;
            existing.total_orders += metrics.orders;
            Object.entries(metrics.channels).forEach(([ch, count]) => {
              existing.channels[ch] = (existing.channels[ch] || 0) + count;
            });
          } else {
            groupMap.set(groupKey, {
              age_group: ageGroup,
              gender: gender,
              income_group: income,
              education_level: edu,
              occupation: occ,
              region: reg,
              customers: 1,
              total_spend: metrics.spend,
              total_orders: metrics.orders,
              channels: { ...metrics.channels },
            });
          }
        });

        const totalCust = customers.length;
        const compiledCohorts: DemographicCohort[] = Array.from(groupMap.entries()).map(([, g], idx) => {
          let topChannel: 'Online' | 'In-Store' | 'Mobile App' = 'In-Store';
          let maxCount = 0;
          Object.entries(g.channels).forEach(([ch, count]) => {
            if (count > maxCount) {
              maxCount = count;
              topChannel = ch as any;
            }
          });

          const aov = g.total_orders > 0 ? Math.round(g.total_spend / g.total_orders) : 0;
          const share = Number(((g.customers / totalCust) * 100).toFixed(1));

          let priority: 'High Growth' | 'Core Base' | 'High Value' | 'Prospect' = 'Core Base';
          if (aov > 3000) priority = 'High Value';
          else if (g.age_group === '18-24' || g.age_group === '25-34') priority = 'High Growth';
          else if (g.total_orders === 0) priority = 'Prospect';

          return {
            id: `COHORT-${idx + 1}`,
            name: `${g.region} ${g.age_group} (${g.occupation})`,
            age_group: g.age_group,
            gender: g.gender,
            income_group: g.income_group,
            education_level: g.education_level,
            occupation: g.occupation,
            region: g.region,
            customer_count: g.customers,
            share_pct: share,
            total_spend: g.total_spend,
            avg_order_value: aov,
            order_count: g.total_orders,
            preferred_channel: topChannel,
            top_category: 'Catalog General',
            priority,
          };
        });

        // Sort cohorts by customer count descending
        compiledCohorts.sort((a, b) => b.customer_count - a.customer_count);
        setCohorts(compiledCohorts);
      } catch (err) {
        console.error('Error loading demographic data', err);
        if (isMounted) setCohorts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTenantDemographics();
    return () => {
      isMounted = false;
    };
  }, [user, reloadKey]);

  // Active dataset: Live data
  const activeCohorts = useMemo(() => {
    if (userCustomerCount && userCustomerCount > 0) return cohorts;
    return [];
  }, [userCustomerCount, cohorts]);

  // Filtered cohorts based on user controls
  const filteredCohorts = useMemo(() => {
    return activeCohorts.filter((c) => {
      const matchRegion = selectedRegion === 'all' || c.region.toLowerCase() === selectedRegion.toLowerCase();
      const matchAge = selectedAgeGroup === 'all' || c.age_group === selectedAgeGroup;
      const matchIncome = selectedIncomeGroup === 'all' || c.income_group.includes(selectedIncomeGroup);
      const matchSearch =
        searchQuery === '' ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.occupation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.region.toLowerCase().includes(searchQuery.toLowerCase());

      return matchRegion && matchAge && matchIncome && matchSearch;
    });
  }, [activeCohorts, selectedRegion, selectedAgeGroup, selectedIncomeGroup, searchQuery]);

  // Executive KPI summary computations
  const totalAudience = useMemo(() => {
    return activeCohorts.reduce((acc, c) => acc + c.customer_count, 0);
  }, [activeCohorts]);

  const dominantAgeCohort = useMemo(() => {
    if (activeCohorts.length === 0) return { label: 'None', share: 0 };
    const ageMap = new Map<string, number>();
    activeCohorts.forEach((c) => {
      ageMap.set(c.age_group, (ageMap.get(c.age_group) || 0) + c.customer_count);
    });
    let topAge = '25-34';
    let max = 0;
    ageMap.forEach((count, age) => {
      if (count > max) {
        max = count;
        topAge = age;
      }
    });
    const share = totalAudience > 0 ? Math.round((max / totalAudience) * 100) : 0;
    return { label: topAge, share };
  }, [activeCohorts, totalAudience]);

  const topEarningTier = useMemo(() => {
    if (activeCohorts.length === 0) return { label: 'None', aov: 0 };
    const sortedByAov = [...activeCohorts].sort((a, b) => b.avg_order_value - a.avg_order_value);
    const top = sortedByAov[0];
    return { label: top?.income_group || '₹15L - ₹30L', aov: top?.avg_order_value || 0 };
  }, [activeCohorts]);

  const topRegionCluster = useMemo(() => {
    if (activeCohorts.length === 0) return { label: 'None', share: 0 };
    const regMap = new Map<string, number>();
    activeCohorts.forEach((c) => {
      regMap.set(c.region, (regMap.get(c.region) || 0) + c.customer_count);
    });
    let topReg = 'South';
    let max = 0;
    regMap.forEach((count, r) => {
      if (count > max) {
        max = count;
        topReg = r;
      }
    });
    const share = totalAudience > 0 ? Math.round((max / totalAudience) * 100) : 0;
    return { label: topReg, share };
  }, [activeCohorts, totalAudience]);

  // Chart data: Age Bracket Distribution
  const ageDistributionData = useMemo(() => {
    const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
    return ageGroups.map((age) => {
      const match = activeCohorts.filter((c) => c.age_group === age);
      const count = match.reduce((sum, c) => sum + c.customer_count, 0);
      const spend = match.reduce((sum, c) => sum + c.total_spend, 0);
      return {
        age,
        customers: count,
        spend: Math.round(spend / 1000), // In thousands ₹
      };
    });
  }, [activeCohorts]);

  // Chart data: Income Tiers
  const incomePieData = useMemo(() => {
    const incomeGroups = ['< ₹5L', '₹5L - ₹15L', '₹15L - ₹30L', '> ₹30L'];
    return incomeGroups.map((inc, i) => {
      const match = activeCohorts.filter((c) => c.income_group.includes(inc.split(' ')[0]));
      const count = match.reduce((sum, c) => sum + c.customer_count, 0);
      return {
        name: inc,
        value: count,
        color: PURPLE_PALETTE[i % PURPLE_PALETTE.length],
      };
    }).filter((d) => d.value > 0);
  }, [activeCohorts]);

  // Chart data: Regional Revenue Distribution
  const regionBarData = useMemo(() => {
    const regions = ['North', 'South', 'East', 'West'];
    return regions.map((reg) => {
      const match = activeCohorts.filter((c) => c.region.toLowerCase() === reg.toLowerCase());
      const revenue = match.reduce((sum, c) => sum + c.total_spend, 0);
      const orders = match.reduce((sum, c) => sum + c.order_count, 0);
      const aov = orders > 0 ? Math.round(revenue / orders) : 0;
      return {
        region: reg,
        revenue: Math.round(revenue / 1000), // in ₹k
        aov,
      };
    });
  }, [activeCohorts]);

  // Pagination for Cohorts Table
  const totalPages = Math.ceil(filteredCohorts.length / itemsPerPage) || 1;
  const paginatedCohorts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCohorts.slice(start, start + itemsPerPage);
  }, [filteredCohorts, currentPage]);

  // CSV Export
  const exportDemographicsCSV = () => {
    if (filteredCohorts.length === 0) return;
    const headers = ['Cohort Name', 'Age Group', 'Income Tier', 'Region', 'Occupation', 'Customers', 'Share %', 'Total Spend (₹)', 'AOV (₹)', 'Preferred Channel'];
    const rows = filteredCohorts.map((c) => [
      c.name,
      c.age_group,
      c.income_group,
      c.region,
      c.occupation,
      c.customer_count,
      c.share_pct,
      c.total_spend,
      c.avg_order_value,
      c.preferred_channel,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `demographics_segmentation_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // -------------------------------------------------------------
  // Zero-Data State Guardrail
  // -------------------------------------------------------------
  if (userCustomerCount === 0) {
    return (
      <div className="space-y-6" id="demographics-tab">
        {/* Top Header Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 text-[11px] font-bold uppercase tracking-wider mb-1">
            <PieChartIcon className="w-3.5 h-3.5 text-purple-600" />
            Demographic Research Domain
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Demographic Segmentation</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Analyze customer populations based on age brackets, geographic territories, and socio-economic variables.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 space-y-1.5">
              <h4 className="font-bold text-purple-900 text-sm">Age Brackets</h4>
              <p className="text-xs text-purple-800/80">Young adults, working professionals, and families.</p>
            </div>
            <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 space-y-1.5">
              <h4 className="font-bold text-purple-900 text-sm">Geographic Clusters</h4>
              <p className="text-xs text-purple-800/80">Urban centers, suburban areas, and regional zones.</p>
            </div>
            <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 space-y-1.5">
              <h4 className="font-bold text-purple-900 text-sm">Preference Affinity</h4>
              <p className="text-xs text-purple-800/80">Category preferences mapped against demographic profiles.</p>
            </div>
          </div>
        </div>

        {/* Empty State Action Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-xs space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <Users className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-black text-slate-900">No Demographic Records Found</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Your account ({user?.email || 'Active User'}) has not uploaded any customer demographic profiles yet. Upload customers with birth dates, locations, or demographic income tiers to generate population insights.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/dashboard/import')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Database className="w-4 h-4" />
              Import Demographics & Customers
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Full Demographic Segmentation Dashboard
  // -------------------------------------------------------------
  return (
    <div className="space-y-6" id="demographics-tab">
      {/* Hero Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 text-[11px] font-bold uppercase tracking-wider">
                <PieChartIcon className="w-3.5 h-3.5 text-purple-600" />
                Demographic Research Domain
              </div>
              {userCustomerCount && userCustomerCount > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                  <Database className="w-3 h-3 text-[#2d6a4f]" />
                  Live Tenant Population ({userCustomerCount} Customers)
                </div>
              )}
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Demographic Segmentation</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Analyze customer populations based on age brackets, geographic territories, and socio-economic variables.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={exportDemographicsCSV}
              disabled={filteredCohorts.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Cohorts CSV
            </button>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs sm:text-sm font-semibold transition disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* 3 Pillar Concept Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 space-y-1.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-700" />
              <h4 className="font-bold text-purple-900 text-sm">Age Brackets</h4>
            </div>
            <p className="text-xs text-purple-800/80">Young adults, working professionals, and families.</p>
          </div>
          <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 space-y-1.5">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-700" />
              <h4 className="font-bold text-purple-900 text-sm">Geographic Clusters</h4>
            </div>
            <p className="text-xs text-purple-800/80">Urban centers, suburban areas, and regional zones.</p>
          </div>
          <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 space-y-1.5">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-purple-700" />
              <h4 className="font-bold text-purple-900 text-sm">Preference Affinity</h4>
            </div>
            <p className="text-xs text-purple-800/80">Category preferences mapped against demographic profiles.</p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Region Filter */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-purple-600" />
              <span>Region:</span>
              <select
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="all">All Regions</option>
                <option value="North">North Region</option>
                <option value="South">South Region</option>
                <option value="East">East Region</option>
                <option value="West">West Region</option>
              </select>
            </div>

            {/* Age Filter */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              <span>Age Group:</span>
              <select
                value={selectedAgeGroup}
                onChange={(e) => {
                  setSelectedAgeGroup(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="all">All Age Groups</option>
                <option value="18-24">18-24 (Gen Z)</option>
                <option value="25-34">25-34 (Young Pros)</option>
                <option value="35-44">35-44 (Families)</option>
                <option value="45-54">45-54 (Peak Earners)</option>
                <option value="55-64">55-64 (Mature)</option>
              </select>
            </div>

            {/* Income Filter */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <IndianRupee className="w-3.5 h-3.5 text-purple-600" />
              <span>Income:</span>
              <select
                value={selectedIncomeGroup}
                onChange={(e) => {
                  setSelectedIncomeGroup(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="all">All Income Brackets</option>
                <option value="< ₹5L">&lt; ₹5L Entry</option>
                <option value="₹5L - ₹15L">₹5L - ₹15L Middle</option>
                <option value="₹15L - ₹30L">₹15L - ₹30L Upper</option>
                <option value="> ₹30L">&gt; ₹30L Affluent</option>
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search cohort or occupation..."
              className="w-full pl-9 pr-3 py-1.5 bg-white text-xs rounded-lg border border-slate-200 font-medium focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* 4 Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Demographic Audience */}
          <div className="p-4 rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Demographic Population</span>
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{totalAudience.toLocaleString('en-IN')}</div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Indexed across {activeCohorts.length} demographic cohorts
            </p>
          </div>

          {/* Dominant Age Bracket */}
          <div className="p-4 rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dominant Age Bracket</span>
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{dominantAgeCohort.label}</div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-indigo-600" />
              Accounts for <strong>{dominantAgeCohort.share}%</strong> of customer volume
            </p>
          </div>

          {/* Top Earning Bracket & AOV */}
          <div className="p-4 rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Highest LTV Bracket</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-[#2d6a4f]">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">₹{topEarningTier.aov.toLocaleString('en-IN')}</div>
            <p className="text-[11px] text-slate-500">
              Avg order value in <strong>{topEarningTier.label}</strong>
            </p>
          </div>

          {/* Geographic Core */}
          <div className="p-4 rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Top Regional Cluster</span>
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{topRegionCluster.label}</div>
            <p className="text-[11px] text-slate-500">
              Concentrates <strong>{topRegionCluster.share}%</strong> of active shoppers
            </p>
          </div>
        </div>

        {/* Visual Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Chart 1: Age Cohort Volume & Revenue */}
          <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  Age Cohort Volume & Spend
                </h3>
                <p className="text-xs text-slate-500">Customer counts vs. cumulative spend (₹ Thousands)</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageDistributionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="age" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    formatter={(val: any, name: string) => [
                      name === 'spend' ? `₹${val}k` : val,
                      name === 'spend' ? 'Spend' : 'Customers',
                    ]}
                    contentStyle={{ borderRadius: '0.75rem', borderColor: '#E2E8F0', fontSize: '12px' }}
                  />
                  <Bar dataKey="customers" name="customers" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spend" name="spend" fill="#C4B5FD" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Income Bracket Split */}
          <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <PieChartIcon className="w-4 h-4 text-purple-600" />
                  Socio-Economic Income Distribution
                </h3>
                <p className="text-xs text-slate-500">Audience share by declared or estimated income bracket</p>
              </div>
            </div>
            <div className="h-64 flex items-center justify-center">
              {incomePieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {incomePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`${value} customers`, 'Volume']}
                      contentStyle={{ borderRadius: '0.75rem', borderColor: '#E2E8F0', fontSize: '12px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400">No income tier data mapped.</div>
              )}
            </div>
          </div>

          {/* Chart 3: Regional Revenue & AOV */}
          <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  Regional Revenue & AOV
                </h3>
                <p className="text-xs text-slate-500">Total revenue generated vs. Average Order Value (₹)</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionBarData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="region" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    formatter={(val: any, name: string) => [
                      name === 'revenue' ? `₹${val}k` : `₹${val}`,
                      name === 'revenue' ? 'Revenue' : 'Average Order Value',
                    ]}
                    contentStyle={{ borderRadius: '0.75rem', borderColor: '#E2E8F0', fontSize: '12px' }}
                  />
                  <Bar dataKey="revenue" name="revenue" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="aov" name="aov" fill="#A78BFA" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Preference Affinity Matrix */}
          <div className="p-5 rounded-2xl border border-slate-200/90 bg-white space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-purple-600" />
                Category Preference Affinity Index
              </h3>
              <p className="text-xs text-slate-500">Normalized category purchase affinity by demographic bracket</p>
            </div>
            <div className="space-y-3 pt-2">
              {categoryAffinities.length > 0 ? (
                categoryAffinities.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500">{item.description}</div>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold">
                      {item.index} Index
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No category preference affinities recorded. Import product categories and sales records to calculate affinity metrics.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Demographic Directory & Breakdown Table */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-600" />
                Demographic Cohorts Directory ({filteredCohorts.length})
              </h3>
              <p className="text-xs text-slate-500">Detailed breakdown across age, occupation, region, and order metrics</p>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Showing {paginatedCohorts.length} of {filteredCohorts.length} cohorts
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Cohort Persona</th>
                  <th className="px-3 py-3">Age Group</th>
                  <th className="px-3 py-3">Income Bracket</th>
                  <th className="px-3 py-3">Region</th>
                  <th className="px-3 py-3 text-right">Population</th>
                  <th className="px-3 py-3 text-right">Share %</th>
                  <th className="px-3 py-3 text-right">Total Spend</th>
                  <th className="px-3 py-3 text-right">AOV</th>
                  <th className="px-3 py-3">Top Channel</th>
                  <th className="px-4 py-3 text-center">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCohorts.length > 0 ? (
                  paginatedCohorts.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-slate-400" />
                          {c.occupation}
                        </div>
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-700">{c.age_group}</td>
                      <td className="px-3 py-3 text-slate-600 font-medium">{c.income_group}</td>
                      <td className="px-3 py-3 font-semibold text-slate-700">{c.region}</td>
                      <td className="px-3 py-3 text-right font-bold text-slate-900">
                        {c.customer_count.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-purple-700">
                        {c.share_pct}%
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-slate-900">
                        ₹{c.total_spend.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-700">
                        ₹{c.avg_order_value.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {c.preferred_channel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.priority === 'High Value'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.priority === 'High Growth'
                              ? 'bg-purple-100 text-purple-800'
                              : c.priority === 'Core Base'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.priority}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                      No demographic cohorts match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actionable Demographic Strategies */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-700" />
            <h4 className="font-bold text-slate-900 text-sm">Strategic Demographic Playbook</h4>
          </div>
          {activeCohorts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
                <div className="font-bold text-purple-900">
                  {dominantAgeCohort.label !== 'None' ? `${dominantAgeCohort.label} Audience Acquisition` : 'Audience Acquisition'}
                </div>
                <p className="text-slate-500 leading-relaxed">
                  {dominantAgeCohort.label !== 'None'
                    ? `The ${dominantAgeCohort.label} age cohort represents ${dominantAgeCohort.share}% of your audience. Prioritize campaigns and messaging on their preferred channels.`
                    : 'Customer cohort analysis will appear as demographic profiles are mapped.'}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
                <div className="font-bold text-purple-900">
                  {topEarningTier.label !== 'None' ? `${topEarningTier.label} Premium Tier` : 'Revenue Optimization'}
                </div>
                <p className="text-slate-500 leading-relaxed">
                  {topEarningTier.label !== 'None'
                    ? `The ${topEarningTier.label} income bracket leads with ₹${topEarningTier.aov.toLocaleString('en-IN')} average order value. Target high-value bundles.`
                    : 'AOV tier analysis will populate once transactions are recorded.'}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
                <div className="font-bold text-purple-900">
                  {topRegionCluster.label !== 'None' ? `${topRegionCluster.label} Territory Consolidation` : 'Territory Strategy'}
                </div>
                <p className="text-slate-500 leading-relaxed">
                  {topRegionCluster.label !== 'None'
                    ? `${topRegionCluster.label} accounts for ${topRegionCluster.share}% of customer locations. Strengthen regional supply and store inventory.`
                    : 'Regional distribution maps to recorded customer locations.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
              No demographic cohorts available to generate strategic playbook insights.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
