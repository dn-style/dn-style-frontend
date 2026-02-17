import { useState } from 'react';
import { WorkflowEditor } from '../components/workflow/WorkflowEditor';
import { Settings, Database, Code, Package, ChevronLeft, ChevronRight, Activity, Plus, Search, Trash2, Edit2, ShieldCheck, Zap, Table as TableIcon } from 'lucide-react';
import { useActionStore, type SafeAction } from '../store/actionStore';
import { useDataSourceStore, type DataSource } from '../store/dataSourceStore';
import { DataSourceObjectExplorer } from '../components/DataSourceObjectExplorer';
import { DataSourceConnectionModal } from '../components/DataSourceConnectionModal';
import { useNotificationStore } from '../store/notificationStore';

export const ConfigPage = ({ onBack }: { onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState<'workflows' | 'actions' | 'sources' | 'preview' | 'dsl' | 'settings'>('settings');
  const { globalConfig, updateGlobalConfig } = useNotificationStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { actions, deleteAction, registerAction, updateAction } = useActionStore();
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isObjectExplorerOpen, setIsObjectExplorerOpen] = useState(false);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<DataSource | null>(null);
  const [editingAction, setEditingAction] = useState<Partial<SafeAction> | null>(null);

  const selectedAction = actions.find(a => a.id === selectedActionId);

  const handleSaveSource = (_source: DataSource, openExplorer?: boolean) => {
    setIsConnectionModalOpen(false);
    setEditingSource(null);
    if (openExplorer) {
        setIsObjectExplorerOpen(true);
    }
  };

  const handleSaveAction = () => {
    if (!editingAction?.name || !editingAction?.code) return;
    
    if (editingAction.id) {
        updateAction(editingAction.id, editingAction);
    } else {
        registerAction({
            name: editingAction.name,
            description: editingAction.description || '',
            icon: editingAction.icon || 'Package',
            inputs: editingAction.inputs || [],
            code: editingAction.code,
        });
    }
    setIsModalOpen(false);
    setEditingAction(null);
  };

  const openNewActionModal = () => {
    setEditingAction({ name: '', description: '', code: '// New secure logic\n', icon: 'Package', inputs: [] });
    setIsModalOpen(true);
  };

  const openEditActionModal = (action: SafeAction) => {
    setEditingAction(action);
    setIsModalOpen(true);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-900 overflow-hidden font-sans text-slate-200">
      
      {/* Object Explorer Modal */}
      {isObjectExplorerOpen && (
        <DataSourceObjectExplorer onClose={() => setIsObjectExplorerOpen(false)} />
      )}

      {/* Connection Paramters Modal */}
      {isConnectionModalOpen && (
        <DataSourceConnectionModal 
            onClose={() => {
                setIsConnectionModalOpen(false);
                setEditingSource(null);
            }} 
            onSave={handleSaveSource}
            initialData={editingSource} 
        />
      )}

      {/* Action Builder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/80 animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter text-white italic">Safe Action Builder</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Configure secure logic & interface</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                        <Trash2 size={24} className="rotate-45" />
                    </button>
                </div>

                <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-blue-500 tracking-widest">Action Name</label>
                            <input 
                                type="text" 
                                value={editingAction?.name || ''}
                                onChange={e => setEditingAction((curr: any) => ({ ...curr!, name: e.target.value }))}
                                className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-600 transition-all font-bold tracking-tight"
                                placeholder="e.g. Process Order"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-blue-500 tracking-widest">Technical Icon</label>
                            <select 
                                value={editingAction?.icon || 'Package'}
                                onChange={e => setEditingAction((curr: any) => ({ ...curr!, icon: e.target.value }))}
                                className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-600 transition-all font-bold tracking-tight"
                            >
                                <option value="Package">Standard Action</option>
                                <option value="Database">Data Query</option>
                                <option value="Zap">Real-time Trigger</option>
                                <option value="Calculator">Logic Processor</option>
                                <option value="Send">API Output</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-blue-500 tracking-widest">Description</label>
                        <input 
                            type="text" 
                            value={editingAction?.description || ''}
                            onChange={e => setEditingAction((curr: any) => ({ ...curr!, description: e.target.value }))}
                            className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-600 transition-all font-bold tracking-tight"
                            placeholder="Describe what this action does..."
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black uppercase text-blue-500 tracking-widest">Secure Logic Source (JS)</label>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[8px] font-black text-slate-500 uppercase">Sandbox Enabled</span>
                            </div>
                        </div>
                        <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 font-mono text-sm leading-relaxed shadow-inner">
                            <textarea 
                                value={editingAction?.code || ''}
                                onChange={e => setEditingAction((curr: any) => ({ ...curr!, code: e.target.value }))}
                                className="w-full bg-transparent border-none text-blue-400 focus:ring-0 p-0 h-40 resize-none"
                                placeholder="// Write your secure JS here... \n return input * 2;"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSaveAction}
                        className="px-8 py-2.5 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                    >
                        {editingAction?.id ? 'Guardar Cambios' : 'Registrar Acción'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Top Header */}
      <div className="h-14 bg-slate-800 border-b border-slate-700 px-6 flex items-center justify-between shrink-0 shadow-xl z-20">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold uppercase text-[10px] tracking-widest">Regresar</span>
          </button>
          
          <div className="h-6 w-[1px] bg-slate-700"></div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Settings size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-xs uppercase tracking-[0.2em] text-white">Configuración</h1>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Creator Mode \ Registry</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-700">
                <button 
                    onClick={() => setActiveTab('workflows')}
                    className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'workflows' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Workflows
                </button>
                <button 
                    onClick={() => setActiveTab('actions')}
                    className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'actions' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Registry
                </button>
            </div>
            <button className="bg-emerald-600 text-white px-5 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2">
                <Activity size={14} />
                Deploy
            </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Control Sidebar */}
        <div className={`bg-slate-800 border-r border-slate-700 flex flex-col transition-all duration-300 ease-in-out z-10 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
            <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-2">
                <SidebarItem 
                    icon={<Activity size={20} />} 
                    label="Workflows" 
                    active={activeTab === 'workflows'} 
                    onClick={() => setActiveTab('workflows')} 
                    open={sidebarOpen}
                />
                <SidebarItem 
                    icon={<Package size={20} />} 
                    label="Safe Actions" 
                    active={activeTab === 'actions'} 
                    onClick={() => setActiveTab('actions')} 
                    open={sidebarOpen}
                />
                <SidebarItem 
                    icon={<Database size={20} />} 
                    label="Data Sources" 
                    active={activeTab === 'sources'} 
                    onClick={() => setActiveTab('sources')} 
                    open={sidebarOpen}
                />
                <SidebarItem 
                    icon={<Code size={20} />} 
                    label="DSL Preview" 
                    active={activeTab === 'dsl'} 
                    onClick={() => setActiveTab('dsl')} 
                    open={sidebarOpen}
                />
                <SidebarItem 
                    icon={<Settings size={20} />} 
                    label="App Settings" 
                    active={activeTab === 'settings'} 
                    onClick={() => setActiveTab('settings')} 
                    open={sidebarOpen}
                />
            </div>
            
            <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-4 border-t border-slate-700 text-slate-500 hover:text-white transition-colors flex justify-center"
            >
                {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex">
            {activeTab === 'workflows' ? (
                <div className="w-full h-full">
                    <WorkflowEditor />
                </div>
            ) : activeTab === 'actions' ? (
                <div className="flex-1 flex overflow-hidden">
                    {/* Actions List */}
                    <div className="w-80 border-r border-slate-800 bg-slate-900/50 overflow-y-auto p-6 flex flex-col gap-6 shrink-0">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-black uppercase tracking-widest text-white italic">Action Registry</h2>
                            <button 
                                onClick={openNewActionModal}
                                className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-md text-white transition-all shadow-lg shadow-blue-500/20"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Buscar acción..."
                                className="w-full bg-slate-800 border-none rounded-lg pl-9 pr-4 py-2 text-[11px] text-white focus:ring-1 focus:ring-blue-500 transition-all font-bold placeholder:text-slate-600"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            {actions.map((action) => (
                                <button
                                    key={action.id}
                                    onClick={() => setSelectedActionId(action.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl transition-all border-2 ${selectedActionId === action.id ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-slate-800/40 border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedActionId === action.id ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-500'}`}>
                                        <Package size={16} />
                                    </div>
                                    <div className="text-left overflow-hidden">
                                        <div className="text-[10px] font-black uppercase tracking-wider truncate">{action.name}</div>
                                        <div className="text-[8px] opacity-60 font-medium truncate w-40">{action.description}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action Editor / Preview */}
                    <div className="flex-1 overflow-y-auto p-12 bg-slate-950/40">
                        {selectedAction ? (
                            <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                                            <Package size={32} className="text-white" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-1">Safe Action Definition</div>
                                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">{selectedAction.name}</h2>
                                            <p className="text-slate-400 text-sm mt-1">{selectedAction.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => openEditActionModal(selectedAction)}
                                            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-all border border-slate-700 shadow-xl"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if(confirm("¿Estás seguro de eliminar esta acción?")) deleteAction(selectedAction.id);
                                            }}
                                            className="p-3 bg-red-900/20 hover:bg-red-900/40 rounded-xl text-red-500 transition-all border border-red-900/30"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <Database size={14} /> Input Configuration
                                        </h3>
                                        <div className="flex flex-col gap-2">
                                            {selectedAction.inputs.map((input, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800/50">
                                                    <div className="font-mono text-[10px] text-white underline decoration-blue-500/50 decoration-2 underline-offset-4">{input.name}</div>
                                                    <div className="text-[9px] font-black uppercase text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">{input.type}</div>
                                                </div>
                                            ))}
                                            {selectedAction.inputs.length === 0 && (
                                                <div className="text-[9px] text-slate-600 uppercase font-bold italic">No required inputs</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <ShieldCheck size={14} className="text-emerald-500" /> Security Policy
                                        </h3>
                                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/50 text-[10px] space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500 uppercase font-black">Memory Limit</span>
                                                <span className="text-white font-mono">128MB</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500 uppercase font-black">Timeout</span>
                                                <span className="text-white font-mono">2000ms</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500 uppercase font-black">Network Acc.</span>
                                                <span className="text-red-500 uppercase font-bold text-[8px]">Restricted</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Code size={14} /> Safe Code Engine (Sandboxed)
                                    </h3>
                                    <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 font-mono text-sm leading-relaxed shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                                            <Code size={40} className="text-blue-500" />
                                        </div>
                                        <pre className="text-blue-400">
                                            {selectedAction.code}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center space-y-4 max-w-xs">
                                    <div className="w-16 h-16 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                                        <Package size={32} />
                                    </div>
                                    <h3 className="font-bold text-slate-400">Selecciona una acción del registro para ver su configuración técnica o crear una nueva.</h3>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : activeTab === 'dsl' ? (
                <div className="h-full flex flex-col p-8 w-full">
                     <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-white italic">DSL Output (Live Build)</h2>
                     <div className="flex-1 bg-slate-900 rounded-2xl border-2 border-slate-800 p-8 font-mono overflow-auto shadow-2xl">
                        <pre className="text-blue-400 text-xs leading-relaxed">
{JSON.stringify({
    processId: "proc_lead_mgmt",
    name: "Lead Conversion Flow",
    context: { source: "crm_core", table: "leads" },
    stages: [
        { id: "start", name: "New Lead", type: "initial", automation: ["notify_slack"] },
        { id: "qualify", name: "Qualification", automation: ["enrich_data"] },
        { id: "close", name: "Closed Won", type: "final", automation: ["sync_erp"] }
    ],
    transitions: [
        { from: "start", to: "qualify", condition: "score > 50" },
        { from: "qualify", to: "close", condition: "approved == true" }
    ]
}, null, 4)}
                        </pre>
                     </div>
                </div>
            ) : activeTab === 'sources' ? (
                <div className="h-full flex flex-col p-8 w-full overflow-y-auto">
                     <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-white italic">Data Sources (Contexts)</h2>
                            <p className="text-sm text-slate-400 mt-1">Manage external schemas that power your workflows.</p>
                        </div>
                        <button 
                            onClick={() => setIsConnectionModalOpen(true)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                        >
                             <Plus size={14} /> Connect New Source
                        </button>
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        {useDataSourceStore.getState().sources.map((source) => (
                            <div key={source.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button 
                                        onClick={() => {
                                            setEditingSource(source);
                                            setIsConnectionModalOpen(true);
                                        }}
                                        className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
                                        title="Editar Origen de Datos"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                   
                                   <button 
                                        onClick={() => {
                                            if (confirm(`¿Estás seguro de eliminar el origen "${source.name}"?`)) {
                                                useDataSourceStore.getState().deleteSource(source.id);
                                            }
                                        }}
                                        className="p-2 bg-red-900/20 text-red-500 rounded-lg hover:bg-red-900/40 border border-red-900/30 transition-all hover:scale-105"
                                        title="Eliminar Origen de Datos"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-blue-500 border border-slate-700/50 shadow-inner">
                                        <Database size={24} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{source.type} CONECTOR</div>
                                        <h3 className="text-xl font-black text-white italic">{source.name}</h3>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1">Available Tables</div>
                                    {source.tables.map(table => (
                                        <div key={table.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800/50 flex items-center justify-between group/table hover:border-slate-700 transition-colors">
                                           <div className="flex items-center gap-3">
                                                <TableIcon size={14} className="text-slate-600 group-hover/table:text-blue-400 transition-colors" />
                                                <span className="text-xs font-bold text-slate-300">{table.name}</span>
                                           </div>
                                           <span className="text-[9px] font-mono text-slate-600 bg-slate-900 px-2 py-1 rounded">{table.fields.length} FIELDS</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
            ) : activeTab === 'settings' ? (
                <div className="h-full flex flex-col p-8 w-full overflow-y-auto">
                    <div className="mb-12">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-white italic">Global App Settings</h2>
                        <p className="text-sm text-slate-400 mt-1">Configure global behaviors, branding and UI feedback.</p>
                    </div>

                    <div className="max-w-2xl space-y-8">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
                            <h3 className="text-lg font-black text-white flex items-center gap-3">
                                <Zap className="text-blue-500" /> Toast Notifications
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Default Success Message</label>
                                    <input 
                                        type="text" 
                                        value={globalConfig.successMessage}
                                        onChange={e => updateGlobalConfig({ successMessage: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-600 transition-all font-bold"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Default Error Message</label>
                                    <input 
                                        type="text" 
                                        value={globalConfig.errorMessage}
                                        onChange={e => updateGlobalConfig({ errorMessage: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-600 transition-all font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6 pt-4">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Duration (ms)</label>
                                    <input 
                                        type="number" 
                                        step="500"
                                        value={globalConfig.duration}
                                        onChange={e => updateGlobalConfig({ duration: parseInt(e.target.value) })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-600 transition-all font-bold"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Position</label>
                                    <select 
                                        value={globalConfig.position}
                                        onChange={e => updateGlobalConfig({ position: e.target.value as any })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-600 transition-all font-bold"
                                    >
                                        <option value="top-right">Top Right</option>
                                        <option value="top-center">Top Center</option>
                                        <option value="bottom-right">Bottom Right</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Theme</label>
                                    <select 
                                        value={globalConfig.theme}
                                        onChange={e => updateGlobalConfig({ theme: e.target.value as any })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-600 transition-all font-bold"
                                    >
                                        <option value="colored">Colored</option>
                                        <option value="light">Light Glass</option>
                                        <option value="dark">Dark Slate</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick, open }: { icon: any, label: string, active: boolean, onClick: () => void, open: boolean }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-4 px-5 py-3 transition-all relative group ${active ? 'text-blue-500' : 'text-slate-400 hover:text-white'}`}
    >
        <div className={`transition-all duration-300 ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'group-hover:scale-110'}`}>
            {icon}
        </div>
        {open && <span className="font-bold text-[11px] uppercase tracking-wider">{label}</span>}
        {active && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-l-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}
    </button>
);
