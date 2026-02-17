import { useEditor, Element } from '@craftjs/core';
import {
  ProductGridBlock,
  FeaturesBlock,
  Container,
  Text,
  Button,
  Image,
  Video,
  Divider,
  Grid as GridBlock,
  HeroBlock,
  TemplateInjector,
  DataTable,
  DynamicFormBlock
} from './user/Blocks';
import {
  Grid,
  Star,
  Maximize,
  Type,
  Square,
  Image as ImageIcon,
  Video as VideoIcon,
  Minus,
  Columns,
  Rows,
  type LucideIcon,
  LayoutTemplate,
  Plus,
  Package,
  Database,
  FormInput
} from 'lucide-react';
import { useState } from 'react';
import { useBlockStore } from '../store/blockStore';

interface BlockItemProps {
  icon: LucideIcon;
  label: string;
  component: React.ReactElement;
}

interface ToolboxProps {
    showCustomBlocks?: boolean;
    onCreateBlock?: () => void;
}

export const Toolbox = ({ showCustomBlocks = false, onCreateBlock }: ToolboxProps) => {
  const { connectors } = useEditor();
  const [activeTab, setActiveTab] = useState<'basics' | 'sections' | 'custom'>('basics');
  const { blocks } = useBlockStore();

  const BlockItem = ({ icon: Icon, label, component }: BlockItemProps) => (
    <div
      ref={(ref) => { if (ref) connectors.create(ref, component); }}
      className="p-3 bg-white border border-gray-100 rounded-xl flex flex-col items-center gap-2 cursor-grab hover:border-blue-500 hover:shadow-md transition-all group h-full"
    >
      <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
        <Icon size={20} />
      </div>
      <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide text-center">{label}</span>
    </div>
  );

  const SectionItem = ({ icon: Icon, label, component }: BlockItemProps) => (
    <div
      ref={(ref) => { if (ref) connectors.create(ref, component); }}
      className="p-4 bg-white border border-gray-100 rounded-2xl mb-3 flex items-center gap-3 cursor-grab hover:border-blue-500 hover:shadow-lg transition-all group"
    >
       <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
        <Icon size={18} />
      </div>
      <span className="text-sm font-bold text-gray-700 uppercase tracking-widest text-[10px]">{label}</span>
    </div>
  );

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      <div className="flex p-2 bg-white border-b border-gray-200 shrink-0 gap-1 overflow-x-auto">
        <button
            onClick={() => setActiveTab('basics')}
            className={`flex-1 py-2 px-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${activeTab === 'basics' ? 'bg-gray-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
            Básicos
        </button>
        <button
            onClick={() => setActiveTab('sections')}
            className={`flex-1 py-2 px-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${activeTab === 'sections' ? 'bg-gray-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
            Secciones
        </button>
        {showCustomBlocks && (
            <button
                onClick={() => setActiveTab('custom')}
                className={`flex-1 py-2 px-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${activeTab === 'custom' ? 'bg-gray-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
                Mis Bloques
            </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'basics' && (
            <div className="space-y-6">
                <div>
                    <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 pl-1">Estructura</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <BlockItem 
                            icon={Maximize} 
                            label="Contenedor" 
                            component={<Element is={Container} padding={20} canvas />} 
                        />
                         <BlockItem 
                            icon={Grid} 
                            label="Grilla" 
                            component={<Element is={GridBlock} columns={2} gap={20} canvas />} 
                        />
                         <BlockItem 
                            icon={Rows} 
                            label="Fila" 
                            component={<Element is={Container} flexDirection="row" padding={20} canvas />} 
                        />
                        <BlockItem 
                            icon={Columns} 
                            label="Columna" 
                            component={<Element is={Container} flexDirection="column" padding={20} canvas />} 
                        />
                    </div>
                </div>

                <div>
                    <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 pl-1">Elementos</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <BlockItem icon={Type} label="Texto" component={<Text text="Nuevo Texto" />} />
                        <BlockItem icon={Square} label="Botón" component={<Button />} />
                        <BlockItem icon={ImageIcon} label="Imagen" component={<Image />} />
                        <BlockItem icon={VideoIcon} label="Video" component={<Video />} />
                        <BlockItem icon={Minus} label="Separador" component={<Divider />} />
                        <BlockItem icon={Database} label="Data Table" component={<DataTable />} />
                        <BlockItem icon={FormInput} label="Dynamic Form" component={<DynamicFormBlock />} />
                    </div>
                </div>
            </div>
        )} 
        
        {activeTab === 'sections' && (
             <div className="space-y-2">
                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 pl-1">Pre-diseñados</h3>
                <SectionItem icon={LayoutTemplate} label="Hero Section" component={<HeroBlock />} />
                <SectionItem icon={Grid} label="Grilla Productos" component={<ProductGridBlock />} />
                <SectionItem icon={Star} label="Features" component={<FeaturesBlock />} />
            </div>
        )}

        {activeTab === 'custom' && showCustomBlocks && (
            <div className="space-y-4">
                <button 
                    onClick={onCreateBlock}
                    className="w-full py-3 border-2 border-dashed border-blue-200 rounded-xl flex items-center justify-center gap-2 text-blue-600 font-bold uppercase text-[10px] tracking-widest hover:bg-blue-50 transition-all"
                >
                    <Plus size={16} /> Crear Bloque
                </button>

                <div className="space-y-2">
                    {blocks.map(block => (
                        <SectionItem 
                            key={block.id} 
                            icon={Package} 
                            label={block.name} 
                            component={<Element is={TemplateInjector} blockId={block.id} />} 
                        />
                    ))}
                    {blocks.length === 0 && (
                        <p className="text-center text-xs text-gray-400 mt-4">No tienes bloques guardados aún.</p>
                    )}
                </div>
            </div>
        )}
      </div>
      
      <div className="mt-auto p-4 border-t border-gray-200 bg-white shrink-0">
         <p className="text-[10px] text-gray-400 text-center font-medium">Arrastra al lienzo para añadir</p>
      </div>
    </div>
  );
};
