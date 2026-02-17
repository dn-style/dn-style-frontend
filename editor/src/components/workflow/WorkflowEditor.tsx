import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  Panel,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useActionStore } from '../../store/actionStore';
import { useDataSourceStore } from '../../store/dataSourceStore';
import { Package, ShieldCheck, Zap, Settings, Database, ArrowRight, LayoutList, PlayCircle } from 'lucide-react';

// --- CUSTOM NODES ---

const StageNode = ({ data }: { data: any }) => (
  <div className={`px-5 py-4 shadow-2xl rounded-2xl border-2 min-w-[240px] transition-all group ${data.isStart ? 'bg-emerald-950/90 border-emerald-500/50' : 'bg-slate-900/95 border-slate-700 hover:border-blue-500/50'}`}>
    <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl text-white shadow-lg ${data.isStart ? 'bg-emerald-600' : 'bg-slate-800'}`}>
                {data.isStart ? <Zap size={18} /> : <LayoutList size={18} />}
            </div>
            <div>
                <div className={`text-[9px] font-black uppercase tracking-widest ${data.isStart ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {data.isStart ? 'Initial Stage' : 'Process Stage'}
                </div>
                <div className="text-sm font-black text-white uppercase tracking-tight">{data.label}</div>
            </div>
        </div>
        {!data.isStart && <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500 border-2 border-slate-900" />}
    </div>
    
    {data.actions && data.actions.length > 0 ? (
        <div className="space-y-2 mt-4 bg-black/20 p-2 rounded-xl">
             <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest pl-1">Automation Triggers</div>
             {data.actions.map((act: any, i: number) => (
                 <div key={i} className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/50">
                     <PlayCircle size={12} className="text-blue-400" />
                     <span className="text-[10px] font-bold text-slate-300">{act}</span>
                 </div>
             ))}
        </div>
    ) : (
        <div className="mt-4 border-t border-slate-800 pt-3 text-center">
            <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">No automations active</span>
        </div>
    )}

    <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500 border-2 border-slate-900" />
  </div>
);

// --- INITIAL DATA ---

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'stage',
    data: { label: 'New Lead', isStart: true, actions: ['Notify Sales Channel'] },
    position: { x: 50, y: 150 },
  },
  {
    id: 'stage-1',
    type: 'stage',
    data: { label: 'Qualification', actions: ['Check Credit Score', 'Enrich Data'] },
    position: { x: 400, y: 50 },
  },
  {
    id: 'stage-2',
    type: 'stage',
    data: { label: 'Nurturing', actions: ['Send Email Sequence'] },
    position: { x: 400, y: 250 },
  },
  {
    id: 'stage-3',
    type: 'stage',
    data: { label: 'Closed Won', isFinal: true, actions: ['Generate Contract', 'Sync to ERP'] },
    position: { x: 800, y: 150 },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'start', target: 'stage-1', animated: true, label: 'Score > 50', style: { stroke: '#3b82f6', strokeWidth: 2 } },
  { id: 'e1-3', source: 'start', target: 'stage-2', animated: true, label: 'Score < 50', style: { stroke: '#64748b', strokeWidth: 2 } },
  { id: 'e2-4', source: 'stage-1', target: 'stage-3', animated: true, label: 'Approved', style: { stroke: '#10b981', strokeWidth: 2 } },
];

export const WorkflowEditor = () => {
  const nodeTypes = useMemo(() => ({
    stage: StageNode,
  }), []);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { sources } = useDataSourceStore();

// ... Inside WorkflowEditor Component ...

  const [selectedContext, setSelectedContext] = useState<{source: string, table: string, event?: string} | null>(null);

  // Filter triggers based on selected table
  const availableTriggers = useMemo(() => {
     if (!selectedContext) return [];
     const table = useDataSourceStore.getState().getTable(selectedContext.source, selectedContext.table);
     return table?.triggers || [];
  }, [selectedContext]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="w-full h-full bg-slate-950 relative flex flex-col">
      {/* CONTEXT SELECTOR HEADER */}
      <div className="h-20 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-900/30 text-blue-400 rounded-lg border border-blue-500/20">
                    <Database size={18} />
                </div>
                
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Values & Events</h2>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <select 
                            className="bg-slate-950 text-white font-bold text-xs border border-slate-700 rounded p-1 cursor-pointer hover:border-blue-500 transition-colors"
                            onChange={(e) => {
                                const [sId, tId] = e.target.value.split(':');
                                setSelectedContext({ source: sId, table: tId });
                            }}
                        >
                            <option value="">Select Table...</option>
                            {sources.map(source => (
                                <optgroup key={source.id} label={source.name}>
                                    {source.tables.map(table => (
                                        <option key={table.id} value={`${source.id}:${table.id}`}>{table.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>

                        {selectedContext && (
                            <>
                                <ArrowRight size={12} className="text-slate-600" />
                                <select 
                                    className="bg-slate-950 text-emerald-400 font-bold text-xs border border-emerald-900/50 rounded p-1 cursor-pointer hover:border-emerald-500 transition-colors uppercase"
                                    onChange={(e) => setSelectedContext(prev => ({ ...prev!, event: e.target.value }))}
                                >
                                    <option value="">Select Trigger...</option>
                                    {availableTriggers.map(trigger => (
                                        <option key={trigger.event} value={trigger.event}>{trigger.label}</option>
                                    ))}
                                </select>
                            </>
                        )}
                    </div>
                </div>
             </div>
             
             {selectedContext?.event && (
                 <>
                    <div className="h-8 w-[1px] bg-slate-800 mx-2"></div>
                    <div>
                         <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Active Workflow</h2>
                         <div className="text-white font-bold text-sm">Lead {selectedContext.event === 'ON_INSERT' ? 'Creation' : 'Update'} Automation</div>
                    </div>
                 </>
             )}
        </div>

        <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-700 transition-all border border-slate-700">
                Reset Layout
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20">
                Save Workflow
            </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
        >
            <Background color="#1e293b" gap={40} size={1} />
            <Controls className="bg-slate-800 border-slate-700 fill-white" />
            <MiniMap className="bg-slate-900 border-slate-800" maskColor="rgba(0,0,0,0.5)" />
            
            {/* Legend Panel */}
            <Panel position="bottom-left" className="bg-slate-900/90 backdrop-blur border border-slate-700 p-4 rounded-xl m-4">
                 <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                     <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Start
                     </div>
                     <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-slate-500"></div> Stage
                     </div>
                     <div className="flex items-center gap-2">
                         <div className="w-4 h-0.5 bg-blue-500"></div> Transitions
                     </div>
                 </div>
            </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};
