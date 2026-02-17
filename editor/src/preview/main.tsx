import React from 'react';
import ReactDOM from 'react-dom/client';
import { PreviewRenderer } from './Renderer';
import { useDataSourceStore } from '../store/dataSourceStore';
import '../index.css';

// Rehydrate Data Sources
const sourcesElement = document.getElementById('preview-sources');
try {
  const sources = JSON.parse(sourcesElement?.textContent || '[]');
  useDataSourceStore.setState({ sources });
} catch (e) {
  console.error("Error rehydrating sources:", e);
}

const dslElement = document.getElementById('preview-dsl');
const json = dslElement?.textContent || '{}';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PreviewRenderer json={json} />
  </React.StrictMode>
);
