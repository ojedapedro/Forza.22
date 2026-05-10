
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Payment } from '../types';

// Make sure to call loadStripe outside of a component’s render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

interface CheckoutFormProps {
  payment: Payment;
  onSuccess: () => void;
  onCancel: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ payment, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: window.location.origin,
      },
      redirect: 'if_required',
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "Ocurrió un error con el pago.");
      } else {
        setMessage("Ocurrió un error inesperado.");
      }
    } else {
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement id="payment-element" options={{ layout: 'tabs' }} />
      
      {message && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} />
          {message}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          disabled={isLoading || !stripe || !elements}
          id="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            `Pagar $${payment.amount.toLocaleString()}`
          )}
        </button>
      </div>
    </form>
  );
};

interface StripePaymentModalProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentId: string) => void;
}

export const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  payment,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && payment) {
      setIsSuccess(false);
      setError(null);
      setClientSecret("");
      
      // Create PaymentIntent as soon as the modal opens
      fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: payment.amount,
          paymentId: payment.id 
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setClientSecret(data.clientSecret);
          }
        })
        .catch((err) => {
          console.error("Error fetching client secret:", err);
          setError("Error al conectar con el servidor de pagos.");
        });
    }
  }, [isOpen, payment]);

  if (!isOpen || !payment) return null;

  const handleSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => {
      onPaymentSuccess(payment.id);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Procesar Pago</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{payment.specificType} - {payment.storeName}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {isSuccess ? (
            <div className="py-8 flex flex-col items-center text-center space-y-4 animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                <CheckCircle2 size={40} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">¡Pago Exitoso!</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">El pago ha sido procesado correctamente.</p>
              </div>
            </div>
          ) : error ? (
            <div className="py-8 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center">
                <AlertCircle size={40} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Error de Configuración</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{error}</p>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white py-2 rounded-lg font-bold"
              >
                Cerrar
              </button>
            </div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
              <CheckoutForm 
                payment={payment} 
                onSuccess={handleSuccess} 
                onCancel={onClose} 
              />
            </Elements>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-slate-500 dark:text-slate-400 font-medium">Iniciando pasarela de pago...</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
            <span className="text-[10px] font-medium uppercase tracking-wider">Pago Seguro vía Stripe</span>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Total a Pagar</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">${payment.amount.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
