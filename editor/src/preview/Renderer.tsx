import { Editor, Frame } from '@craftjs/core';
import { ToastContainer } from '../components/Toast';
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
} from '../components/user/Blocks';

interface PreviewRendererProps {
  json: string;
}

export const PreviewRenderer = ({ json }: PreviewRendererProps) => {
  const resolver = { 
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
  };

  return (
    <div className="min-h-screen bg-white">
      <Editor resolver={resolver} enabled={false}>
        <Frame data={json} />
      </Editor>
      <ToastContainer />
    </div>
  );
};
