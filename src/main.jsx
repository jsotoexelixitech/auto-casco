import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { createAppRouter } from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { DataProvider } from './context/DataContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
// import { NexusGuard } from './nexus/NexusGuard.jsx'  // desactivado temporalmente
import './index.css'

const router = createAppRouter()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* <NexusGuard serviceName="Auto Casa Inspección"> */}
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <RouterProvider router={router} />
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    {/* </NexusGuard> */}
  </React.StrictMode>,
)
