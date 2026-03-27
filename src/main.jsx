import { createRoot } from 'react-dom/client'
console.log('MINIMAL_MAIN: Executing');
createRoot(document.getElementById('root')).render(<h1 style={{color: 'white', padding: '50px'}}>SYSTEM LIVE - MINIMAL MOUNT</h1>)
/*
import { StrictMode } from 'react'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
*/
