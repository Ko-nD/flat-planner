import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { bootstrapTemplate } from './store/projectStore'

// Загружаем шаблон проекта (public/project.json) — один раз при старте.
// localStorage используется как rabotee state; шаблон нужен для «Сброс».
bootstrapTemplate();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
