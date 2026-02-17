import { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import { useDataSourceStore } from '../store/dataSourceStore';

interface DataTableProps {
  datasourceId?: string;
  tableId?: string;
  rowsPerPage?: number;
  enableCreate?: boolean;
  enableEdit?: boolean;
  enableDelete?: boolean;
  visibleColumns?: string; // Comma-separated list of field names
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  shadow?: string;
  borderRadius?: number;
}

export const DataTable = ({ 
  datasourceId, tableId, rowsPerPage = 5, enableCreate = true, enableEdit = true, enableDelete = true, visibleColumns,
  marginTop = 0, marginBottom = 0, marginLeft = 0, marginRight = 0, shadow = 'sm', borderRadius = 12
}: DataTableProps) => {
  const { sources, getTable } = useDataSourceStore();
  
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSource = sources.find(s => s.id === datasourceId);
  const tableData = datasourceId && tableId ? getTable(datasourceId, tableId) : null;

  useEffect(() => {
    const fetchData = async () => {
      if (!activeSource?.config || !tableData) return;
      
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:4003/api/datasources/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            config: activeSource.config,
            table: {
                name: tableData.name,
                schema: tableData.schema || 'public'
            },
            limit: rowsPerPage 
          })
        });
        const data = await res.json();
        if (data.success) {
          setRows(data.rows);
        } else {
          setError(data.message || 'Failed to fetch data');
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Network error connecting to BFF");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [datasourceId, tableId, rowsPerPage, activeSource?.config]);

  const displayFields = (tableData?.fields || []).filter(f => {
    if (visibleColumns) {
      return visibleColumns.split(',').map(s => s.trim()).includes(f.name);
    }
    return f.isSelected !== false; 
  });

  return (
    <div
      className="w-full overflow-hidden bg-white transition-all"
      style={{
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
        marginRight: `${marginRight}px`,
        boxShadow: shadow === 'none' ? 'none' : shadow,
        borderRadius: `${borderRadius}px`,
      }}
    >
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Database size={16} />
            </div>
            <div>
                <h3 className="font-bold text-sm text-gray-900">{tableData?.name || 'Select a Data Source'}</h3>
                <p className="text-xs text-gray-500">{datasourceId ? `${datasourceId} / ${tableData?.fields.length || 0} cols` : 'No source connected'}</p>
            </div>
        </div>
        {enableCreate && (
             <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20">
                + New Record
             </button>
        )}
      </div>
      
      <div className="overflow-x-auto">
        {tableData ? (
            <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/50 text-xs uppercase font-semibold text-gray-500">
                    <tr>
                        {displayFields.map((field) => (
                            <th key={field.name} className="px-6 py-3 whitespace-nowrap">{field.label}</th>
                        ))}
                        {(enableEdit || enableDelete) && <th className="px-6 py-3 text-right">Actions</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {loading ? (
                        [1, 2, 3].map((i) => (
                            <tr key={i}>
                                {displayFields.map((field) => (
                                    <td key={field.name} className="px-6 py-4">
                                        <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4"></div>
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : rows.length > 0 ? (
                        rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                {displayFields.map((field) => (
                                    <td key={field.name} className="px-6 py-4 text-sm text-gray-700">
                                        {String(row[field.name] ?? '')}
                                    </td>
                                ))}
                                {(enableEdit || enableDelete) && (
                                    <td className="px-6 py-4 text-right space-x-2">
                                        {enableEdit && <button className="text-blue-500 hover:text-blue-700 text-xs font-bold uppercase">Edit</button>}
                                        {enableDelete && <button className="text-red-500 hover:text-red-700 text-xs font-bold uppercase">Del</button>}
                                    </td>
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={displayFields.length + 1} className="px-6 py-12 text-center text-gray-400 italic">
                                {error || 'No records found in this table'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        ) : (
            <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400 gap-2">
                <Database size={32} className="opacity-20" />
                <p className="text-sm font-medium">Connect a Data Source in Settings</p>
            </div>
        )}
      </div>
      
      <div className="p-3 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center gap-2">
             <span>Rows per page:</span>
             <select className="bg-white border-gray-200 rounded text-xs py-0.5" defaultValue={rowsPerPage}>
                 <option>5</option>
                 <option>10</option>
                 <option>25</option>
             </select>
        </div>
        <div className="flex gap-1">
            <button className="px-2 py-1 rounded hover:bg-gray-200" disabled>&lt;</button>
            <button className="px-2 py-1 rounded hover:bg-gray-200">&gt;</button>
        </div>
      </div>
    </div>
  );
};
