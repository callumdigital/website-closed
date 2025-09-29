import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import FormPage from './pages/FormPage'
import DisplayBoard from './pages/DisplayBoard'
import AdminPage from './pages/AdminPage'

// Get the base path from Vite's environment
const basename = import.meta.env.BASE_URL || '/'

function App() {

  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/:projectId/display" element={<DisplayBoard />} />
        <Route path="/:projectId" element={<FormPage />} />
        <Route path="/" element={<FormPage />} />
      </Routes>
    </Router>
  )
}

export default App