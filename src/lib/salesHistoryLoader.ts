import { supabase } from './supabase';

export interface SalesRecordPayload {
  date: string;
  sku_id: string;
  category: string;
  observed_sales: number;
  in_stock: number;
  price: number;
  promo_flag: number;
  unit_cost?: number;
  transaction_count?: number;
  store_cluster?: string;
}

export interface UserSalesHistoryResult {
  totalTxCount: number;
  distinctDays: number;
  history: SalesRecordPayload[];
  availableSkus: string[];
  availableCategories: string[];
  skuBasePrices: Record<string, number>;
}

export async function fetchUserSalesHistory(userId: string): Promise<UserSalesHistoryResult> {
  if (!userId) {
    return {
      totalTxCount: 0,
      distinctDays: 0,
      history: [],
      availableSkus: [],
      availableCategories: [],
      skuBasePrices: {},
    };
  }

  // 1. Fetch sales transactions strictly for authenticated tenant
  const { data: txList, error: txErr } = await supabase
    .from('sales_transactions')
    .select('id, transaction_date, total_amount, sales_channel, status')
    .eq('owner_id', userId)
    .order('transaction_date', { ascending: true })
    .limit(10000);

  if (txErr || !txList || txList.length === 0) {
    return {
      totalTxCount: 0,
      distinctDays: 0,
      history: [],
      availableSkus: [],
      availableCategories: [],
      skuBasePrices: {},
    };
  }

  // 2. Concurrently fetch sales items, products, and categories (tenant-scoped)
  const [itemsRes, prodsRes, catRes] = await Promise.all([
    supabase
      .from('sales_items')
      .select('transaction_id, product_id, quantity, unit_price, discount_amount')
      .eq('owner_id', userId)
      .limit(10000),
    supabase
      .from('products')
      .select('id, product_code, product_name, category_id, unit_price, cost_price')
      .eq('owner_id', userId)
      .limit(2000),
    supabase
      .from('product_categories')
      .select('id, category_name')
      .eq('owner_id', userId)
      .limit(100),
  ]);

  const items = itemsRes.data || [];
  const prods = prodsRes.data || [];
  const cats = catRes.data || [];

  const catMap = new Map<string, string>();
  cats.forEach((c) => catMap.set(String(c.id), c.category_name));

  const prodMap = new Map<string, any>();
  prods.forEach((p) => {
    prodMap.set(String(p.id), p);
    if (p.product_code) {
      prodMap.set(String(p.product_code), p);
    }
  });

  const txDateMap = new Map<string, string>();
  txList.forEach((t) => {
    if (t.transaction_date) {
      txDateMap.set(String(t.id), String(t.transaction_date).slice(0, 10));
    }
  });

  const skuBasePrices: Record<string, number> = {};
  let rawRecords: SalesRecordPayload[] = [];
  let matchedItemCount = 0;

  if (items.length > 0) {
    // Aggregation per (date, sku_id) from sales_items
    const aggMap = new Map<
      string,
      {
        date: string;
        sku_id: string;
        category: string;
        total_qty: number;
        total_rev: number;
        total_cost: number;
        tx_count: number;
        has_promo: boolean;
      }
    >();

    items.forEach((item) => {
      const date = txDateMap.get(String(item.transaction_id));
      if (!date) return;
      matchedItemCount++;

      const product = prodMap.get(String(item.product_id));
      const sku_id = product?.product_code || (item.product_id ? String(item.product_id) : `ITEM-${item.transaction_id}`);
      const category = (product?.category_id && catMap.get(String(product.category_id))) || product?.product_name || 'General Merchandise';
      const key = `${date}___${sku_id}`;

      const qty = Number(item.quantity) || 1;
      const price = Number(item.unit_price) || (product ? Number(product.unit_price) : 50);
      const cost = product?.cost_price ? Number(product.cost_price) : price * 0.5;
      const hasDiscount = (Number(item.discount_amount) || 0) > 0;

      const existing = aggMap.get(key);
      if (existing) {
        existing.total_qty += qty;
        existing.total_rev += qty * price;
        existing.total_cost += qty * cost;
        existing.tx_count += 1;
        if (hasDiscount) existing.has_promo = true;
      } else {
        aggMap.set(key, {
          date,
          sku_id,
          category,
          total_qty: qty,
          total_rev: qty * price,
          total_cost: qty * cost,
          tx_count: 1,
          has_promo: hasDiscount,
        });
      }
    });

    if (matchedItemCount > 0) {
      rawRecords = Array.from(aggMap.values()).map((r) => {
        const avgPrice = r.total_qty > 0 ? Number((r.total_rev / r.total_qty).toFixed(2)) : 50;
        skuBasePrices[r.sku_id] = avgPrice;
        return {
          date: r.date,
          sku_id: r.sku_id,
          category: r.category,
          observed_sales: Math.round(r.total_qty),
          in_stock: 1,
          price: avgPrice,
          unit_cost: r.total_qty > 0 ? Number((r.total_cost / r.total_qty).toFixed(2)) : 25,
          promo_flag: r.has_promo ? 1 : 0,
          transaction_count: r.tx_count,
          store_cluster: 'Tier-1',
        };
      });
    }
  }

  // Fallback: aggregate transactions by channel & date if no items or items didn't match
  if (rawRecords.length === 0) {
    const aggMap = new Map<
      string,
      {
        date: string;
        sku_id: string;
        category: string;
        total_amount: number;
        tx_count: number;
      }
    >();

    txList.forEach((tx) => {
      if (!tx.transaction_date) return;
      const date = String(tx.transaction_date).slice(0, 10);
      const channel = tx.sales_channel || 'Direct';
      const sku_id = `${channel.replace(/\s+/g, '_')}`;
      const category = `${channel} Sales`;
      const key = `${date}___${sku_id}`;

      const amount = Number(tx.total_amount) || 0;
      const existing = aggMap.get(key);
      if (existing) {
        existing.total_amount += amount;
        existing.tx_count += 1;
      } else {
        aggMap.set(key, {
          date,
          sku_id,
          category,
          total_amount: amount,
          tx_count: 1,
        });
      }
    });

    rawRecords = Array.from(aggMap.values()).map((r) => {
      const avgPrice = r.tx_count > 0 ? Number((r.total_amount / r.tx_count).toFixed(2)) : 100;
      skuBasePrices[r.sku_id] = avgPrice;
      return {
        date: r.date,
        sku_id: r.sku_id,
        category: r.category,
        observed_sales: r.tx_count, // Observed daily order frequency
        in_stock: 1,
        price: avgPrice,
        unit_cost: Number((avgPrice * 0.5).toFixed(2)),
        promo_flag: 0,
        transaction_count: r.tx_count,
        store_cluster: 'Tier-1',
      };
    });
  }

  // Count distinct dates
  const allDates = new Set<string>();
  rawRecords.forEach((r) => allDates.add(r.date));

  const availableSkus = Array.from(new Set(rawRecords.map((r) => r.sku_id)));
  const availableCategories = Array.from(new Set(rawRecords.map((r) => r.category)));

  return {
    totalTxCount: txList.length,
    distinctDays: allDates.size,
    history: rawRecords,
    availableSkus,
    availableCategories,
    skuBasePrices,
  };
}
