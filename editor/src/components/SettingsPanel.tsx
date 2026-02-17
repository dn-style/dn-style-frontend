import { useEditor } from '@craftjs/core';
import { Settings, Layers as LayersIcon, ChevronDown, Eye, GripVertical, ShieldCheck, Zap, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useContextMenuStore } from '../store/editorStore';
import { useActionStore } from '../store/actionStore';
import { useDataSourceStore } from '../store/dataSourceStore';

// Componente para un nodo individual del árbol
const LayerNode = ({ nodeId, depth }: { nodeId: string, depth: number }) => {
  const { node, childrenIds, selected, isHovered, connectors, actions } = useEditor((state: any) => {
    const node = state.nodes[nodeId];
    return {
      node,
      childrenIds: node?.data?.nodes || [], 
      selected: state.events.selected.has(nodeId),
      isHovered: state.events.hovered.has(nodeId),
    };
  });

  const { openMenu } = useContextMenuStore();
  const [expanded, setExpanded] = useState(true);

  if (!node) return null;

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    actions.selectNode(nodeId);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openMenu(e.clientX, e.clientY, nodeId);
  };

  const hasChildren = childrenIds && childrenIds.length > 0;

  return (
    <div>
      <div
        ref={(ref) => {
            if (ref) {
                connectors.select(ref, nodeId);
                connectors.hover(ref, nodeId);
            }
        }}
        onClick={handleSelect}
        onContextMenu={handleContextMenu}
        className={`
            flex items-center p-2 rounded-lg mb-1 transition-all cursor-pointer border
            ${selected ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'hover:bg-gray-100 border-transparent text-gray-700'}
            ${isHovered && !selected ? 'bg-gray-100 border-gray-200' : ''}
            ${nodeId === 'ROOT' ? 'font-bold bg-gray-50' : ''}
        `}
        style={{ marginLeft: `${depth * 12}px` }}
      >
        <div className={`mr-2 ${selected ? 'text-blue-200' : 'text-gray-300'}`}>
           <GripVertical size={12} />
        </div>
        
        <div 
            className="w-4 h-4 mr-1 flex items-center justify-center shrink-0 hover:bg-black/10 rounded transition-colors"
            onClick={hasChildren ? toggleExpanded : undefined}
        >
            {hasChildren ? (
                <div className={`transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`}>
                    <ChevronDown size={12} />
                </div>
            ) : null}
        </div>

        <div className="flex-1 truncate text-xs select-none">
           {nodeId === 'ROOT' ? 'Página' : (node.data.custom.displayName || node.data.name || 'Elemento')} 
           {!selected && (
             <span className="text-gray-400 font-normal ml-2 text-[9px] opacity-50 italic">
               {`#${nodeId.substring(0,4)}`}
             </span>
           )}
        </div>

        <div className={`${selected ? 'text-blue-200' : 'text-gray-300'} hover:text-gray-600`}>
             <Eye size={12} />
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="relative">
           <div className="absolute left-[9px] top-0 bottom-2 w-px bg-gray-200" style={{ marginLeft: `${depth * 12}px` }} />
           {childrenIds.map((childId: string) => (
             <LayerNode key={childId} nodeId={childId} depth={depth + 1} />
           ))}
        </div>
      )}
    </div>
  );
};

export const SettingsPanel = () => {
  const [activeTab, setActiveTab] = useState<'settings' | 'layers' | 'logic'>('settings');
  const { actions: storeActions } = useActionStore();
  
  const { actions, selected, isEnabled } = useEditor((state: any) => {
    // @ts-ignore
    const [currentNodeId] = state.events.selected;
    let selected;

    if (currentNodeId) {
      const node = state.nodes[currentNodeId];
      selected = {
        id: currentNodeId,
        name: node.data.name,
        displayName: node.data.custom && node.data.custom.displayName,
        settings: node.related && node.related.settings,
        // @ts-ignore
        isDeletable: node.data.isDeletable,
        props: node.data.props
      };
    }

    return {
      selected,
      isEnabled: state.options.enabled
    };
  });

  return isEnabled ? (
    <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col">
      {/* TABS HEADER */}
      <div className="flex p-2 bg-white border-b border-gray-200 shrink-0 gap-2">
        <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'settings' ? 'bg-gray-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
            <Settings size={14} />
            Ajustes
        </button>
        <button
            onClick={() => setActiveTab('layers')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'layers' ? 'bg-gray-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
            <LayersIcon size={14} />
            Capas
        </button>
        <button
            onClick={() => setActiveTab('logic')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'logic' ? 'bg-gray-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
            <Zap size={14} />
            Lógica
        </button>
      </div>

      {activeTab === 'layers' ? (
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white">
           <LayerNode nodeId="ROOT" depth={0} />
        </div>
      ) : activeTab === 'logic' && selected ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
             {/* DATA SOURCE FILTERS */}
             {selected.props.filters !== undefined && (
                <div className="bg-gray-50 p-4 rounded-2xl border border-blue-100">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Filtros de Datos</p>
                        <button 
                            onClick={() => {
                                const current = selected.props.filters || [];
                                actions.setProp(selected.id, (props: any) => {
                                    props.filters = [...current, { field: 'id', operator: '=', value: '' }];
                                });
                            }}
                            className="text-blue-600 hover:bg-blue-100 p-1 rounded transition-colors"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                    
                    <div className="space-y-2">
                        {(selected.props.filters || []).map((filter: any, idx: number) => (
                            <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                <input 
                                    className="flex-1 min-w-0 bg-transparent text-xs font-mono border-b border-gray-200 focus:border-blue-500 outline-none"
                                    placeholder="Campo"
                                    value={filter.field}
                                    onChange={(e) => actions.setProp(selected.id, (props: any) => props.filters[idx].field = e.target.value)}
                                />
                                <select
                                    className="w-14 bg-transparent text-xs font-bold text-gray-500 border-none outline-none"
                                    value={filter.operator}
                                    onChange={(e) => actions.setProp(selected.id, (props: any) => props.filters[idx].operator = e.target.value)}
                                >
                                    <option value="=">=</option>
                                    <option value=">">&gt;</option>
                                    <option value="<">&lt;</option>
                                    <option value=">=">&gt;=</option>
                                    <option value="<=">&lt;=</option>
                                    <option value="!=">!=</option>
                                    <option value="LIKE">LIKE</option>
                                    <option value="ILIKE">ILIKE</option>
                                </select>
                                <input 
                                    className="flex-1 min-w-0 bg-transparent text-xs text-blue-600 border-b border-gray-200 focus:border-blue-500 outline-none"
                                    placeholder="Valor"
                                    value={filter.value}
                                    onChange={(e) => actions.setProp(selected.id, (props: any) => props.filters[idx].value = e.target.value)}
                                />
                                <button 
                                    onClick={() => actions.setProp(selected.id, (props: any) => {
                                        const newFilters = [...props.filters];
                                        newFilters.splice(idx, 1);
                                        props.filters = newFilters;
                                    })}
                                    className="text-red-400 hover:text-red-600 px-1"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                        {(!selected.props.filters || selected.props.filters.length === 0) && (
                            <p className="text-[10px] text-gray-400 italic text-center py-2">Sin filtros activos</p>
                        )}
                    </div>
                </div>
             )}

             {/* EVENTS SECTION */}
             <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                <p className="text-[10px] font-black text-purple-600 uppercase mb-4 tracking-widest flex items-center gap-2">
                    <Zap size={12} /> Eventos Globales
                </p>
                
                {['onCreate', 'onInsert', 'onUpdate', 'onDelete'].map(event => {
                    if (selected.props[event] === undefined) return null;
                    
                    const currentValue = selected.props[event] || '';
                    
                    return (
                        <div key={event} className="mb-4 last:mb-0">
                            <label className="block text-[10px] font-bold text-purple-800 uppercase tracking-widest mb-1">{event}</label>
                            
                            <div className="flex flex-col gap-2">
                                <select 
                                    className="w-full bg-white border border-purple-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-purple-500 text-gray-600"
                                    onChange={(e) => {
                                        const actId = e.target.value;
                                        if (actId) {
                                            const template = `{{action:${actId}:{{page}.${selected.props.tableId || 'table'}.data}}`;
                                            actions.setProp(selected.id, (props: any) => props[event] = template);
                                        } else {
                                            actions.setProp(selected.id, (props: any) => props[event] = '');
                                        }
                                    }}
                                >
                                    <option value="">-- Seleccionar Acción --</option>
                                    {storeActions.map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                                
                                <div className="relative">
                                    <input 
                                        className="w-full bg-white/50 border border-purple-100 rounded-lg px-2 py-1.5 text-[10px] font-mono text-purple-600 outline-none focus:border-purple-400"
                                        value={currentValue}
                                        placeholder="{{page}.table.data :newData}"
                                        onChange={(e) => actions.setProp(selected.id, (props: any) => props[event] = e.target.value)}
                                    />
                                    <div className="absolute right-2 top-1.5 pointer-events-none opacity-50">
                                        <code className="text-[8px] text-purple-400">BINDING</code>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
             </div>
        </div>
      ) : (
         selected ? (
            <>
              {/* Header Fijo Selección */}
              <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Editando</h2>
                <div className="flex gap-2">
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold uppercase truncate max-w-[120px]">{selected.displayName || selected.name}</span>
                    <button 
                    onClick={() => actions.delete(selected.id)}
                    className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                    title="Eliminar bloque"
                    >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h14" /></svg>
                    </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                
                {/* CUSTOM SETTINGS COMPONENT */}
                {selected.settings && (
                    <div className="bg-gray-50 p-4 rounded-2xl border border-blue-100">
                        <p className="text-[10px] font-black text-blue-600 uppercase mb-4 tracking-widest">Configuración</p>
                        {(() => {
                            const SettingsComponent = selected.settings;
                            return <SettingsComponent />;
                        })()}
                    </div>
                )}

                {/* IDENTIFICATION (Custom Name) */}
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <label className="block text-[10px] font-black text-blue-600 uppercase mb-3 tracking-widest">Identificación</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    placeholder="Nombre personalizado (ej: Hero Principal)"
                    value={selected.displayName || ''}
                    onChange={(e) => {
                      // @ts-ignore
                      actions.setCustom(selected.id, (custom) => custom.displayName = e.target.value);
                    }}
                  />
                </div>

                {/* DISPLAY SETTINGS (Only for Container) */}
                {selected.props.display && (
                    <div className="bg-gray-50 p-4 rounded-2xl">
                        <p className="text-[10px] font-black text-blue-600 uppercase mb-4 tracking-widest">Layout Mode</p>
                        <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1 mb-4">
                            {['block', 'flex'].map((mode) => (
                              <button
                                key={mode}
                                onClick={() => actions.setProp(selected.id, (props: any) => props.display = mode)}
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${selected.props.display === mode ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>

                          {selected.props.display === 'flex' && (
                              <>
                                <div className="mb-4">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Direction</label>
                                    <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
                                        {['column', 'row'].map((dir) => (
                                        <button
                                            key={dir}
                                            onClick={() => actions.setProp(selected.id, (props: any) => props.flexDirection = dir)}
                                            className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${selected.props.flexDirection === dir ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                                        >
                                            {dir === 'column' ? 'Col' : 'Row'}
                                        </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="mb-4">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Align</label>
                                    <select
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none"
                                        value={selected.props.alignItems}
                                        onChange={(e) => actions.setProp(selected.id, (props: any) => props.alignItems = e.target.value)}
                                    >
                                        <option value="flex-start">Start</option>
                                        <option value="center">Center</option>
                                        <option value="flex-end">End</option>
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Justify</label>
                                    <select
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none"
                                        value={selected.props.justifyContent}
                                        onChange={(e) => actions.setProp(selected.id, (props: any) => props.justifyContent = e.target.value)}
                                    >
                                        <option value="flex-start">Start</option>
                                        <option value="center">Center</option>
                                        <option value="flex-end">End</option>
                                        <option value="space-between">Space Between</option>
                                    </select>
                                </div>

                                <div className="mb-4 last:mb-0">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Gap</label>
                                        <span className="text-[10px] font-mono text-blue-600 font-bold">{selected.props.gap}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max={100}
                                        step={1}
                                        className="w-full accent-blue-600"
                                        value={selected.props.gap}
                                        onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        actions.setProp(selected.id, (props: any) => {
                                            props.gap = value;
                                        });
                                        }}
                                    />
                                </div>
                              </>
                          )}
                    </div>
                )}

                {/* GENERAL PROPS LOOP */}
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-blue-600 uppercase mb-4 tracking-widest">Propiedades</p>
                  
                  {Object.keys(selected.props).map(prop => {
                    if (['children', 'display', 'flexDirection', 'alignItems', 'justifyContent', 'gap', 'filters'].includes(prop)) return null;
                    if (prop.startsWith('on') && prop !== 'onClick') return null;

                    if (prop === 'fontFamily') {
                         return (
                           <div key={prop} className="mb-4 last:mb-0">
                             <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Font Family</label>
                             <select
                               className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none"
                               value={selected.props[prop] || ''}
                               onChange={(e) => actions.setProp(selected.id, (props: any) => props[prop] = e.target.value)}
                             >
                                <option value="">Default</option>
                                <option value="Arial, sans-serif">Arial</option>
                                <option value="'Times New Roman', serif">Times New Roman</option>
                                <option value="'Courier New', monospace">Courier New</option>
                                <option value="'Inter', sans-serif">Inter</option>
                             </select>
                           </div>
                         );
                    }

                    if (prop === 'actionId') {
                        return (
                          <div key={prop} className="mb-4 last:mb-0">
                            <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <ShieldCheck size={12} /> Safe Action Link
                            </label>
                            <select
                              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none"
                              value={selected.props[prop] || ''}
                              onChange={(e) => actions.setProp(selected.id, (props: any) => props[prop] = e.target.value)}
                            >
                              <option value="">Ninguna acción</option>
                              {storeActions.map(action => (
                                <option key={action.id} value={action.id}>{action.name}</option>
                              ))}
                            </select>
                            <p className="text-[8px] text-gray-400 mt-2 font-medium uppercase">Se ejecutará al interactuar con este elemento en producción.</p>
                          </div>
                        );
                    }

                    if (prop === 'isFullWidth') {
                      return (
                        <div key={prop} className="mb-4 last:mb-0">
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={selected.props[prop]}
                                onChange={(e) => {
                                  actions.setProp(selected.id, (props: any) => props[prop] = e.target.checked);
                                }}
                              />
                              <div className={`w-10 h-5 rounded-full transition-colors ${selected.props[prop] ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                              <div className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${selected.props[prop] ? 'translate-x-5' : 'translate-x-0 shadow-sm'}`}></div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Full Width</span>
                          </label>
                        </div>
                      );
                    }

                    if (prop === 'datasourceId') {
                      const { sources } = useDataSourceStore.getState();
                      return (
                        <div key={prop} className="mb-4 last:mb-0">
                          <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                             Data Source
                          </label>
                          <select
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none"
                            value={selected.props[prop] || ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                actions.setProp(selected.id, (props: any) => {
                                    props.datasourceId = val;
                                    props.tableId = ''; // Reset table when source changes
                                });
                            }}
                          >
                            <option value="">Seleccionar Origen...</option>
                            {sources.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      );
                    }

                    if (prop === 'tableId') {
                        const { sources } = useDataSourceStore.getState();
                        const currentSource = sources.find(s => s.id === selected.props.datasourceId);
                        if (!currentSource) return null;

                        return (
                          <div key={prop} className="mb-4 last:mb-0">
                            <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                               Table / View
                            </label>
                            <select
                              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none"
                              value={selected.props[prop] || ''}
                              onChange={(e) => actions.setProp(selected.id, (props: any) => props.tableId = e.target.value)}
                            >
                              <option value="">Seleccionar Tabla...</option>
                              {currentSource.tables.map(t => (
                                <option key={t.id} value={t.id}>{t.schema ? `${t.schema}.${t.name}` : t.name}</option>
                              ))}
                            </select>
                          </div>
                        );
                    }

                    if (prop === 'maxWidth') {
                      if (selected.props.isFullWidth) return null;
                      return (
                        <div key={prop} className="mb-4 last:mb-0">
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Max Width</label>
                            <span className="text-[10px] font-mono text-blue-600 font-bold">{selected.props[prop]}px</span>
                          </div>
                          <input
                            type="range"
                            min="200"
                            max="2000"
                            step="10"
                            className="w-full accent-blue-600"
                            value={selected.props[prop]}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              actions.setProp(selected.id, (props: any) => {
                                props[prop] = value;
                              });
                            }}
                          />
                        </div>
                      );
                    }

                    if (prop === 'columns') {
                      return (
                        <div key={prop} className="mb-4 last:mb-0">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">{prop}</label>
                          <input
                            type="number"
                            min="1"
                            max="12"
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                            value={selected.props[prop]}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              actions.setProp(selected.id, (props: any) => {
                                props[prop] = value;
                              });
                            }}
                          />
                        </div>
                      );
                    }

                    if (prop === 'padding' || prop.startsWith('padding') || prop.startsWith('margin') || prop === 'minHeight') {
                      return (
                        <div key={prop} className="mb-4 last:mb-0">
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{prop.replace(/([A-Z])/g, ' $1').trim()}</label>
                            <span className="text-[10px] font-mono text-blue-600 font-bold">{selected.props[prop]}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={prop === 'minHeight' ? 2000 : 100}
                            step={1}
                            className="w-full accent-blue-600"
                            value={selected.props[prop]}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              actions.setProp(selected.id, (props: any) => {
                                props[prop] = value;
                              });
                            }}
                          />
                        </div>
                      );
                    }

                    if (prop === 'height') {
                      return (
                        <div key={prop} className="mb-4 last:mb-0">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">{prop}</label>
                          <input
                            type="text"
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                            value={selected.props[prop]}
                            onChange={(e) => {
                              actions.setProp(selected.id, (props: any) => {
                                props[prop] = e.target.value;
                              });
                            }}
                            placeholder="e.g. 100%, 50vh, auto"
                          />
                        </div>
                      );
                    }

                    if (prop === 'textAlign') {
                      return (
                        <div key={prop} className="mb-4 last:mb-0">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">{prop}</label>
                          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
                            {['left', 'center', 'right'].map((align) => (
                              <button
                                key={align}
                                onClick={() => actions.setProp(selected.id, (props: any) => props[prop] = align)}
                                className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${selected.props[prop] === align ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                              >
                                {align}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (prop === 'fontWeight') {
                      return (
                        <div key={prop} className="mb-4 last:mb-0">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">{prop}</label>
                          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
                            {['normal', 'bold', 'black'].map((weight) => (
                              <button
                                key={weight}
                                onClick={() => actions.setProp(selected.id, (props: any) => props[prop] = weight)}
                                className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${selected.props[prop] === weight ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                              >
                                {weight}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (prop === 'borderRadius' || prop === 'borderWidth' || prop === 'fontSize' || prop === 'thickness') {
                      return (
                        <div key={prop} className="mb-4 last:mb-0">
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{prop}</label>
                            <span className="text-[10px] font-mono text-blue-600 font-bold">{selected.props[prop]}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={100}
                            step={1}
                            className="w-full accent-blue-600"
                            value={selected.props[prop]}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              actions.setProp(selected.id, (props: any) => {
                                props[prop] = value;
                              });
                            }}
                          />
                        </div>
                      );
                    }
                    
                    if (prop === 'shadow') {
                      return (
                        <div key={prop} className="mb-4 last:mb-0">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Shadow</label>
                          <select
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none"
                            value={selected.props[prop] || 'none'}
                            onChange={(e) => actions.setProp(selected.id, (props: any) => props[prop] = e.target.value)}
                          >
                            <option value="none">None</option>
                            <option value="0 1px 2px 0 rgb(0 0 0 / 0.05)">Small</option>
                            <option value="0 4px 6px -1px rgb(0 0 0 / 0.1)">Medium</option>
                            <option value="0 10px 15px -3px rgb(0 0 0 / 0.1)">Large</option>
                            <option value="0 20px 25px -5px rgb(0 0 0 / 0.1)">X-Large</option>
                          </select>
                        </div>
                      );
                    }

                    if (prop.toLowerCase().includes('color')) {
                      return (
                        <div key={prop} className="mb-4 last:mb-0">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">{prop}</label>
                          <div className="flex gap-2">
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                              <input
                                type="color"
                                className="absolute inset-0 w-[150%] h-[150%] -left-[25%] -top-[25%] p-0 border-0 cursor-pointer"
                                value={selected.props[prop] === 'transparent' ? '#ffffff' : selected.props[prop]}
                                onChange={(e) => {
                                  actions.setProp(selected.id, (props: any) => {
                                    props[prop] = e.target.value;
                                  });
                                }}
                              />
                            </div>
                            <input
                              type="text"
                              className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:border-blue-500 outline-none transition-all font-mono"
                              value={selected.props[prop]}
                              onChange={(e) => {
                                actions.setProp(selected.id, (props: any) => {
                                  props[prop] = e.target.value;
                                });
                              }}
                            />
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={prop} className="mb-4 last:mb-0">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">{prop}</label>
                        <input
                          type="text"
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                          value={selected.props[prop]}
                          onChange={(e) => {
                            actions.setProp(selected.id, (props: any) => {
                              props[prop] = e.target.value;
                            });
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
              </div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Selecciona un elemento</p>
            </div>
         )
      )}
    </div>
  ) : (
    <div className="w-80 bg-gray-50 border-l border-gray-200 h-full flex items-center justify-center">
       <p className="text-xs text-gray-400 uppercase tracking-widest">Modo Preview</p>
    </div>
  );
};
