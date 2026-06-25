
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertTriangle className="text-red-500" size={24} />,
          button: 'bg-red-600 hover:bg-red-500 text-white',
          bg: 'bg-red-500/10'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="text-yellow-500" size={24} />,
          button: 'bg-yellow-600 hover:bg-yellow-500 text-white',
          bg: 'bg-yellow-500/10'
        };
      default:
        return {
          icon: <AlertTriangle className="text-blue-500" size={24} />,
          button: 'bg-blue-600 hover:bg-blue-500 text-white',
          bg: 'bg-blue-500/10'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className={`p-3 rounded-2xl ${styles.bg}`}>
                {styles.icon}
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-slate-400 leading-relaxed">
              {message}
            </p>
          </div>

          <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-2xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 ${styles.button}`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
