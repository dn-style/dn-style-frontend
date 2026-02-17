import { useNode, type UserComponent, useEditor } from '@craftjs/core';
import React, { useState, useEffect } from 'react';
import { useContextMenuStore } from '../../store/editorStore';
import { useBlockStore } from '../../store/blockStore';
import { useDataSourceStore } from '../../store/dataSourceStore';
import { useNotificationStore } from '../../store/notificationStore';
import { Database, FormInput } from 'lucide-react';
import { DynamicForm } from '../DynamicForm';

// Common Props Interface
interface CommonStyleProps {
  margin?: number | number[]; 
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  shadow?: string;
  borderRadius?: number;
  actionId?: string; // ID of the Safe Action to trigger
}

// --- CONTAINER ---
interface ContainerProps extends CommonStyleProps {
  backgroundColor?: string;
  padding?: number;
  display?: 'flex' | 'block';
  flexDirection?: 'column' | 'row';
  alignItems?: 'flex-start' | 'center' | 'flex-end';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  gap?: number;
  children?: React.ReactNode;
  borderColor?: string;
  borderWidth?: number;
  className?: string;
  isFullWidth?: boolean;
  maxWidth?: number;
  height?: string;
  minHeight?: number;
}

export const Container: UserComponent<ContainerProps> = ({ 
  backgroundColor, padding, display, flexDirection, alignItems, justifyContent, gap, 
  marginTop, marginBottom, marginLeft, marginRight,
  shadow, borderRadius, borderColor, borderWidth,
  children, className, isFullWidth, maxWidth, height, minHeight 
}) => {
  const { connectors: { connect, drag }, selected, isHovered, id } = useNode((node) => ({
    selected: node.events.selected,
    isHovered: node.events.hovered,
    id: node.id
  }));
  
  const { openMenu } = useContextMenuStore();

  const { isDragging, device } = useEditor((state) => ({
    isDragging: state.events.dragged.size > 0,
    // @ts-ignore
    device: state.options.device
  }));

  const isMobile = device === 'mobile';
  const isDropTarget = isDragging && isHovered;

  const finalFlexDirection = isMobile ? 'column' : flexDirection;
  const finalPadding = isMobile ? Math.min(padding ?? 0, 20) : padding;

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openMenu(e.clientX, e.clientY, id);
      }}
      className={`transition-all relative overflow-hidden break-words ${className || ''} 
        ${selected ? 'ring-2 ring-blue-500 z-20' : (isHovered ? 'ring-2 ring-green-400 z-20' : 'border border-dashed border-gray-400')}
        ${isDragging ? 'cursor-grabbing' : 'cursor-default'}
      `}
      style={{ 
        backgroundColor, 
        padding: `${finalPadding}px`,
        display,
        flexDirection: display === 'flex' ? finalFlexDirection : undefined,
        alignItems: display === 'flex' ? alignItems : undefined,
        justifyContent: display === 'flex' ? justifyContent : undefined,
        gap: display === 'flex' ? `${gap}px` : undefined,
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: isFullWidth ? `${marginLeft}px` : 'auto',
        marginRight: isFullWidth ? `${marginRight}px` : 'auto',
        boxShadow: shadow === 'none' ? 'none' : shadow,
        borderRadius: `${borderRadius}px`,
        border: borderWidth ? `${borderWidth}px solid ${borderColor}` : undefined,
        width: isFullWidth ? '100%' : `${maxWidth}px`,
        maxWidth: '100%',
        height: height === 'auto' ? undefined : height,
        minHeight: isMobile ? '100px' : `${minHeight}px`,
      }}
    >
      {isDropTarget && (
        <div className="absolute inset-0 z-50 bg-green-50/80 border-2 border-green-500 border-dashed flex items-center justify-center pointer-events-none">
           <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-widest animate-pulse">
             Soltar Aquí
           </span>
        </div>
      )}
      {children}
    </div>
  );
};

Container.craft = {
  displayName: 'Container',
  props: {
    backgroundColor: 'transparent',
    padding: 40,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: 16,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    shadow: 'none',
    borderRadius: 0,
    borderColor: '#e5e7eb',
    borderWidth: 0,
    isFullWidth: false,
    maxWidth: 1000,
    height: 'auto',
    minHeight: 200,
    actionId: '',
  },
  rules: {
    canMoveIn: () => true,
  },
};

// --- TEXT ---
interface TextProps extends CommonStyleProps {
  text?: string;
  fontSize?: number;
  textAlign?: string;
  color?: string;
  fontWeight?: string;
}

export const Text: UserComponent<TextProps> = ({ 
  text, fontSize, textAlign, color, fontWeight,
  marginTop, marginBottom, marginLeft, marginRight, shadow 
}) => {
  const { connectors: { connect, drag }, selected, isHovered, id, actions: { setProp } } = useNode((node) => ({
    selected: node.events.selected,
    isHovered: node.events.hovered,
    id: node.id
  }));

  const { openMenu } = useContextMenuStore();

  const { device } = useEditor((state) => ({
    // @ts-ignore
    device: state.options.device
  }));

  const isMobile = device === 'mobile';
  const finalFontSize = isMobile ? Math.min(fontSize ?? 16, 32) : fontSize;

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openMenu(e.clientX, e.clientY, id);
      }}
      className={`inline-block w-full focus:outline-none transition-all overflow-hidden break-words
        ${selected ? 'ring-2 ring-blue-500 z-20' : (isHovered ? 'ring-2 ring-green-400 z-20' : '')}
      `}
      style={{
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
        marginRight: `${marginRight}px`,
        textShadow: shadow === 'none' ? 'none' : shadow,
      }}
    >
      <p
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => {
          setProp((props: any) => props.text = e.target.innerText);
        }}
        style={{ 
          fontSize: `${finalFontSize}px`, 
          textAlign: textAlign as any, 
          color, 
          fontWeight: fontWeight as any 
        }}
      >
        {text}
      </p>
    </div>
  );
};

Text.craft = {
  displayName: 'Text',
  props: {
    text: 'Haz clic para editar este texto',
    fontSize: 16,
    textAlign: 'left',
    color: '#000000',
    fontWeight: 'normal',
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    shadow: 'none',
    actionId: '',
  },
};

// --- BUTTON ---
interface ButtonProps extends CommonStyleProps {
  text?: string;
  backgroundColor?: string;
  color?: string;
  paddingX?: number;
  paddingY?: number;
  fullWidth?: boolean;
}

export const Button: UserComponent<ButtonProps> = ({ 
  text, backgroundColor, color, paddingX, paddingY, borderRadius, fullWidth,
  marginTop, marginBottom, marginLeft, marginRight, shadow 
}) => {
  const { connectors: { connect, drag }, selected, isHovered, id } = useNode((node) => ({
    selected: node.events.selected,
    isHovered: node.events.hovered,
    id: node.id
  }));

  const { openMenu } = useContextMenuStore();

  return (
    <button
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openMenu(e.clientX, e.clientY, id);
      }}
      className={`transition-all font-bold uppercase text-[10px] tracking-widest ${fullWidth ? 'w-full' : ''} 
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : (isHovered ? 'ring-2 ring-green-400 ring-offset-2' : '')}
      `}
      style={{ 
        backgroundColor, 
        color, 
        padding: `${paddingY}px ${paddingX}px`,
        borderRadius: `${borderRadius}px`,
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
        marginRight: `${marginRight}px`,
        boxShadow: shadow === 'none' ? 'none' : shadow,
      }}
    >
      {text}
    </button>
  );
};

Button.craft = {
  displayName: 'Button',
  props: {
    text: 'Click Aquí',
    backgroundColor: '#111827',
    color: '#ffffff',
    paddingX: 24,
    paddingY: 12,
    borderRadius: 12,
    fullWidth: false,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    shadow: 'none',
    actionId: '',
  },
};

// --- IMAGE ---
interface ImageProps extends CommonStyleProps {
  url?: string;
  width?: string;
}

export const Image: UserComponent<ImageProps> = ({ 
  url, width, borderRadius,
  marginTop, marginBottom, marginLeft, marginRight, shadow 
}) => {
  const { connectors: { connect, drag }, selected, isHovered, id } = useNode((node) => ({
    selected: node.events.selected,
    isHovered: node.events.hovered,
    id: node.id
  }));

  const { openMenu } = useContextMenuStore();

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openMenu(e.clientX, e.clientY, id);
      }}
      className={`inline-block overflow-hidden transition-all 
        ${selected ? 'ring-2 ring-blue-500 ring-inset' : (isHovered ? 'ring-2 ring-green-400 ring-inset' : '')}
      `}
      style={{ 
        borderRadius: `${borderRadius}px`, 
        width,
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
        marginRight: `${marginRight}px`,
        boxShadow: shadow === 'none' ? 'none' : shadow,
      }}
    >
      <img src={url} alt="User upload" className="w-full h-auto block" />
    </div>
  );
};

Image.craft = {
  displayName: 'Image',
  props: {
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop',
    width: '100%',
    borderRadius: 16,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    shadow: 'none',
  },
};

// --- VIDEO ---
interface VideoProps extends CommonStyleProps {
  videoId?: string;
  width?: string;
}

export const Video: UserComponent<VideoProps> = ({ 
  videoId, width, borderRadius,
  marginTop, marginBottom, marginLeft, marginRight, shadow
}) => {
  const { connectors: { connect, drag }, selected, isHovered, id } = useNode((node) => ({
    selected: node.events.selected,
    isHovered: node.events.hovered,
    id: node.id
  }));

  const { openMenu } = useContextMenuStore();

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openMenu(e.clientX, e.clientY, id);
      }}
      className={`overflow-hidden transition-all bg-gray-900 aspect-video 
        ${selected ? 'ring-2 ring-blue-500 ring-inset' : (isHovered ? 'ring-2 ring-green-400 ring-inset' : '')}
      `}
      style={{ 
        width,
        borderRadius: `${borderRadius}px`,
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
        marginRight: `${marginRight}px`,
        boxShadow: shadow === 'none' ? 'none' : shadow,
      }}
    >
       <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
    </div>
  );
};

Video.craft = {
  displayName: 'Video',
  props: {
    videoId: 'M7lc1UVf-VE',
    width: '100%',
    borderRadius: 12,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    shadow: 'none',
  },
};

// --- DIVIDER ---
interface DividerProps extends CommonStyleProps {
  color?: string;
  thickness?: number;
}

export const Divider: UserComponent<DividerProps> = ({ 
  color, thickness,
  marginTop, marginBottom, marginLeft, marginRight
}) => {
  const { connectors: { connect, drag }, selected, isHovered, id } = useNode((node) => ({
    selected: node.events.selected,
    isHovered: node.events.hovered,
    id: node.id
  }));

  const { openMenu } = useContextMenuStore();

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openMenu(e.clientX, e.clientY, id);
      }}
      className={`w-full transition-all 
        ${selected ? 'ring-2 ring-blue-500 ring-inset' : (isHovered ? 'ring-2 ring-green-400 ring-inset' : '')}
      `}
      style={{ 
        height: `${thickness}px`,
        backgroundColor: color,
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
        marginRight: `${marginRight}px`,
      }}
    />
  );
};

Divider.craft = {
  displayName: 'Divider',
  props: {
    color: '#e5e7eb',
    thickness: 1,
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 0,
    marginRight: 0,
    actionId: '',
  },
};

// --- GRID ---
interface GridProps extends CommonStyleProps {
  columns?: number;
  gap?: number;
  children?: React.ReactNode;
}

export const Grid: UserComponent<GridProps> = ({ 
  columns, gap, children,
  marginTop, marginBottom, marginLeft, marginRight, borderRadius, shadow 
}) => {
  const { connectors: { connect, drag }, selected, isHovered, id } = useNode((node) => ({
    selected: node.events.selected,
    isHovered: node.events.hovered,
    id: node.id
  }));

  const { openMenu } = useContextMenuStore();

  const { isDragging, device } = useEditor((state) => ({
    isDragging: state.events.dragged.size > 0,
    // @ts-ignore
    device: state.options.device
  }));

  const isMobile = device === 'mobile';
  const isDropTarget = isDragging && isHovered;

  const finalColumns = isMobile ? 1 : columns;
  const finalGap = isMobile ? Math.min(gap ?? 0, 16) : gap;

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openMenu(e.clientX, e.clientY, id);
      }}
      className={`grid w-full transition-all min-h-[50px] relative overflow-hidden
        ${selected ? 'ring-2 ring-blue-500 z-20' : (isHovered ? 'ring-2 ring-green-400 z-20' : '')}
      `}
      style={{ 
        gridTemplateColumns: `repeat(${finalColumns}, minmax(0, 1fr))`,
        gap: `${finalGap}px`,
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
        marginRight: `${marginRight}px`,
        borderRadius: `${borderRadius}px`,
        boxShadow: shadow === 'none' ? 'none' : shadow,
      }}
    >
      {isDropTarget && (
        <div className="absolute inset-0 z-50 bg-green-50/80 border-2 border-green-500 border-dashed flex items-center justify-center pointer-events-none">
           <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-widest animate-pulse">
             Soltar Aquí
           </span>
        </div>
      )}
      {children}
    </div>
  );
};

Grid.craft = {
  displayName: 'Grid',
  props: {
    columns: 2,
    gap: 20,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    borderRadius: 0,
    shadow: 'none',
  },
  rules: {
    canMoveIn: () => true,
  },
};

// --- TEMPLATE INJECTOR ---
interface TemplateInjectorProps {
  blockId: string;
}

export const TemplateInjector: UserComponent<TemplateInjectorProps> = ({ blockId }) => {
  const { id } = useNode();
  const { actions, query } = useEditor();
  const { getBlock } = useBlockStore();

  React.useEffect(() => {
    if (!blockId) return;
    
    const block = getBlock(blockId);
    if (!block) return;

    const timer = setTimeout(() => {
        try {
            console.log("INJECTION START:", block.name);
            const nodesMap = JSON.parse(block.data);
            
            // @ts-ignore
            console.log("Resolver keys:", Object.keys(query.options.resolver || {}));

            let rootContentId = null;
            if (nodesMap.ROOT && nodesMap.ROOT.nodes && nodesMap.ROOT.nodes.length > 0) {
                rootContentId = nodesMap.ROOT.nodes[0];
            } else {
                rootContentId = Object.keys(nodesMap).find(nid => nid !== 'ROOT' && (!nodesMap[nid].parent || !nodesMap[nodesMap[nid].parent]));
            }

            if (!rootContentId || !nodesMap[rootContentId]) {
                console.error("FAILED TO FIND ROOT CONTENT. MAP:", nodesMap);
                if (query.node(id).get()) actions.delete(id);
                return;
            }

            const nodes: Record<string, any> = {};
            
            Object.keys(nodesMap).forEach(nid => {
                if (nid === 'ROOT') return;
                try {
                    const sNode = nodesMap[nid];
                    const resolvedName = sNode.type.resolvedName;
                    
                    // @ts-ignore
                    if (!query.options.resolver[resolvedName]) {
                        console.error(`COMPONENT NOT IN RESOLVER: ${resolvedName}`);
                    }
                    
                    const node = query.parseSerializedNode(sNode).toNode();
                    nodes[nid] = node;
                } catch (err) {
                    console.error(`Error parsing node ${nid}:`, err);
                }
            });

            const nodeTree = {
                rootNodeId: rootContentId,
                nodes: nodes
            };

            const currentNode = query.node(id).get();
            if (currentNode && currentNode.data.parent) {
                const parentId = currentNode.data.parent;
                // @ts-ignore
                const index = currentNode.data.index;
                
                actions.addNodeTree(nodeTree, parentId, index);
                
                setTimeout(() => {
                    if (query.node(id).get()) {
                        actions.delete(id);
                    }
                }, 100);
            }
        } catch (e) {
            console.error("FATAL INJECTION ERROR:", e);
            if (query.node(id).get()) actions.delete(id);
        }
    }, 100);

    return () => clearTimeout(timer);
  }, [blockId, getBlock, query, actions, id]);

  return (
    <div className="w-full h-12 bg-blue-50 border border-blue-200 border-dashed rounded flex items-center justify-center text-blue-500 text-[10px] animate-pulse font-black uppercase tracking-widest shadow-inner">
        Inyectando bloque...
    </div>
  );
};

TemplateInjector.craft = {
    displayName: 'TemplateInjector',
    props: {
        blockId: ''
    }
};

// --- HERO BLOCK ---
interface HeroBlockProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  backgroundColor?: string;
}

export const HeroBlock: UserComponent<HeroBlockProps> = ({ title, subtitle, buttonText, backgroundColor }) => {
  const { connectors: { connect, drag }, selected, isHovered, id } = useNode((node) => ({
    selected: node.events.selected,
    isHovered: node.events.hovered,
    id: node.id
  }));

  const { openMenu } = useContextMenuStore();

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref!)); }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openMenu(e.clientX, e.clientY, id);
      }}
      className={`py-20 px-10 text-center transition-all ${selected ? 'ring-2 ring-blue-500' : (isHovered ? 'ring-2 ring-green-400' : '')}`}
      style={{ backgroundColor }}
    >
      <h1 className="text-5xl font-black mb-4 tracking-tight text-gray-900">{title}</h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">{subtitle}</p>
      <button className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold uppercase text-xs tracking-widest">
        {buttonText}
      </button>
    </div>
  );
};

HeroBlock.craft = {
  displayName: 'HeroBlock',
  props: {
    title: 'Nueva Colección 2026',
    subtitle: 'Descubre lo último en tecnología y diseño premium para tu estilo de vida.',
    buttonText: 'Explorar Tienda',
    backgroundColor: '#ffffff'
  }
};

// --- PRODUCT GRID ---
interface ProductGridBlockProps {
  columns?: number;
  title?: string;
}

export const ProductGridBlock: UserComponent<ProductGridBlockProps> = ({ columns, title }) => {
  const { connectors: { connect, drag }, selected, isHovered, id } = useNode((node) => ({
    selected: node.events.selected,
    isHovered: node.events.hovered,
    id: node.id
  }));

  const { openMenu } = useContextMenuStore();

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref!)); }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openMenu(e.clientX, e.clientY, id);
      }}
      className={`py-12 max-w-7xl mx-auto px-4 ${selected ? 'ring-2 ring-blue-500' : (isHovered ? 'ring-2 ring-green-400' : '')}`}
    >
      <h2 className="text-2xl font-bold mb-8 text-gray-900 uppercase tracking-tight">{title}</h2>
      <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-6`}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-50 rounded-3xl p-6 aspect-[4/5] flex flex-col justify-end border border-gray-100">
            <div className="w-full h-full bg-gray-200 rounded-2xl mb-4 animate-pulse" />
            <div className="h-4 w-2/3 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-1/3 bg-gray-300 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

ProductGridBlock.craft = {
  displayName: 'ProductGridBlock',
  props: {
    columns: 4,
    title: 'Productos Destacados'
  }
};

// --- FEATURES ---
interface FeaturesBlockProps {
  title?: string;
  itemCount?: number;
  backgroundColor?: string;
}

export const FeaturesBlock: UserComponent<FeaturesBlockProps> = ({ title, itemCount, backgroundColor }) => {
  const { connectors: { connect, drag }, selected, isHovered, id } = useNode((node) => ({
    selected: node.events.selected,
    isHovered: node.events.hovered,
    id: node.id
  }));

  const { openMenu } = useContextMenuStore();

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref!)); }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openMenu(e.clientX, e.clientY, id);
      }}
      className={`py-16 px-4 ${selected ? 'ring-2 ring-blue-500' : (isHovered ? 'ring-2 ring-green-400' : '')}`}
      style={{ backgroundColor }}
    >
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">{title}</h2>
        <div className={`grid grid-cols-1 md:grid-cols-${(itemCount ?? 0) > 4 ? 4 : itemCount} gap-8`}>
          {Array.from({ length: itemCount ?? 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Feature {i + 1}</h3>
              <p className="text-gray-500 text-sm">Description for this amazing feature goes here.</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


// --- DYNAMIC FORM BLOCK ---
interface DynamicFormBlockProps extends CommonStyleProps {
  dataSourceId?: string;
  tableId?: string;
  columns?: number;
}

export const DynamicFormBlock: UserComponent<DynamicFormBlockProps> = ({ 
  dataSourceId, tableId, columns,
  margin, marginTop, marginBottom, marginLeft, marginRight 
}) => {
  const { connectors: { connect, drag }, selected } = useNode((node) => ({
    selected: node.events.selected,
  }));

  return (
    <div 
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      className={`p-4 border border-dashed border-slate-300 rounded-lg bg-white relative ${selected ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
        marginRight: `${marginRight}px`,
      }}
    >
      {!dataSourceId || !tableId ? (
        <div className="flex flex-col items-center justify-center p-6 text-slate-400">
            <Database size={32} className="mb-2" />
            <span className="text-xs font-bold uppercase tracking-widest">Select a Data Source</span>
        </div>
      ) : (
        <DynamicForm 
            dataSourceId={dataSourceId} 
            tableId={tableId} 
            columns={columns}
            onSubmit={(data) => console.log("Form Submitted", data)}
        />
      )}
    </div>
  );
};

const DynamicFormSettings = () => {
  const { actions: { setProp }, dataSourceId, tableId, currentNodeProps } = useNode((node) => ({
    dataSourceId: node.data.props.dataSourceId,
    tableId: node.data.props.tableId,
    currentNodeProps: node.data.props
  }));
  
  const { sources } = useDataSourceStore();
  const activeSource = sources.find(s => s.id === dataSourceId);

  return (
    <div className="space-y-4">
        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Data Source</label>
            <select
                value={dataSourceId || ''}
                onChange={(e) => setProp((props: DynamicFormBlockProps) => props.dataSourceId = e.target.value)}
                className="w-full bg-slate-100 border-none rounded px-2 py-1 text-sm"
            >
                <option value="">Select Source...</option>
                {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
        </div>

        {activeSource && (
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Table</label>
                <select
                    value={tableId || ''}
                    onChange={(e) => setProp((props: DynamicFormBlockProps) => props.tableId = e.target.value)}
                    className="w-full bg-slate-100 border-none rounded px-2 py-1 text-sm"
                >
                    <option value="">Select Table...</option>
                    {activeSource.tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            </div>
        )}

        <div className="space-y-2">
             <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Columns</label>
                <span className="text-xs font-mono font-bold text-blue-600">{currentNodeProps.columns || 1}</span>
            </div>
            <input 
                type="range" 
                min="1" 
                max="4" 
                step="1"
                value={currentNodeProps.columns || 1}
                onChange={(e) => setProp((props: DynamicFormBlockProps) => props.columns = parseInt(e.target.value))}
                className="w-full accent-blue-600"
            />
             <div className="flex justify-between text-[10px] text-gray-400">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
            </div>
        </div>
    </div>
  );
};

DynamicFormBlock.craft = {
  displayName: 'Dynamic Form',
  props: {
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
  },
  related: {
    settings: DynamicFormSettings
  }
};
interface DataTableProps extends CommonStyleProps {
  datasourceId?: string;
  tableId?: string;
  rowsPerPage?: number;
  enableCreate?: boolean;
  enableEdit?: boolean;
  enableDelete?: boolean;
  visibleColumns?: string; // Comma-separated list of field names
  excludedColumns?: string;
  filters?: { field: string; operator: string; value: any }[];
  headerBgColor?: string;
  headerTextColor?: string;
  bodyBgColor?: string;
  bodyTextColor?: string;
  fontFamily?: string;
  onInsert?: string;
  onCreate?: string;
  onUpdate?: string;
  onDelete?: string;
}

export const DataTable: UserComponent<DataTableProps> = ({ 
  datasourceId, 
  tableId, 
  rowsPerPage, 
  enableCreate, 
  enableEdit, 
  enableDelete, 
  visibleColumns,
  excludedColumns,
  filters,
  headerBgColor,
  headerTextColor,
  bodyBgColor,
  bodyTextColor,
  fontFamily,
  onInsert,
  onCreate,
  onUpdate,
  onDelete,
  marginTop, 
  marginBottom, 
  marginLeft, 
  marginRight, 
  shadow, 
  borderRadius 
}) => {
  const { connectors: { connect, drag }, selected, isHovered, id } = useNode((node) => ({
    selected: node.events.selected,
    isHovered: node.events.hovered,
    id: node.id
  }));

  const { showToast, globalConfig } = useNotificationStore();
  const { openMenu } = useContextMenuStore();
  const { sources, getTable } = useDataSourceStore();
  
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSource = sources.find(s => s.id === datasourceId);
  const tableData = datasourceId && tableId ? getTable(datasourceId, tableId) : null;

  // Fetch Live Data
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
            limit: rowsPerPage,
            filters: filters // Pass filters to backend
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
    fetchData();
  }, [datasourceId, tableId, rowsPerPage, activeSource?.config, filters]);

  // CRUD Actions
  const handleCreate = async () => {
    if (!activeSource?.config || !tableData) return;
    
    // Simple Prompt UI for now - can be replaced by a modal later
    const columns = tableData.fields.map(f => f.name).filter(n => n !== 'id' && n !== 'created_at' && n !== 'updated_at');
    const input = window.prompt(`Enter JSON data for new record (Fields: ${columns.join(', ')})`, '{}');
    if (!input) return;

    try {
        const data = JSON.parse(input);
        const res = await fetch('http://localhost:4003/api/datasources/insert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                config: activeSource.config,
                table: { name: tableData.name, schema: tableData.schema || 'public' },
                data 
            })
        });
        const result = await res.json();
        if (result.success) {
            showToast(globalConfig.successMessage || 'Record created!');
            triggerEvent(onInsert, result.row); // Trigger onInsert
            // Refresh
            const currentRows = [...rows];
            currentRows.unshift(result.row);
            setRows(currentRows);
        } else {
            showToast(result.message || 'Action failed', 'error');
        }
    } catch (e) {
        showToast('Invalid JSON provided', 'error');
    }
  };

  const handleDelete = async (row: any) => {
    if (!activeSource?.config || !tableData || !confirm('Are you sure you want to delete this record?')) return;

    try {
        const res = await fetch('http://localhost:4003/api/datasources/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                config: activeSource.config,
                table: { name: tableData.name, schema: tableData.schema || 'public' },
                id: row.id || row.ID // Adjust based on PK
            })
        });
        const result = await res.json();
        if (result.success) {
            showToast('Record deleted successfully');
            triggerEvent(onDelete, row); // Trigger onDelete
            setRows(rows.filter(r => r.id !== row.id && r.ID !== row.ID));
        } else {
            showToast(result.message || 'Error deleting record', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Delete failed', 'error');
    }
  };

  const handleEdit = async (row: any) => {
    if (!activeSource?.config || !tableData) return;
    
    // Remove complex types or large fields for the prompt default value if needed
    const input = window.prompt(`Update JSON data for ID: ${row.id}`, JSON.stringify(row));
    if (!input) return;

    try {
        const data = JSON.parse(input);
        // Exclude ID from body data to avoid updating PK if not allowed, but here we just pass what user gave
        delete data.id; 
        delete data.ID;
        delete data.created_at;

        const res = await fetch('http://localhost:4003/api/datasources/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                config: activeSource.config,
                table: { name: tableData.name, schema: tableData.schema || 'public' },
                id: row.id || row.ID,
                data 
            })
        });
        const result = await res.json();
        if (result.success) {
            showToast('Record updated successfully');
            triggerEvent(onUpdate, result.row); // Trigger onUpdate
            setRows(rows.map(r => (r.id === row.id || r.ID === row.ID) ? result.row : r));
        } else {
            showToast(result.message || 'Action failed', 'error');
        }
    } catch (e) {
        showToast('Invalid JSON provided', 'error');
    }
  };

  // Filter fields based on visibleColumns prop OR use isSelected from store
  const displayFields = (tableData?.fields || []).filter(f => {
    // 1. Excluded Columns Check
    if (excludedColumns) {
        const excluded = excludedColumns.split(',').map(s => s.trim());
        if (excluded.includes(f.name)) return false;
    }

    if (visibleColumns) {
      return visibleColumns.split(',').map(s => s.trim()).includes(f.name);
    }
    // If no explicit prop, use the selection from Object Explorer
    return f.isSelected !== false; 
  });

  // Event Parser Helper
  const triggerEvent = (eventString: string | undefined, data: any) => {
    if (!eventString) return;
    
    // Pattern: {{page}.{tableID}.data :newData}
    // For now, we'll just log/alert the parsed intent as full implementation requires a global store refactor
    console.log(`[Event Triggered] ${eventString} with data:`, data);
    
    if (eventString.includes('{{page}')) {
        // Mocking the behavior for demonstration
        alert(`Global Event Triggered:\nAction: ${eventString}\nData: ${JSON.stringify(data, null, 2)}`);
    } else {
        // Fallback or other patterns
        alert(`Event: ${eventString}`);
    }
  };

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref!)); }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openMenu(e.clientX, e.clientY, id);
      }}
      className={`w-full overflow-hidden bg-white transition-all 
        ${selected ? 'ring-2 ring-blue-500 z-20' : (isHovered ? 'ring-2 ring-green-400 z-20' : '')}
      `}
      style={{
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
        marginRight: `${marginRight}px`,
        boxShadow: shadow === 'none' ? 'none' : shadow,
        borderRadius: `${borderRadius}px`,
        fontFamily: fontFamily || 'inherit', // Apply font family
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
             <button 
                 onClick={handleCreate}
                 className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20">
                + New Record
             </button>
        )}
      </div>
      
      <div className="overflow-x-auto">
        {tableData ? (
            <table className="w-full text-left text-sm text-gray-600">
                <thead className="text-xs uppercase font-semibold text-gray-500" style={{ backgroundColor: headerBgColor || '#f9fafb', color: headerTextColor }}>
                    <tr>
                        {displayFields.map((field) => (
                            <th key={field.name} className="px-6 py-3 whitespace-nowrap">{field.label}</th>
                        ))}
                        {(enableEdit || enableDelete) && <th className="px-6 py-3 text-right">Actions</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100" style={{ backgroundColor: bodyBgColor, color: bodyTextColor }}>
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
                                        {enableEdit && <button 
                                            onClick={() => handleEdit(row)}
                                            className="text-blue-500 hover:text-blue-700 text-xs font-bold uppercase">Edit</button>}
                                        {enableDelete && <button 
                                            onClick={() => handleDelete(row)}
                                            className="text-red-500 hover:text-red-700 text-xs font-bold uppercase">Del</button>}
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

DataTable.craft = {
  displayName: 'Data Table',
  props: {
    datasourceId: '',
    tableId: '',
    rowsPerPage: 5,
    enableCreate: true,
    enableEdit: true,
    enableDelete: true,
    visibleColumns: '',
    excludedColumns: '',
    filters: [],
    headerBgColor: '',
    headerTextColor: '',
    bodyBgColor: '',
    bodyTextColor: '',
    fontFamily: '',
    onInsert: '',
    onUpdate: '',
    onDelete: '',
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 0,
    marginRight: 0,
    shadow: 'sm',
    borderRadius: 12,
  },
};
