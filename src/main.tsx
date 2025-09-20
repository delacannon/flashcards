import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { FlashcardProvider } from '@/contexts/FlashcardContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FlashcardProvider>
      <App />
    </FlashcardProvider>
  </StrictMode>,
)
