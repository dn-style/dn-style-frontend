import { useEffect, useRef } from 'react';
import { useEditor } from '@craftjs/core';
import { useContextMenuStore } from '../store/editorStore';
import { Copy, Clipboard, Trash2, Repeat, PaintBucket } from 'lucide-react';

export const ContextMenu = () => {
  const { 
    x, y, isOpen, nodeId, closeMenu, 
    copyToClipboard, clipboard, 
    copyStyleToClipboard, clipboardStyle 
  } = useContextMenuStore();
  
  const { actions, query } = useEditor();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeMenu]);

  if (!isOpen || !nodeId) return null;

  const node = query.node(nodeId).get();
  const isRoot = nodeId === 'ROOT';

  const handleDelete = () => {
    if (!isRoot) actions.delete(nodeId);
    closeMenu();
  };

  const handleDuplicate = () => {
    if (isRoot) return;
    const { data: { parent } } = node;
    if (parent) {
        // Simple duplication for single nodes (deep tree duplication requires more complex logic)
        // For now we duplicate the single block visually
        // A robust implementation would serialize the subtree and deserialize it
        const tree = query.node(nodeId).toNodeTree();
        // @ts-ignore
        const nodeData = query.parseNodeTree(tree);
        actions.addNodeTree(nodeData, parent);
    }
    closeMenu();
  };

  const handleCopy = () => {
    // Serialize the tree starting from this node
    // @ts-ignore
    const tree = query.node(nodeId).toNodeTree();
    // Use JSON stringify to store in our simple store
    copyToClipboard(JSON.stringify(tree));
    
    // Also Copy Styles specifically
    copyStyleToClipboard(node.data.props);
    closeMenu();
  };

  const handlePaste = () => {
    if (!clipboard) return;
    try {
        const tree = JSON.parse(clipboard);
        // @ts-ignore
        const nodeData = query.parseNodeTree(tree);
        
        // If pasting into a container (and the target IS a container/canvas), add inside
        // Otherwise add after
        if (node.data.isCanvas) {
            actions.addNodeTree(nodeData, nodeId);
        } else {
            const parent = node.data.parent;
            if (parent) {
                actions.addNodeTree(nodeData, parent);
            }
        }
    } catch (e) {
        console.error("Paste failed", e);
    }
    closeMenu();
  };

  const handlePasteStyle = () => {
    if (!clipboardStyle) return;
    actions.setProp(nodeId, (props: any) => {
        // Merge styles carefully. We don't want to overwrite children or structure
        // We iterate over known style keys or just shallow merge props
        Object.keys(clipboardStyle).forEach(key => {
            if (key !== 'children' && key !== 'key') {
                props[key] = clipboardStyle[key];
            }
        });
    });
    closeMenu();
  };

  return (
    <div 
      ref={menuRef}
      className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
      style={{ top: y, left: x }}
    >
      <div className="flex flex-col gap-0.5">
        <button 
            onClick={handleDuplicate}
            className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors w-full text-left"
        >
            <Repeat size={14} /> Duplicate
        </button>
        
        <div className="h-px bg-gray-100 my-0.5" />

        <button 
            onClick={handleCopy}
            className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors w-full text-left"
        >
            <Copy size={14} /> Copy
        </button>

        <button 
            onClick={handlePaste}
            disabled={!clipboard}
            className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors w-full text-left
                ${!clipboard ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}
            `}
        >
            <Clipboard size={14} /> Paste
        </button>

        <button 
            onClick={handlePasteStyle}
            disabled={!clipboardStyle}
            className={`flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors w-full text-left
                ${!clipboardStyle ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}
            `}
        >
            <PaintBucket size={14} /> Paste Style
        </button>

        <div className="h-px bg-gray-100 my-0.5" />

        <button 
            onClick={handleDelete}
            className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full text-left"
        >
            <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
};
