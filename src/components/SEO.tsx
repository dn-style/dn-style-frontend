import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  structuredData?: object;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description = "DN Style Store - Lo mejor en fragancias, electrónica y tecnología en Brandsen y todo el país.", 
  canonical, 
  ogType = "website",
  ogImage = "https://test.system4us.com/og-image.jpg", // Asegúrate de subir esta imagen
  structuredData 
}) => {
  const siteTitle = "DN STYLE STORE";
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const currentUrl = canonical || window.location.href;

  return (
    <Helmet>
      {/* Estándar */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Datos Estructurados (SERP Optimization) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
