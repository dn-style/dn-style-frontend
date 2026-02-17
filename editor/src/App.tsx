import { AppEditor } from './components/AppEditor'
import { CustomBlockEditor } from './components/CustomBlockEditor'
import { ConfigPage } from './pages/ConfigPage'
import './index.css'
import { useState } from 'react'
import { ToastContainer } from './components/Toast'

function App() {
  const [view, setView] = useState<'main' | 'block-editor' | 'config'>('main');
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  const handleOpenBlockEditor = (blockId: string | null = null) => {
    setEditingBlockId(blockId);
    setView('block-editor');
  };

  const handleBackToMain = () => {
    setEditingBlockId(null);
    setView('main');
  };

  const handleOpenConfig = () => {
    setView('config');
  };

  return (
    <>
      {view === 'main' ? (
        // @ts-ignore
        <AppEditor onOpenBlockEditor={handleOpenBlockEditor} onOpenConfig={handleOpenConfig} />
      ) : view === 'block-editor' ? (
        <CustomBlockEditor blockId={editingBlockId} onBack={handleBackToMain} />
      ) : (
        <ConfigPage onBack={handleBackToMain} />
      )}
      <ToastContainer />
    </>
  )
}

export default App