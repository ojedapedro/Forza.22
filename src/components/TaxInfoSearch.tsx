import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader2, AlertCircle, ExternalLink, X } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface TaxInfoSearchProps {
  category: string;
  taxItem: string;
}

export const TaxInfoSearch: React.FC<TaxInfoSearchProps> = ({ category, taxItem }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [urls, setUrls] = React.useState<{ title: string; uri: string }[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const handleSearch = async () => {
    if (!category || !taxItem) return;
    
    setIsOpen(true);
    setIsLoading(true);
    setError(null);
    setResult(null);
    setUrls([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Busca la normativa más reciente, plazos y requisitos actualizados en Venezuela para el siguiente impuesto o trámite:
Categoría: ${category}
Trámite/Impuesto: ${taxItem}

Proporciona un resumen claro y conciso de las obligaciones actuales.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      setResult(response.text || 'No se encontró información.');

      // Extract URLs from grounding metadata
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const extractedUrls = chunks
          .map((chunk: any) => chunk.web)
          .filter((web: any) => web && web.uri && web.title);
        setUrls(extractedUrls);
      }
    } catch (err: any) {
      console.error('Error searching tax info:', err);
      setError('Ocurrió un error al buscar la información. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!category || !taxItem) return null;

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleSearch}
        className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-100 dark:border-blue-800"
      >
        <Search size={14} />
        Consultar Normativa Actualizada
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-3"
          >
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 relative">
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
              
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                <Search size={16} className="text-blue-500" />
                Resultados de Búsqueda (IA)
              </h4>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                  <Loader2 size={24} className="animate-spin mb-2 text-blue-500" />
                  <p className="text-xs">Buscando información actualizada...</p>
                </div>
              ) : error ? (
                <div className="flex items-start gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-w-none">
                    {result || ''}
                  </div>
                  
                  {urls.length > 0 && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Fuentes Consultadas</p>
                      <ul className="space-y-1">
                        {urls.map((url, idx) => (
                          <li key={idx}>
                            <a 
                              href={url.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink size={10} />
                              {url.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
