import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DataField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'currency' | 'enum';
  label: string;
  isSelected?: boolean;
  options?: string[]; // For enum fields
  foreignKey?: {
    schema?: string;
    table: string;
    column: string;
  };
}

export interface DataTrigger {
  event: 'ON_INSERT' | 'ON_UPDATE' | 'ON_DELETE';
  label: string;
}

export interface DataTable {
  id: string;
  name: string;
  schema?: string;
  isSelected?: boolean;
  fields: DataField[];
  triggers: DataTrigger[];
}

export interface DataSourceConfig {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  authMethod?: 'regular' | 'ssl' | 'ssh';
  savePassword?: 'no' | 'always' | 'session';
  ssl?: boolean;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'sql' | 'nosql' | 'csv' | 'sheets' | 'crm' | 'erp' | 'custom';
  config?: DataSourceConfig;
  tables: DataTable[];
}

interface DataSourceStore {
  sources: DataSource[];
  addSource: (source: DataSource) => void;
  updateSource: (id: string, updates: Partial<DataSource>) => void;
  deleteSource: (id: string) => void;
  toggleTableSelection: (sourceId: string, tableId: string) => void;
  toggleFieldSelection: (sourceId: string, tableId: string, fieldName: string) => void;
  toggleAllFields: (sourceId: string, tableId: string, isSelected: boolean) => void;
  getTable: (sourceId: string, tableId: string) => DataTable | undefined;
  updateSourceConfig: (sourceId: string, config: Partial<DataSourceConfig>) => void;
}

// MOCK DATA
const MOCK_SOURCES: DataSource[] = [
  {
    id: 'pg_prod',
    name: 'Production DB (PostgreSQL)',
    type: 'sql',
    tables: [
      {
        id: 'users',
        name: 'users',
        triggers: [
          { event: 'ON_INSERT', label: 'User Registered' },
          { event: 'ON_UPDATE', label: 'User Updated' },
          { event: 'ON_DELETE', label: 'User Deleted' }
        ],
        fields: [
          { name: 'id', type: 'string', label: 'uuid' },
          { name: 'email', type: 'email', label: 'email' },
          { name: 'full_name', type: 'string', label: 'full_name' },
          { name: 'created_at', type: 'date', label: 'created_at' },
          { name: 'is_active', type: 'boolean', label: 'is_active' }
        ]
      },
      {
        id: 'orders',
        name: 'orders',
        triggers: [
          { event: 'ON_INSERT', label: 'Order Placed' },
          { event: 'ON_UPDATE', label: 'Order Status Update' }
        ],
        fields: [
          { name: 'id', type: 'string', label: 'order_id' },
          { name: 'user_id', type: 'string', label: 'user_id' },
          { name: 'total_amount', type: 'currency', label: 'total_amount' },
          { name: 'status', type: 'string', label: 'status' }
        ]
      }
    ]
  },
  {
    id: 'legacy_mysql',
    name: 'Legacy MySQL',
    type: 'sql',
    tables: [
      {
        id: 'products',
        name: 'products',
        triggers: [],
        fields: [
          { name: 'sku', type: 'string', label: 'sku' },
          { name: 'name', type: 'string', label: 'product_name' },
          { name: 'inventory_count', type: 'number', label: 'inventory_count' }
        ]
      }
    ]
  }
];

export const useDataSourceStore = create(
  persist<DataSourceStore>(
    (set, get) => ({
      sources: MOCK_SOURCES,
      addSource: (source) => set((state) => ({ sources: [...state.sources, source] })),
      updateSource: (id, updates) =>
        set((state) => ({
          sources: state.sources.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),
      deleteSource: (id) =>
        set((state) => ({ sources: state.sources.filter((s) => s.id !== id) })),
      toggleTableSelection: (sourceId, tableId) =>
        set((state) => ({
          sources: state.sources.map(s => s.id === sourceId ? {
            ...s,
            tables: s.tables.map(t => t.id === tableId ? { ...t, isSelected: !t.isSelected } : t)
          } : s)
        })),
      toggleFieldSelection: (sourceId, tableId, fieldName) =>
        set((state) => ({
          sources: state.sources.map(s => s.id === sourceId ? {
            ...s,
            tables: s.tables.map(t => t.id === tableId ? {
              ...t,
              fields: t.fields.map(f => f.name === fieldName ? { ...f, isSelected: !f.isSelected } : f)
            } : t)
          } : s)
        })),
      toggleAllFields: (sourceId, tableId, isSelected) =>
        set((state) => ({
          sources: state.sources.map(s => s.id === sourceId ? {
            ...s,
            tables: s.tables.map(t => t.id === tableId ? {
              ...t,
              isSelected: isSelected, // If selecting all fields, we usually want the table selected too
              fields: t.fields.map(f => ({ ...f, isSelected }))
            } : t)
          } : s)
        })),
      getTable: (sourceId, tableId) => {
        const source = get().sources.find(s => s.id === sourceId);
        return source?.tables.find(t => t.id === tableId);
      },
      updateSourceConfig: (sourceId, config) =>
        set((state) => ({
          sources: state.sources.map(s => s.id === sourceId ? {
            ...s,
            config: { ...s.config, ...config },
            tables: [] // Reset tables when config (like database) changes to force a rescan
          } : s)
        })),
    }),
    {
      name: 'dn-style-datasources',
    }
  )
);
