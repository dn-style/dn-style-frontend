import { Editor, Frame, Element, useEditor } from '@craftjs/core';
import { 
  HeroBlock, 
  ProductGridBlock, 
  FeaturesBlock, 
  Container, 
  Text, 
  Button, 
  Image, 
  Video, 
  Divider, 
  Grid, 
  TemplateInjector 
} from './user/Blocks';
import { Toolbox } from './Toolbox';
import { SettingsPanel } from './SettingsPanel';
import { ContextMenu } from './ContextMenu';
import { useBlockStore } from '../store/blockStore';
import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

const BlockEditorTopbar = ({ onBack, onSave, blockName, setBlockName }: any) => {
  return (
    <div className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between z-50 shadow-sm shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={16} />
          Volver
        </button>
        <div className="h-6 w-px bg-gray-200"></div>
        <input 
            type="text" 
            value={blockName}
            onChange={(e) => setBlockName(e.target.value)}
            className="text-sm font-bold text-gray-900 border-none focus:ring-0 placeholder-gray-400"
            placeholder="Nombre del Bloque..."
        />
      </div>

      <button 
        onClick={onSave}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
      >
        <Save size={14} />
        Guardar Bloque
      </button>
    </div>
  );
};

const EditorContent = ({ blockId, onBack }: { blockId: string | null, onBack: () => void }) => {
    const { query, actions } = useEditor();
    const { saveBlock, getBlock } = useBlockStore();
    const [blockName, setBlockName] = useState('Nuevo Bloque Personalizado');
    
    useEffect(() => {
        if (blockId) {
            const saved = getBlock(blockId);
            if (saved) {
                setBlockName(saved.name);
                setTimeout(() => {
                    try {
                        actions.deserialize(saved.data);
                    } catch(e) {
                        console.error("Load failed", e);
                    }
                }, 100);
            }
        }
    }, [blockId, getBlock, actions]);

    const handleSave = () => {
        const rootNode = query.node('ROOT').get();
        console.log("SAVE ATTEMPT - ROOT children:", rootNode.data.nodes);
        
        if (rootNode.data.nodes.length === 0) {
            alert('El lienzo está vacío. Agrega contenido antes de guardar.');
            return;
        }

        const json = query.serialize();
        console.log("SERIALIZED DATA:", json);
        
        const id = blockId || crypto.randomUUID();
        saveBlock(id, blockName, json);
        alert('Bloque guardado exitosamente');
        onBack();
    };

    return (
        <div className="flex flex-col h-full bg-gray-100">
            <BlockEditorTopbar onBack={onBack} onSave={handleSave} blockName={blockName} setBlockName={setBlockName} />
            <div className="flex flex-1 overflow-hidden relative">
                <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto">
                    <Toolbox />
                </div>
                <div className="flex-1 overflow-y-auto bg-gray-50 flex justify-center p-10">
                    <div className="w-full max-w-3xl min-h-[500px] bg-white shadow-xl rounded-xl overflow-hidden flex flex-col border border-dashed border-gray-300">
                        <Frame>
                            <Element is={Container} padding={20} canvas>
                                <Text text="Empieza a construir tu componente aquí..." fontSize={14} color="#9ca3af" textAlign="center" />
                            </Element>
                        </Frame>
                    </div>
                </div>
                <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
                    <SettingsPanel />
                </div>
            </div>
            <ContextMenu />
        </div>
    );
};

export const CustomBlockEditor = ({ blockId, onBack }: { blockId: string | null, onBack: () => void }) => {
    const resolver = useMemo(() => ({ 
        HeroBlock, 
        ProductGridBlock, 
        FeaturesBlock, 
        Container, 
        Text, 
        Button, 
        Image, 
        Video, 
        Divider, 
        Grid, 
        TemplateInjector 
    }), []);

    return (
        <div className="h-screen w-full flex flex-col bg-white overflow-hidden fixed inset-0 z-[100]">
            <Editor resolver={resolver}>
                <EditorContent blockId={blockId} onBack={onBack} />
            </Editor>
        </div>
    );
};
