
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SaaSPlatformShell } from './SaaSPlatformShell';
import './index.css';
import { ThemeProvider } from './components/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ExchangeRateProvider } from './contexts/ExchangeRateContext';

// Suppress defaultProps deprecation warning caused by Recharts/React 18 conflicts
const suppressDefaultPropsWarning = (originalConsoleFn: (...args: any[]) => void) => {
  return (...args: any[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (msg.includes('defaultProps will be removed')) {
      return;
    }
    originalConsoleFn(...args);
  };
};

console.error = suppressDefaultPropsWarning(console.error);
console.warn = suppressDefaultPropsWarning(console.warn);

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);

  root.render(
    <StrictMode>
      <ErrorBoundary>
        <ThemeProvider>
          <ExchangeRateProvider exchangeRate={1}>
            <SaaSPlatformShell />
          </ExchangeRateProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>
  );
} else {
  console.error("FATAL: Element with id 'root' not found in the document.");
}
