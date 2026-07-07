import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './brand/styles.css'
import './index.css'
import App from './App.jsx'
import { storageService } from './services/storageService'

storageService.init().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
});
