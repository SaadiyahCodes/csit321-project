//frontend/src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx';
import {CustomerAuthProvider} from './context/CustomerAuthContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
        <CustomerAuthProvider>
          <App />
        </CustomerAuthProvider>
    </LanguageProvider>
  </StrictMode>,
);