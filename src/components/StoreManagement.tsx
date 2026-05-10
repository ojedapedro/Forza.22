
import React, { useState } from 'react';
import { Store, User, Role } from '../types';
import { Building2, Plus, Edit2, Trash2, MapPin, Users, X, Save, Search } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

interface StoreManagementProps {
  stores: Store[];
  users: User[];
  onAddStore: (store: Store) => Promise<void>;
  onUpdateStore: (store: Store) => Promise<void>;
  onDeleteStore: (id: string) => Promise<void>;
  currentUser: User | null;
}

export const StoreManagement: React.FC<StoreManagementProps> = ({
  stores,
  users,
  onAddStore,
  onUpdateStore,
  onDeleteStore,
  currentUser
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    onConfirm: () => void;
    title: string;
    message: string;
  }>({
    isOpen: false,
    onConfirm: () => {},
    title: '',
    message: ''
  });
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    municipality: '',
    location: '',
    matrixId: 'HQ-01',
    rifEnding: 0
  });

  const canManage = currentUser?.role === Role.SUPER_ADMIN || currentUser?.role === Role.PRESIDENT;

  const handleOpenForm = (store?: Store) => {
    if (store) {
      setEditingStore(store);
      setFormData({
        name: store.name,
        address: store.address || '',
        municipality: store.municipality || '',
        location: store.location || '',
        matrixId: store.matrixId || 'HQ-01',
        rifEnding: store.rifEnding || 0
      });
    } else {
      setEditingStore(null);
      setFormData({
        name: '',
        address: '',
        municipality: '',
        location: '',
        matrixId: 'HQ-01',
        rifEnding: 0
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const storeData: Store = {
      id: editingStore?.id || `S-${Date.now()}`,
      ...formData,
      status: editingStore?.status || 'En Regla',
      nextDeadline: editingStore?.nextDeadline || new Date().toISOString().split('T')[0],
      matrixId: formData.matrixId || 'HQ-01'
    };

    if (editingStore) {
      await onUpdateStore(storeData);
    } else {
      await onAddStore(storeData);
    }
    setIsFormOpen(false);
  };

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.municipality?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAssignedUsers = (storeId: string) => {
    return users.filter(u => u.storeIds?.includes(storeId) && (u.role === Role.ADMIN || u.role === Role.AUDITOR));
  };

  if (!canManage) {
    return (
      <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-2">
          <Building2 size={24} />
          <h2 className="text-xl font-bold">Gestión de Tiendas</h2>
        </div>
        <p className="text-slate-600 dark:text-slate-400">No tienes permisos para gestionar tiendas. Contacta a un Super Usuario o Presidencia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-50 flex items-center gap-2">
            <Building2 className="text-blue-500" /> Gestión de Tiendas
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Administra las sucursales y sus asignaciones de personal.</p>
        </div>
        <button 
          onClick={() => handleOpenForm()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus size={20} /> Nueva Tienda
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text"
          placeholder="Buscar por nombre o municipio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredStores.map(store => {
          const assignedUsers = getAssignedUsers(store.id);
          return (
            <div key={store.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-950 dark:text-slate-50">{store.name}</h3>
                    <div className="flex items-center gap-2">
                       <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin size={12} /> {store.municipality}, {store.location || 'Venezuela'}
                      </p>
                      {store.rifEnding !== undefined && (
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-mono font-bold">RIF: ***{store.rifEnding}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenForm(store)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: '¿Eliminar tienda?',
                        message: `¿Estás seguro de que deseas eliminar la tienda ${store.name}? Esta acción no se puede deshacer.`,
                        onConfirm: () => onDeleteStore(store.id)
                      });
                    }}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs">
                  <span className="text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider">Dirección:</span>
                  <p className="text-slate-700 dark:text-slate-300 mt-1">{store.address || 'Sin dirección registrada'}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-2">
                    <Users size={12} /> Personal Asignado ({assignedUsers.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {assignedUsers.length > 0 ? assignedUsers.map(user => (
                      <div key={user.id} className="flex items-center gap-2 px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-900 dark:text-slate-50 leading-tight">{user.name}</span>
                          <span className="text-[8px] text-slate-500 leading-tight">{user.role}</span>
                        </div>
                      </div>
                    )) : (
                      <p className="text-[10px] text-slate-400 italic">No hay administradores o auditores asignados.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-slate-950 dark:text-slate-50">
                {editingStore ? 'Editar Tienda' : 'Nueva Tienda'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre de la Tienda</label>
                <input 
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Tienda Central"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dirección</label>
                <textarea 
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  placeholder="Dirección completa..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Municipio/Alcaldía</label>
                  <input 
                    required
                    type="text"
                    value={formData.municipality}
                    onChange={(e) => setFormData({...formData, municipality: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Chacao"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Último Dígito RIF</label>
                  <select 
                    value={formData.rifEnding}
                    onChange={(e) => setFormData({...formData, rifEnding: Number(e.target.value)})}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[0,1,2,3,4,5,6,7,8,9].map(num => (
                      <option key={num} value={num}>Dígito {num}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado/Ubicación</label>
                <input 
                  required
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Caracas, DC"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  <Save size={18} /> {editingStore ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
};
