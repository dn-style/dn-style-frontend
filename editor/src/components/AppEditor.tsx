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
  TemplateInjector,
  DataTable,
  DynamicFormBlock
} from './user/Blocks';
import { Toolbox } from './Toolbox';
import { SettingsPanel } from './SettingsPanel';
import { Topbar } from './Topbar';
import { ContextMenu } from './ContextMenu';
import { useState, useEffect, useRef, useMemo } from 'react';

const EditorDeviceSync = ({ device }: { device: string }) => {
  const { actions } = useEditor();
  useEffect(() => {
    actions.setOptions((options) => {
      // @ts-ignore
      options.device = device;
    });
  }, [device, actions]);
  return null;
};

const SelectionListener = () => {
  const { actions, query } = useEditor();
  const prevNodeCount = useRef(0);

  useEffect(() => {
    const nodes = query.getNodes();
    const nodeIds = Object.keys(nodes);
    const currentCount = nodeIds.length;

    if (currentCount > prevNodeCount.current && prevNodeCount.current > 0) {
      const newestNodeId = nodeIds[currentCount - 1];
      setTimeout(() => {
        // @ts-ignore
        if (actions.selectNode) {
            // @ts-ignore
            actions.selectNode(newestNodeId);
        }
      }, 50);
    }
    prevNodeCount.current = currentCount;
  }, [query, actions]);

  return null;
};

interface AppEditorProps {
    onOpenBlockEditor?: (blockId?: string) => void;
    onOpenConfig?: () => void;
}

export const AppEditor = ({ onOpenBlockEditor, onOpenConfig }: AppEditorProps) => {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showToolbox, setShowToolbox] = useState(true);
  const [showSettings, setShowSettings] = useState(true);

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
    TemplateInjector,
    DataTable,
    DynamicFormBlock 
  }), []);

  const getCanvasWidth = () => {
    switch(device) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      case 'desktop': return '100%';
      default: return '100%';
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-100 overflow-hidden">
      <Editor resolver={resolver}>
        <Topbar 
          device={device} setDevice={setDevice}
          showToolbox={showToolbox} setShowToolbox={setShowToolbox}
          showSettings={showSettings} setShowSettings={setShowSettings}
          onOpenConfig={onOpenConfig}
        />
        <EditorDeviceSync device={device} />
        <SelectionListener />
        <ContextMenu />
        
        <div className="flex flex-1 overflow-hidden relative">
          <div 
            className={`bg-white border-r border-gray-200 transition-all duration-300 ease-in-out overflow-hidden ${showToolbox ? 'w-72 opacity-100' : 'w-0 opacity-0'}`}
          >
            <div className="w-72 h-full">
               <Toolbox showCustomBlocks={true} onCreateBlock={() => onOpenBlockEditor && onOpenBlockEditor()} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-100 flex justify-center relative">
             <div 
                className="transition-all duration-300 ease-in-out bg-white shadow-xl my-8 min-h-[1000px] flex flex-col"
                style={{ 
                  width: getCanvasWidth(),
                  marginBottom: '200px'
                }}
             >
                <Frame>
                  {/* @ts-ignore */}
                  <Element is={Container} padding={0} canvas className="h-full min-h-[1000px] bg-white">
                    <HeroBlock 
                      title="Bienvenido a tu Tienda" 
                      subtitle="Comienza a arrastrar bloques para personalizar tu ecommerce."
                      buttonText="Empezar Ahora"
                      backgroundColor="#f3f4f6"
                    />
                    <Element is={Container} padding={40} canvas>
                      <Text text="Arrastra más contenido aquí..." fontSize={14} color="#9ca3af" textAlign="center" />
                    </Element>
                  </Element>
                </Frame>
             </div>
          </div>

          <div
            className={`bg-white border-l border-gray-200 transition-all duration-300 ease-in-out overflow-hidden ${showSettings ? 'w-80 opacity-100' : 'w-0 opacity-0'}`}
          >
             <div className="w-80 h-full">
               <SettingsPanel />
             </div>
          </div>
        </div>
      </Editor>
    </div>
  );
};