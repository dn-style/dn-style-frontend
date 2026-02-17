import { useState, useMemo, useEffect } from 'react';
import { Search, Database, ChevronRight, ChevronDown, Check, X, Filter, Table as TableIcon, Columns } from 'lucide-react';
import { useDataSourceStore, type DataSource, type DataTable, type DataField } from '../store/dataSourceStore';

interface DataSourceObjectExplorerProps {
  onClose: () => void;
}

export const DataSourceObjectExplorer = ({ onClose }: DataSourceObjectExplorerProps) => {
  const { sources } = useDataSourceStore();
  
  // For demo purposes, we'll focus on the first SQL source or just the first source
  const activeSource = sources.find(s => s.type === 'sql') || sources[0];
  const updateSource = useDataSourceStore(state => state.updateSource);
  const toggleTableSelection = useDataSourceStore(state => state.toggleTableSelection);
  const toggleFieldSelection = useDataSourceStore(state => state.toggleFieldSelection);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSchemas, setExpandedSchemas] = useState<Record<string, boolean>>({ 'auth': true, 'public': true, 'system': false });
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [availableDatabases, setAvailableDatabases] = useState<string[]>([]);
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);

  const toggleAllFields = useDataSourceStore(state => state.toggleAllFields);
  const updateSourceConfig = useDataSourceStore(state => state.updateSourceConfig);
  const deleteSource = useDataSourceStore(state => state.deleteSource);

  // Fetch available databases on mount
  useEffect(() => {
    const fetchDatabases = async () => {
        if (!activeSource?.config) return;
        setIsLoadingDatabases(true);
        try {
            const res = await fetch('http://localhost:4003/api/datasources/databases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config: activeSource.config })
            });
            const data = await res.json();
            if (data.success) {
                setAvailableDatabases(data.databases);
            }
        } catch (e) {
            console.error("Failed to fetch databases", e);
        } finally {
            setIsLoadingDatabases(false);
        }
    };
    fetchDatabases();
  }, [activeSource?.config?.host]); // Refetch if host changes

  const fetchSchema = async () => {
    if (!activeSource?.config) return; 
    
    try {
        const res = await fetch('http://localhost:4003/api/datasources/schema', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: activeSource.config })
        });
        const data = await res.json();
        
        if (data.success && data.tables) {
            updateSource(activeSource.id, { tables: data.tables });
        }
    } catch (e) {
        console.error("Failed to fetch schema", e);
    }
  };

  // Initial Fetch if empty
  useEffect(() => {
    if (activeSource && activeSource.tables.length === 0) {
        fetchSchema();
    }
  }, [activeSource?.id]);

  // Group tables by schema
  const schemaMap = useMemo(() => {
    if (!activeSource) return {};
    const groups: Record<string, DataTable[]> = {};
    activeSource.tables.forEach(table => {
        const schema = table.schema || 'public';
        if (!groups[schema]) groups[schema] = [];
        groups[schema].push(table);
    });
    return groups;
  }, [activeSource]);

  const toggleSchema = (schema: string) => {
    setExpandedSchemas(prev => ({ ...prev, [schema]: !prev[schema] }));
  };

  const toggleTable = (tableId: string) => {
    setExpandedTables(prev => ({ ...prev, [tableId]: !prev[tableId] }));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 backdrop-blur-md bg-slate-950/90 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl flex overflow-hidden border border-slate-200 font-sans">
        
        {/* LEFT SIDEBAR - FILTERS */}
        <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col p-6 gap-6">
            <div>
                <h3 className="text-xl font-bold text-slate-800">Object Explorer</h3>
                <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full w-fit">
                    <Check size={14} className="stroke-[3]" />
                    <span className="text-xs font-bold uppercase tracking-wide">Connected</span>
                </div>
            </div>

            <div className="space-y-4">
                <button 
                  onClick={fetchSchema}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg shadow-lg shadow-blue-500/20 font-bold text-sm hover:bg-blue-700 transition-colors uppercase tracking-wide"
                >
                    Refresh Schema
                </button>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Active Database</label>
                    <div className="relative">
                        <Database size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select 
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                            value={activeSource?.config?.database || ''}
                            onChange={(e) => {
                                updateSourceConfig(activeSource!.id, { database: e.target.value });
                            }}
                        >
                            {isLoadingDatabases ? (
                                <option>Loading databases...</option>
                            ) : (
                                availableDatabases.map(db => (
                                    <option key={db} value={db}>{db}</option>
                                ))
                            )}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Find Objects..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-200">
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Filters</span>
                     
                     <div className="flex items-center gap-3 text-slate-600">
                         <div className="w-4 h-4 border-2 border-slate-300 rounded bg-white"></div>
                         <span className="text-sm font-medium">Show System Objects</span>
                     </div>
                     <div className="flex items-center gap-3 text-slate-600">
                         <div className="w-4 h-4 border-2 border-slate-300 rounded bg-blue-600 border-blue-600 flex items-center justify-center">
                             <Check size={10} className="text-white" />
                         </div>
                         <span className="text-sm font-medium">Selected Objects Only</span>
                     </div>
                </div>
            </div>

            <div className="mt-auto space-y-2">
                 <button className="w-full py-2 text-slate-500 font-bold text-sm uppercase tracking-wide hover:text-blue-600" onClick={onClose}>
                    Close
                 </button>
                 <button className="w-full bg-slate-800 text-white py-2.5 rounded-lg font-bold text-sm uppercase tracking-wide shadow-xl hover:bg-slate-700 transition-colors">
                    Save Changes
                 </button>
            </div>
        </div>

        {/* MAIN CONTENT - HIERARCHY TREE */}
        <div className="flex-1 flex flex-col bg-white">
            {/* Header */}
            <div className="h-16 border-b border-slate-200 flex items-center justify-between px-8 bg-slate-50/50">
                <div className="flex items-center gap-4 text-slate-500 text-sm font-medium">
                    <span className="flex items-center gap-2">
                        <Database size={16} /> {activeSource?.name}
                    </span>
                    <ChevronRight size={14} />
                    <span>Object Selection</span>
                </div>
                
                <div className="flex gap-2">
                    <button className="px-4 py-1.5 bg-white border border-slate-200 rounded shadow-sm text-xs font-bold text-slate-600 uppercase tracking-wide hover:bg-slate-50">
                        Select Multiple
                    </button>
                </div>
            </div>

            {/* Tree View */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <div className="col-span-6 pl-4">Object</div>
                        <div className="col-span-2">Object Type</div>
                        <div className="col-span-2">Column Type</div>
                        <div className="col-span-2">Constraints</div>
                    </div>

                    {/* Schemas */}
                    {Object.keys(schemaMap).map(schema => (
                        <div key={schema} className="bg-white">
                            {/* Schema Row */}
                            <div 
                                className="grid grid-cols-12 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 items-center group"
                                onClick={() => toggleSchema(schema)}
                            >
                                <div className="col-span-6 flex items-center gap-3">
                                    <div className="w-5 h-5 flex items-center justify-center text-slate-400 group-hover:text-slate-600">
                                        {expandedSchemas[schema] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </div>
                                    <div className="w-4 h-4 border border-slate-300 rounded flex items-center justify-center text-blue-600 bg-blue-50">
                                         {/* Indeterminate or checked logic here */}
                                         <div className="w-2 h-2 bg-blue-600 rounded-[1px]"></div>
                                    </div>
                                    <Database size={16} className="text-amber-500" />
                                    <span className="font-bold text-slate-700 text-sm">{schema}</span>
                                </div>
                                <div className="col-span-2 text-xs text-slate-400 font-medium">Schema</div>
                                <div className="col-span-4"></div>
                            </div>

                            {/* Tables in Schema */}
                            {expandedSchemas[schema] && schemaMap[schema].map(table => (
                                <div key={table.id}>
                                    <div 
                                        className="grid grid-cols-12 p-3 pl-12 hover:bg-slate-50 cursor-pointer border-b border-slate-100 items-center group"
                                        onClick={(e) => { e.stopPropagation(); toggleTable(table.id); }}
                                    >
                                        <div className="col-span-6 flex items-center gap-3">
                                             <div className="w-5 h-5 flex items-center justify-center text-slate-400 group-hover:text-slate-600">
                                                {expandedTables[table.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            </div>
                                            <div 
                                                className={`w-4 h-4 border border-slate-300 rounded flex items-center justify-center cursor-pointer transition-colors ${table.isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white hover:border-blue-400'}`}
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    toggleAllFields(activeSource?.id || '', table.id, !table.isSelected);
                                                }}
                                            >
                                                {table.isSelected && <Check size={12} className="text-white" />}
                                            </div>
                                            <TableIcon size={16} className="text-blue-500" />
                                            <span className="font-medium text-slate-700 text-sm">{table.name}</span>
                                        </div>
                                        <div className="col-span-2 text-xs text-slate-400">Table</div>
                                        <div className="col-span-4 flex items-center gap-2">
                                            {table.triggers.length > 0 && (
                                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold uppercase">{table.triggers.length} Triggers</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Columns in Table */}
                                    {expandedTables[table.id] && table.fields.map(field => (
                                        <div key={field.name} className="grid grid-cols-12 p-2 pl-24 hover:bg-blue-50/30 border-b border-slate-50 items-center">
                                            <div className="col-span-6 flex items-center gap-3">
                                                <div className="w-5"></div> {/* Spacer for arrow */}
                                                <div 
                                                    className={`w-4 h-4 border border-slate-300 rounded flex items-center justify-center cursor-pointer transition-colors ${field.isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white hover:border-blue-400'}`}
                                                    onClick={(e) => { e.stopPropagation(); toggleFieldSelection(activeSource!.id, table.id, field.name); }}
                                                >
                                                    {field.isSelected && <Check size={12} className="text-white" />}
                                                </div>
                                                <Columns size={14} className="text-slate-400" />
                                                <span className="text-slate-600 text-sm">{field.name}</span>
                                            </div>
                                            <div className="col-span-2"></div>
                                            <div className="col-span-2 text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded w-fit">
                                                {field.type}
                                            </div>
                                            <div className="col-span-2 text-xs text-slate-400 truncate">
                                                {JSON.stringify(field.isSelected ? 'Nullable' : 'PK')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Footer Status */}
            <div className="h-8 bg-slate-50 border-t border-slate-200 px-4 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>{activeSource?.tables.length || 0} Tables Found</span>
                <span>Page 1 of 1</span>
            </div>
        </div>
      </div>
    </div>
  );
};
