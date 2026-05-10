
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store } from '../types';
import { Maximize2, RefreshCw } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

interface VenezuelaMapProps {
  stores: Store[];
  selectedStoreIds?: string[];
  onStoreClick?: (id: string) => void;
}

export const VenezuelaMap: React.FC<VenezuelaMapProps> = ({ stores, selectedStoreIds = [], onStoreClick }) => {
  const [activeStore, setActiveStore] = React.useState<Store | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Use a placeholder key if not provided in env
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const MapContent = (isModal: boolean = false) => (
    <div className={`relative w-full ${isModal ? 'h-full' : 'h-[300px] sm:h-[450px]'} rounded-2xl overflow-hidden border border-slate-700/50`}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={{ lat: 10.4806, lng: -66.9036 }} // Centered on Caracas for a better initial view
          defaultZoom={isModal ? 7 : 6}
          mapId="venezuela-map"
          disableDefaultUI={true}
          zoomControl={true}
          gestureHandling={'greedy'}
          className="w-full h-full"
        >
          {stores.map((store) => {
            if (store.lat && store.lng) {
              const isSelected = selectedStoreIds.includes(store.id);
              const color = store.status === 'En Regla' ? '#10b981' : store.status === 'En Riesgo' ? '#f59e0b' : '#ef4444';
              
              return (
                <AdvancedMarker
                  key={store.id}
                  position={{ lat: store.lat, lng: store.lng }}
                  onClick={() => {
                    if (onStoreClick) onStoreClick(store.id);
                    setActiveStore(store);
                  }}
                >
                  <div className="relative flex items-center justify-center">
                    {isSelected && (
                      <div className="absolute w-10 h-10 rounded-full border-2 border-white border-dashed animate-[spin_4s_linear_infinite]" />
                    )}
                    <div className={`absolute w-8 h-8 rounded-full opacity-30 ${isSelected ? 'animate-pulse' : 'animate-ping'}`} style={{ backgroundColor: color }} />
                    
                    {/* Custom Pin Marker */}
                    <div className="relative group/pin">
                      <svg 
                        width="28" 
                        height="36" 
                        viewBox="0 0 24 32" 
                        className="drop-shadow-lg transition-transform group-hover/pin:scale-110"
                      >
                        <path 
                          d="M12 0C5.37 0 0 5.37 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37 18.63 0 12 0Z" 
                          fill={color} 
                          stroke={isSelected ? '#fff' : 'rgba(255,255,255,0.3)'} 
                          strokeWidth="1.5" 
                        />
                        <circle cx="12" cy="12" r="5" fill="white" />
                      </svg>
                    </div>
                  </div>
                </AdvancedMarker>
              );
            }
            return null;
          })}
        </Map>
      </APIProvider>

      {/* Custom Tooltip Overlay */}
      <AnimatePresence>
          {activeStore && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-6 left-6 z-50 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[220px]"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                    activeStore.status === 'En Regla' ? 'bg-emerald-500' : 
                    activeStore.status === 'En Riesgo' ? 'bg-amber-500' : 'bg-red-500'
                  }`}></div>
                  <p className="font-bold text-white text-sm tracking-tight">{activeStore.name}</p>
                </div>
                <button onClick={() => setActiveStore(null)} className="text-slate-400 hover:text-white transition-colors">&times;</button>
              </div>
              <div className="space-y-1.5">
                  <p className="text-[11px] text-slate-400 flex items-center gap-2">
                    <Maximize2 size={12} className="text-slate-500" /> {activeStore.location}
                  </p>
                  <p className="text-[10px] text-slate-500">{activeStore.address}</p>
                  <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Estado Fiscal</span>
                    <span className={`text-[11px] font-black uppercase tracking-wider ${
                      activeStore.status === 'En Regla' ? 'text-emerald-400' : 
                      activeStore.status === 'En Riesgo' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {activeStore.status}
                    </span>
                  </div>
              </div>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-4 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl"
      >
        <div className="flex justify-between items-center w-full mb-6 z-10">
          <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-white tracking-tight">Cobertura Nacional</h3>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all active:scale-95"
            title="Expandir Mapa"
          >
            <Maximize2 size={18} />
          </button>
        </div>

        {MapContent(false)}

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-6 text-[11px] mt-6 bg-slate-800/30 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-700/30">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]"></span>
            <span className="text-slate-200 font-bold tracking-wide">Cumplimiento Total</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]"></span>
            <span className="text-slate-200 font-bold tracking-wide">Alerta de Plazo</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]"></span>
            <span className="text-slate-200 font-bold tracking-wide">Vencimiento Crítico</span>
          </div>
        </div>

        {/* Interaction Hint */}
        <div className="absolute bottom-6 right-8 text-[10px] text-slate-500 font-medium tracking-wide opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
          <RefreshCw size={12} className="animate-spin-slow" />
          Navegación Interactiva Habilitada
        </div>
      </motion.div>

      {/* Full Screen Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-slate-950/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 w-full max-w-7xl h-full max-h-[90vh] rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col relative"
            >
              <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500">
                    <Maximize2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Cobertura Nacional</h2>
                    <p className="text-slate-500 text-sm font-medium">Vista expandida de la red de sucursales</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-12 h-12 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg"
                >
                  &times;
                </button>
              </div>
              
              <div className="flex-1 relative">
                {MapContent(true)}
              </div>

              <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex justify-center">
                <div className="flex flex-wrap justify-center gap-8 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"></span>
                    <span className="text-slate-300 font-bold uppercase tracking-widest">Cumplimiento Total</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]"></span>
                    <span className="text-slate-300 font-bold uppercase tracking-widest">Alerta de Plazo</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]"></span>
                    <span className="text-slate-300 font-bold uppercase tracking-widest">Vencimiento Crítico</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VenezuelaMap;
