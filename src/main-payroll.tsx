import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PayrollStandaloneApp } from './apps/payroll/PayrollStandaloneApp';
import './index.css';
import { ThemeProvider } from './components/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ExchangeRateProvider } from './contexts/ExchangeRateContext';

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);

  root.render(
    <StrictMode>
      <ErrorBoundary>
        <ThemeProvider>
          <ExchangeRateProvider exchangeRate={1}>
            <PayrollStandaloneApp />
          </ExchangeRateProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>
  );
} else {
  console.error("FATAL: Element with id 'root' not found in the payroll document.");
}
