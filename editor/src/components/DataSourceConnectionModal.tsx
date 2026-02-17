import { useState } from 'react';
import { X, Save, Play, Server, Database, Shield, Lock, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import { useDataSourceStore, type DataSource } from '../store/dataSourceStore';

interface DataSourceConnectionModalProps {
  onClose: () => void;
  onSave: (config: DataSource, openExplorer?: boolean) => void;
  initialData?: DataSource | null;
}

export const DataSourceConnectionModal = ({ onClose, onSave, initialData }: DataSourceConnectionModalProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [formData, setFormData] = useState({
    name: initialData?.name || 'PostgreSQL:5432',
    type: initialData?.type === 'sql' ? 'PostgreSQL' : 'PostgreSQL', // Simplified for now
    host: initialData?.config?.host || '',
    port: initialData?.config?.port?.toString() || '5432',
    authMethod: 'Regular',
    defaultLogin: initialData?.config?.username || '',
    savePassword: 'No, request every time',
    password: initialData?.config?.password || '',
    database: initialData?.config?.database || 'postgres'
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTestConnection = async () => {
    try {
        const res = await fetch('http://localhost:4003/api/datasources/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: {
                host: formData.host,
                port: parseInt(formData.port),
                username: formData.defaultLogin,
                password: formData.password,
                database: formData.database,
                ssl: false // TODO: Add UI support
            }})
        });
        const data = await res.json();
        if (data.success) {
            alert('Connection Successful!');
        } else {
            alert('Connection Failed: ' + data.message);
        }
    } catch (e) {
        alert('Error connecting to backend');
    }
  };

  const handleSave = () => {
    const newSource: DataSource = {
      id: initialData?.id || `ds_${Date.now()}`,
      name: formData.name,
      type: 'sql',
      config: {
        host: formData.host,
        port: parseInt(formData.port),
        username: formData.defaultLogin,
        password: formData.password,
        database: formData.database
      },
      tables: initialData?.tables || [] 
    };
    
    if (initialData) {
        useDataSourceStore.getState().updateSource(initialData.id, newSource);
    } else {
        useDataSourceStore.getState().addSource(newSource);
    }
    
    onSave(newSource, true);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 backdrop-blur-md bg-slate-950/80 animate-in fade-in duration-200 font-sans">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center border border-blue-200">
                  <Database className="text-blue-600" size={20} />
              </div>
              <div>
                  <h2 className="text-lg font-bold text-slate-800">Database Connection Parameters</h2>
                  <p className="text-xs text-slate-500">Configure your data source connection details.</p>
              </div>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={24} />
           </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[75vh] space-y-8">
            
            {/* Row 1: Logical Name & Type */}
            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        Logical Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        Database Type
                    </label>
                    <div className="relative">
                        <select 
                            value={formData.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        >
                            <option>PostgreSQL</option>
                            <option>MySQL</option>
                            <option>Microsoft SQL Server</option>
                            <option>Oracle</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Row 2: Host & Port */}
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-8 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        Hostname or IP <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Server size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="e.g. 192.168.1.10 or db.example.com"
                            value={formData.host}
                            onChange={(e) => handleChange('host', e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>
                <div className="col-span-4 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        Port <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        value={formData.port}
                        onChange={(e) => handleChange('port', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Row 3: Authentication */}
            <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        Authentication Method
                    </label>
                    <div className="relative">
                        <select 
                            value={formData.authMethod}
                            onChange={(e) => handleChange('authMethod', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        >
                            <option>Regular</option>
                            <option>SSH Tunnel</option>
                            <option>SSL Certificate</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        Default Login <span className="text-red-500">*</span>
                    </label>
                     <div className="relative">
                        <Shield size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            value={formData.defaultLogin}
                            onChange={(e) => handleChange('defaultLogin', e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Row 4: Password */}
             <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        Save Password
                    </label>
                    <div className="relative">
                        <select 
                            value={formData.savePassword}
                            onChange={(e) => handleChange('savePassword', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        >
                            <option>No, request every time</option>
                            <option>For this session only</option>
                            <option>Save permanently</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        Password
                    </label>
                     <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type={showPassword ? "text" : "password"} 
                            value={formData.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Row 5: Database */}
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    Database
                </label>
                <input 
                    type="text" 
                    value={formData.database}
                    onChange={(e) => handleChange('database', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
            </div>

            {/* Advanced Section */}
            <div className="border-t border-slate-200 pt-4">
                 <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-xs uppercase tracking-wide transition-colors"
                >
                    {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    Advanced Parameters
                 </button>
                 
                 {showAdvanced && (
                     <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-600">
                         Advanced connection string parameters can be configured here.
                     </div>
                 )}
            </div>

        </div>

        {/* Footer */}
        <div className="h-20 bg-slate-50 border-t border-slate-200 px-8 flex items-center justify-between shrink-0">
             <button 
                onClick={handleTestConnection}
                className="px-6 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center gap-2"
            >
                <Play size={14} /> Test
             </button>

             <div className="flex gap-4">
                 <button onClick={onClose} className="px-6 py-2.5 text-slate-500 font-bold text-xs uppercase tracking-wider hover:text-slate-700 transition-colors">
                    Cancel
                 </button>
                 <button 
                    onClick={handleSave}
                    className="px-8 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:bg-blue-500 hover:shadow-blue-500/30 transition-all flex items-center gap-2"
                >
                    <Save size={16} /> Save Connection
                 </button>
             </div>
        </div>
      </div>
    </div>
  );
};
