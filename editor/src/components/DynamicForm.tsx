import { useState, useEffect } from 'react';
import { useDataSourceStore, type DataField } from '../store/dataSourceStore';
import { ChevronDown, Loader2 } from 'lucide-react';

interface DynamicFormProps {
  dataSourceId: string;
  tableId: string;
  onSubmit: (data: any) => void;
  className?: string;
  columns?: number;
}

export const DynamicForm = ({ dataSourceId, tableId, onSubmit, className, columns = 1 }: DynamicFormProps) => {
  const { getTable, sources } = useDataSourceStore();
  const table = getTable(dataSourceId, tableId);
  const source = sources.find(s => s.id === dataSourceId);
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [fkOptions, setFkOptions] = useState<Record<string, any[]>>({});
  const [loadingFks, setLoadingFks] = useState<Record<string, boolean>>({});

  // Initialize form state
  useEffect(() => {
    if (table) {
        const initial: Record<string, any> = {};
        table.fields.forEach(f => {
             // Basic default values
             if (f.type === 'boolean') initial[f.name] = false;
             else initial[f.name] = '';
        });
        setFormData(initial);
    }
  }, [table]);

  // Fetch Foreign Key Options
  useEffect(() => {
    if (!table || !source?.config) return;

    table.fields.forEach(async (field) => {
        if (field.foreignKey) {
            console.log(`[DynamicForm] Fetching options for FK field: ${field.name}`, field.foreignKey);
            setLoadingFks(prev => ({ ...prev, [field.name]: true }));
            try {
                // Fetch all rows from the referenced table
                // Note: In production, we should have a dedicated lookup endpoint
                console.log(`[DynamicForm] Querying table: ${field.foreignKey.table}`);
                const res = await fetch('http://localhost:4003/api/datasources/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        config: source.config, 
                        table: {
                            schema: field.foreignKey.schema,
                            name: field.foreignKey.table
                        },
                        limit: 100 
                    })
                });
                const data = await res.json();
                console.log(`[DynamicForm] Options for ${field.name}:`, data);
                if (data.success) {
                    setFkOptions(prev => ({ ...prev, [field.name]: data.rows }));
                }
            } catch (e) {
                console.error(`Failed to fetch options for ${field.name}`, e);
            } finally {
                setLoadingFks(prev => ({ ...prev, [field.name]: false }));
            }
        } else {
             console.log(`[DynamicForm] Field ${field.name} is not an FK`, field);
        }
    });
  }, [table, source]);

  if (!table) return <div className="p-4 text-red-500">Table not found</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderInput = (field: DataField) => {
    // 1. Foreign Key Dropdown
    if (field.foreignKey) {
        const options = fkOptions[field.name] || [];
        const isLoading = loadingFks[field.name];
        
        // Try to find a display column (name, title, label, or first string col)
        // This is a heuristic until we have "Display Column" metadata
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _displayCol = field.foreignKey.column; // Fallback to the ID column itself
        // Better heuristic:
        const sampleRow = options[0];
        const labelCol = sampleRow ? Object.keys(sampleRow).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('title')) || field.foreignKey.column : field.foreignKey.column;

        return (
            <div className="relative">
                <select
                    value={formData[field.name] || ''}
                    onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={isLoading}
                >
                    <option value="">Select {field.label}...</option>
                    {options.map((row: any, idx) => (
                         // Assuming the FK matches the column logic (usually ID)
                        <option key={idx} value={row[field.foreignKey!.column]}>
                             {row[labelCol]} (ID: {row[field.foreignKey!.column]})
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ChevronDown size={16} />}
                </div>
            </div>
        );
    }

    // 2. Standard Inputs
    switch (field.type) {
        case 'boolean':
            return (
                <input 
                    type="checkbox"
                    checked={formData[field.name] || false}
                    onChange={e => setFormData({ ...formData, [field.name]: e.target.checked })}
                    className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
            );
        case 'date':
            return (
                <input 
                    type="date"
                    value={formData[field.name] || ''}
                    onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            );
        case 'number':
        case 'currency':
            return (
                <input 
                    type="number"
                    value={formData[field.name] || ''}
                    onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            );
        case 'enum':
            return (
                <div className="relative">
                    <select
                        value={formData[field.name] || ''}
                        onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">Select {field.label}...</option>
                        {field.options?.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown size={16} />
                    </div>
                </div>
            );
        default:
             return (
                <input 
                    type="text"
                    value={formData[field.name] || ''}
                    onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            );
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {table.fields.filter(f => f.isSelected !== false).map(field => (
                <div key={field.name} className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {field.label} {field.foreignKey && <span className="text-blue-500 mx-1">(FK)</span>}
                    </label>
                    {renderInput(field)}
                </div>
            ))}
        </div>
        
        <button 
            type="submit"
            className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg font-bold uppercase tracking-wide hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
        >
            Submit
        </button>
    </form>
  );
};
