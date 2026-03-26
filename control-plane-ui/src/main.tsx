import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PayPalScriptProvider options={{ clientId: "test", intent: "subscription", vault: true }}>
      <App />
    </PayPalScriptProvider>
  </StrictMode>,
)

