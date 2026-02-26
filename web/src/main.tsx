import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MsalProvider } from '@azure/msal-react'
import './index.css'
import App from './App.tsx'
import { msalInstance, initializeMsal } from './utils/msalConfig'
import { AuthProvider } from './contexts/AuthContext'

// Initialize MSAL before rendering
initializeMsal().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MsalProvider>
    </StrictMode>,
  )
}).catch(console.error);
