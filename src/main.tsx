import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.info(`[Resume Builder] v${__APP_VERSION__} (${__COMMIT_HASH__}) built ${__BUILD_TIME__}`)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
