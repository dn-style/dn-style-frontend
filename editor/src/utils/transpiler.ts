interface CraftNode {
  type: {
    resolvedName: string;
  };
  props: Record<string, any>;
  nodes: string[];
  linkedNodes: Record<string, string>;
  parent: string | null;
}

interface CraftState {
  [key: string]: CraftNode;
}

export const transpileToAstro = (json: string): string => {
  try {
    const state: CraftState = JSON.parse(json);

    // Components to import
    const componentsToImport = new Set<string>();

    // Recursive function to render nodes
    const renderNode = (id: string, depth: number = 0): string => {
      const node = state[id];
      if (!node) return '';

      let componentName = node.type.resolvedName;

      // Handle Component Name Mapping
      if (componentName === 'DataTable') componentName = 'DataTableBlock';
      // DynamicFormBlock already matches DynamicFormBlock.astro

      componentsToImport.add(componentName);

      const indent = '  '.repeat(depth);

      // Convert props to string
      const propsString = Object.entries(node.props)
        .filter(([key, value]) => {
          // Filter out internal Craft.js props or empty values if needed
          if (['children', 'custom', 'isCanvas', 'displayName'].includes(key)) return false;
          if (value === undefined || value === null) return false;
          return true;
        })
        .map(([key, value]) => {
          if (typeof value === 'string') {
            return `${key}="${value}"`;
          }
          if (typeof value === 'number' || typeof value === 'boolean') {
            return `${key}={${value}}`;
          }
          // Objects need JSON.stringify
          return `${key}={${JSON.stringify(value)}}`;
        })
        .join(' ');

      const children = node.nodes.map(childId => renderNode(childId, depth + 1)).join('\n');

      // Handle linked nodes (e.g., for components that have named slots or specific areas)
      // For now, we'll treat them as children if they exist
      const linkedChildren = Object.values(node.linkedNodes).map(childId => renderNode(childId, depth + 1)).join('\n');

      const allChildren = [children, linkedChildren].filter(c => c.trim().length > 0).join('\n');

      if (allChildren) {
        return `${indent}<${componentName} ${propsString}>\n${allChildren}\n${indent}</${componentName}>`;
      } else {
        return `${indent}<${componentName} ${propsString} />`;
      }
    };


    const content = renderNode('ROOT');

    // Generate imports
    const imports = Array.from(componentsToImport)
      .filter(name => !['Canvas', 'Element'].includes(name)) // Skip internal ones if any
      .map(name => `import ${name} from '../components/astro/${name}.astro';`)
      .join('\n');

    return `---
${imports}
---

<div class="generated-layout">
${content}
</div>
`;
  } catch (error) {
    console.error('Transpilation error:', error);
    return `<!-- Error transpiling DSL: ${error instanceof Error ? error.message : String(error)} -->`;
  }
};

export const transpileToHTML = (json: string, sourcesJson: string = '[]'): string => {
  try {
    // We don't need to recursively render here anymore because we'll use a Live Renderer
    // But we keep the function signature and return the Interactive Shell

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vista Previa Interactiva</title>
    <link rel="stylesheet" href="/preview-assets/assets/preview.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { margin: 0; background-color: #f3f4f6; }
        #root { min-height: 100vh; }
    </style>
</head>
<body>
    <div id="root"></div>
    
    <!-- Data Sources for the Renderer -->
    <script id="preview-sources" type="application/json">
        ${sourcesJson}
    </script>

    <!-- Data Source for the Renderer Layout -->
    <script id="preview-dsl" type="application/json">
        ${json}
    </script>

    <!-- Load the BUILT Interactive Renderer -->
    <script type="module" src="/preview-assets/assets/preview.js"></script>
</body>
</html>`;
  } catch (error) {
    console.error('HTML Shell generation error:', error);
    return `<h1>Error al generar shell interactiva</h1><p>${error instanceof Error ? error.message : String(error)}</p>`;
  }
};


