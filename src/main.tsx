import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import '@fontsource-variable/inter'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './i18n.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <I18nProvider>
        <App />
      </I18nProvider>
    </HashRouter>
  </StrictMode>,
)
