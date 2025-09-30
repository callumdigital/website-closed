import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import FormPage from './pages/FormPage'
import DisplayBoard from './pages/DisplayBoard'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ProtectedRoute from './components/ProtectedRoute'

// Get the base path from Vite's environment
const basename = import.meta.env.BASE_URL || '/'

function App() {

  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireRole="canViewProjects">
              <AdminPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/:projectId/display" element={<DisplayBoard />} />
        <Route path="/:projectId" element={<FormPage />} />
        <Route path="/" element={<FormPage />} />
      </Routes>
    </Router>
  )
}

export default App