import React, { useState, useEffect } from 'react'
import { projectService, noteService, realtimeService } from '../services/supabaseClient.jsx'
import { formService, formUtils, DEFAULT_FORM_CONFIG } from '../services/formService.jsx'
import BrandingEditor from '../components/BrandingEditor.jsx'
import UserManagement from '../components/UserManagement.jsx'
import { authService, permissions, USER_ROLES } from '../services/authService.jsx'

// Utility function to format timestamps in full date/time format for admin
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'No timestamp'
  
  const noteTime = new Date(timestamp)
  return noteTime.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

const AdminPage = ({ user, userProfile }) => {
  console.log('🏗️ AdminPage component rendering...', { user, userProfile })
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [newProject, setNewProject] = useState({ 
    name: '', 
    description: '', 
    customUrl: '', 
    auto_approve: false, 
    show_timestamps: true 
  })
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [filter, setFilter] = useState('all') // all, pending, approved, rejected
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState('active') // active, archived
  const [archivedProjects, setArchivedProjects] = useState([])
  const [showProjectSettings, setShowProjectSettings] = useState(false)
  const [projectSettings, setProjectSettings] = useState({ auto_approve: false, show_timestamps: true })
  const [showBrandingEditor, setShowBrandingEditor] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [editText, setEditText] = useState('')
  const [showFormManagement, setShowFormManagement] = useState(false)
  const [formSettings, setFormSettings] = useState({
    title: 'The Wall',
    subtitle: 'Share your thoughts and ideas',
    placeholder: 'Write your note here...',
    maxLength: 280,
    buttonText: 'Add to The Wall',
    successTitle: 'Thank you!',
    successMessage: 'Your note has been added to The Wall.',
    showCharacterCount: true,
    allowMultipleSubmissions: true
  })
  const [formConfig, setFormConfig] = useState(DEFAULT_FORM_CONFIG)

  // Add error boundary
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Admin</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔍 Admin: Loading projects...')
        const [projectsData, archivedData] = await Promise.all([
          projectService.getProjects(),
          projectService.getArchivedProjects()
        ])
        console.log('📊 Admin: Projects loaded:', projectsData)
        console.log('📦 Admin: Archived projects loaded:', archivedData)
        setProjects(projectsData)
        setArchivedProjects(archivedData)
        
        // Load notes for the first project by default
        if (projectsData.length > 0) {
          console.log('📝 Admin: Loading notes for project:', projectsData[0].id)
          const notesData = await noteService.getAllNotes(projectsData[0].id)
          console.log('📋 Admin: Notes loaded:', notesData)
          setNotes(notesData)
          setSelectedProject(projectsData[0])
        }
      } catch (error) {
        console.error('❌ Admin: Error loading data:', error)
        setError(error)
      } finally {
        setIsLoading(false)
      }
    }
    
    try {
      loadData()
    } catch (error) {
      console.error('❌ Admin: Error in useEffect:', error)
      setError(error)
      setIsLoading(false)
    }
  }, [])

  // Load notes when a different project is selected
  const handleProjectSelect = async (project) => {
    console.log('🔄 Admin: Switching to project:', project.id)
    setSelectedProject(project)
    
    try {
      const notesData = await noteService.getAllNotes(project.id)
      console.log('📋 Admin: Notes loaded for', project.id, ':', notesData)
      setNotes(notesData)
      updateStats(notesData)
    } catch (error) {
      console.error('❌ Admin: Error loading notes for project:', error)
    }
  }

  // Update statistics
  const updateStats = (notesData) => {
    const stats = {
      total: notesData.length,
      pending: notesData.filter(note => note.status === 'pending').length,
      approved: notesData.filter(note => note.status === 'approved').length,
      rejected: notesData.filter(note => note.status === 'rejected').length
    }
    setStats(stats)
  }

  // Generate URL from project name
  const generateUrl = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  }

  // Handle name change and auto-generate URL
  const handleNameChange = (name) => {
    const customUrl = generateUrl(name)
    setNewProject({ ...newProject, name, customUrl })
  }

  // Create new project
  const handleCreateProject = async (e) => {
    e.preventDefault()
    if (!newProject.name.trim()) return

    try {
      const projectData = {
        id: newProject.customUrl || generateUrl(newProject.name),
        name: newProject.name.trim(),
        description: newProject.description.trim(),
        status: 'active',
        auto_approve: newProject.auto_approve,
        show_timestamps: newProject.show_timestamps
      }
      
      const createdProject = await projectService.createProject(projectData)
      console.log('✅ Project created:', createdProject)
      
      // Refresh projects list
      const projectsData = await projectService.getProjects()
      setProjects(projectsData)
      
      // Reset form
      setNewProject({ name: '', description: '', customUrl: '', auto_approve: false, show_timestamps: true })
      setShowCreateProject(false)
    } catch (error) {
      console.error('❌ Error creating project:', error)
      // Show user-friendly error message
      alert(`Failed to create project: ${error.message || 'Unknown error'}`)
    }
  }

  // Bulk approve all pending notes
  const handleBulkApprove = async () => {
    const pendingNotes = notes.filter(note => note.status === 'pending')
    console.log('✅ Bulk approving', pendingNotes.length, 'notes')
    
    for (const note of pendingNotes) {
      try {
        await noteService.updateNoteStatus(note.id, 'approved')
        setNotes(prev => prev.map(n => 
          n.id === note.id ? { ...n, status: 'approved' } : n
        ))
      } catch (error) {
        console.error('❌ Error approving note', note.id, ':', error)
      }
    }
    
    updateStats(notes.map(note => 
      pendingNotes.some(pn => pn.id === note.id) 
        ? { ...note, status: 'approved' } 
        : note
    ))
  }

  // Filter notes based on status
  const filteredNotes = notes.filter(note => {
    if (filter === 'all') return true
    return note.status === filter
  })

  // Copy URL to clipboard
  const copyUrl = async (projectId) => {
    const fullUrl = `thewall.callum.digital/${projectId}`
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000) // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy URL:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = fullUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Export functions
  const exportToCSV = () => {
    if (!selectedProject) return
    
    const csvData = filteredNotes.map(note => ({
      'Note ID': note.id,
      'Text': note.text,
      'Color': note.color,
      'Status': note.status,
      'Created': formatTimestamp(note?.created_at || note?.timestamp),
      'Project': selectedProject.name
    }))
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedProject.name}-notes.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportToPDF = () => {
    if (!selectedProject) return
    
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank')
    const notesHtml = filteredNotes.map(note => `
      <div class="sticky-note ${note.color || 'yellow'}" style="
        background: linear-gradient(135deg, #fef3c7, #fde68a);
        border: 2px solid #f59e0b;
        border-radius: 8px;
        padding: 16px;
        margin: 8px;
        display: inline-block;
        width: 200px;
        height: 150px;
        vertical-align: top;
        page-break-inside: avoid;
      ">
        <p style="font-family: 'Fredoka', sans-serif; font-size: 14px; margin: 0; line-height: 1.4;">
          ${note.text}
        </p>
        <div style="font-size: 10px; color: #666; margin-top: 8px;">
          ${formatTimestamp(note?.created_at || note?.timestamp)}
        </div>
      </div>
    `).join('')
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${selectedProject.name} - The Wall Export</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&display=swap');
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .notes-container { display: flex; flex-wrap: wrap; }
            .sticky-note.blue { background: linear-gradient(135deg, #dbeafe, #bfdbfe); border-color: #3b82f6; }
            .sticky-note.green { background: linear-gradient(135deg, #d1fae5, #a7f3d0); border-color: #10b981; }
            .sticky-note.pink { background: linear-gradient(135deg, #fce7f3, #fbcfe8); border-color: #ec4899; }
            .sticky-note.purple { background: linear-gradient(135deg, #e9d5ff, #ddd6fe); border-color: #8b5cf6; }
            .sticky-note.orange { background: linear-gradient(135deg, #fed7aa, #fdba74); border-color: #f97316; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${selectedProject.name}</h1>
            <p>Exported on ${new Date().toLocaleString()}</p>
            <p>Total Notes: ${filteredNotes.length}</p>
          </div>
          <div class="notes-container">
            ${notesHtml}
          </div>
        </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  const printWall = () => {
    if (!selectedProject) return
    exportToPDF() // Same as PDF export but opens print dialog
  }

  // Archive/Unarchive functions
  const handleArchiveProject = async (projectId) => {
    if (!confirm('Are you sure you want to archive this project? It will be moved to the archived section.')) {
      return
    }

    try {
      await projectService.updateProjectStatus(projectId, 'archived')
      console.log('✅ Project archived:', projectId)
      
      // Refresh both active and archived projects
      const [projectsData, archivedData] = await Promise.all([
        projectService.getProjects(),
        projectService.getArchivedProjects()
      ])
      setProjects(projectsData)
      setArchivedProjects(archivedData)
      
      // If the archived project was selected, clear selection
      if (selectedProject?.id === projectId) {
        setSelectedProject(null)
        setNotes([])
        setStats({ total: 0, pending: 0, approved: 0, rejected: 0 })
      }
    } catch (error) {
      console.error('❌ Error archiving project:', error)
      alert(`Failed to archive project: ${error.message || 'Unknown error'}`)
    }
  }

  const handleUnarchiveProject = async (projectId) => {
    try {
      await projectService.updateProjectStatus(projectId, 'active')
      console.log('✅ Project unarchived:', projectId)
      
      // Refresh both active and archived projects
      const [projectsData, archivedData] = await Promise.all([
        projectService.getProjects(),
        projectService.getArchivedProjects()
      ])
      setProjects(projectsData)
      setArchivedProjects(archivedData)
    } catch (error) {
      console.error('❌ Error unarchiving project:', error)
      alert(`Failed to unarchive project: ${error.message || 'Unknown error'}`)
    }
  }

  // Project settings functions
  const handleOpenProjectSettings = () => {
    if (selectedProject) {
      setProjectSettings({
        auto_approve: selectedProject.auto_approve || false,
        show_timestamps: selectedProject.show_timestamps !== false // Default to true
      })
      setShowProjectSettings(true)
    }
  }

  const handleSaveProjectSettings = async () => {
    if (!selectedProject) return

    try {
      await projectService.updateProjectSettings(selectedProject.id, projectSettings)
      console.log('✅ Project settings updated:', projectSettings)
      
      // Update local project data
      const updatedProject = { ...selectedProject, ...projectSettings }
      setSelectedProject(updatedProject)
      
      // Update projects list
      const projectsData = await projectService.getProjects()
      setProjects(projectsData)
      
      setShowProjectSettings(false)
    } catch (error) {
      console.error('❌ Error updating project settings:', error)
      alert(`Failed to update project settings: ${error.message || 'Unknown error'}`)
    }
  }

  const handleApprove = async (noteId) => {
    console.log('✅ Admin: Approving note:', noteId)
    try {
      // Update in Supabase
      await noteService.updateNoteStatus(noteId, 'approved')
      
      // Update local state
      const updatedNotes = notes.map(note => 
        note.id === noteId ? { ...note, status: 'approved' } : note
      )
      setNotes(updatedNotes)
      updateStats(updatedNotes)
      
      console.log('✅ Note approved successfully')
    } catch (error) {
      console.error('❌ Error approving note:', error)
      // Still update local state even if Supabase fails
      const updatedNotes = notes.map(note => 
        note.id === noteId ? { ...note, status: 'approved' } : note
      )
      setNotes(updatedNotes)
      updateStats(updatedNotes)
    }
  }

  const handleReject = async (noteId) => {
    console.log('❌ Admin: Rejecting note:', noteId)
    try {
      // Update in Supabase
      await noteService.updateNoteStatus(noteId, 'rejected')
      
      // Update local state
      const updatedNotes = notes.map(note => 
        note.id === noteId ? { ...note, status: 'rejected' } : note
      )
      setNotes(updatedNotes)
      updateStats(updatedNotes)
      
      console.log('✅ Note rejected successfully')
    } catch (error) {
      console.error('❌ Error rejecting note:', error)
      // Still update local state even if Supabase fails
      const updatedNotes = notes.map(note => 
        note.id === noteId ? { ...note, status: 'rejected' } : note
      )
      setNotes(updatedNotes)
      updateStats(updatedNotes)
    }
  }

  // Note action handlers for admin
  const handleRemoveNote = async (noteId) => {
    if (!confirm('Are you sure you want to remove this note? This action cannot be undone.')) {
      return
    }

    try {
      await noteService.removeNote(noteId)
      setNotes(prev => prev.filter(note => note.id !== noteId))
      updateStats(notes.filter(note => note.id !== noteId))
      console.log('✅ Note removed successfully')
    } catch (error) {
      console.error('❌ Error removing note:', error)
      alert('Failed to remove note. Please try again.')
    }
  }

  const handleEditNote = (note) => {
    setEditingNote(note.id)
    setEditText(note.text)
  }

  const handleSaveEdit = async () => {
    if (!editText.trim()) return

    try {
      await noteService.updateNoteText(editingNote, editText.trim())
      setNotes(prev => prev.map(note => 
        note.id === editingNote ? { ...note, text: editText.trim() } : note
      ))
      setEditingNote(null)
      setEditText('')
      console.log('✅ Note updated successfully')
    } catch (error) {
      console.error('❌ Error updating note:', error)
      alert('Failed to update note. Please try again.')
    }
  }

  const handleCancelEdit = () => {
    setEditingNote(null)
    setEditText('')
  }

  // Form field management functions
  const addFormField = (type) => {
    const newField = formUtils.createField(type)
    setFormConfig({
      ...formConfig,
      fields: [...formConfig.fields, newField]
    })
  }

  const removeFormField = (fieldId) => {
    setFormConfig({
      ...formConfig,
      fields: formConfig.fields.filter(field => field.id !== fieldId)
    })
  }

  const updateFormField = (fieldId, updates) => {
    setFormConfig({
      ...formConfig,
      fields: formConfig.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    })
  }

  const moveFormField = (fieldId, direction) => {
    const currentIndex = formConfig.fields.findIndex(field => field.id === fieldId)
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    if (newIndex >= 0 && newIndex < formConfig.fields.length) {
      const newFields = formUtils.moveField(formConfig.fields, currentIndex, newIndex)
      setFormConfig({
        ...formConfig,
        fields: newFields
      })
    }
  }

  // Load form configuration when project changes
  useEffect(() => {
    if (selectedProject) {
      const loadFormConfig = async () => {
        try {
          const config = await formService.getFormConfig(selectedProject.id)
          setFormConfig(config)
        } catch (error) {
          console.error('Error loading form config:', error)
        }
      }
      loadFormConfig()
    }
  }, [selectedProject])

  // Save form configuration
  const saveFormConfig = async () => {
    if (!selectedProject) return
    
    try {
      await formService.saveFormConfig(selectedProject.id, formConfig)
      console.log('Form configuration saved successfully')
      setShowFormManagement(false)
    } catch (error) {
      console.error('Error saving form config:', error)
      alert('Failed to save form configuration. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
          <p className="text-sm text-gray-500 mt-2">Projects: {projects.length}, Notes: {notes.length}</p>
        </div>
      </div>
    )
  }

  console.log('🎨 AdminPage rendering with:', { projects: projects.length, notes: notes.length, selectedProject: selectedProject?.id })

  // If no projects loaded, show a message
  if (!isLoading && projects.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Projects Found</h2>
          <p className="text-gray-600 mb-4">No projects are available. Check your Supabase connection.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">📝</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">The Wall</h1>
                  <p className="text-sm text-gray-600">Admin Panel</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* User info */}
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                  {userProfile?.display_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {userProfile?.display_name || user?.email || 'User'}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">{userProfile?.role || 'viewer'}</div>
                </div>
              </div>

              {/* User Management button (Owner only) */}
              {permissions.canManageUsers(userProfile?.role) && (
                <button
                  onClick={() => setShowUserManagement(true)}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium border border-purple-600"
                >
                  👥 Users
                </button>
              )}

              {/* Sign Out button */}
              <button
                onClick={async () => {
                  await authService.signOut()
                  window.location.href = '/login'
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium border border-red-600"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Projects Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 text-sm rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium border border-blue-600"
                >
                  + New Project
                </button>
              </div>
            
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
                onClick={() => setViewMode('active')}
                className={`flex-1 px-4 py-2 text-sm rounded-md transition-all duration-200 font-medium ${
                  viewMode === 'active'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Active ({projects.length})
              </button>
              <button
                onClick={() => setViewMode('archived')}
                className={`flex-1 px-4 py-2 text-sm rounded-md transition-all duration-200 font-medium ${
                  viewMode === 'archived'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Archived ({archivedProjects.length})
              </button>
            </div>
            
            <div className="space-y-3">
              {(viewMode === 'active' ? projects : archivedProjects).map((project) => (
                <div
                  key={project.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    selectedProject?.id === project.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleProjectSelect(project)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{project.name}</h3>
                        <p className="text-sm text-gray-500">{project.noteCount || 0} notes</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        project.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="mt-3 flex gap-2">
                    {viewMode === 'active' ? (
                      <button
                        onClick={() => handleArchiveProject(project.id)}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                        title="Archive project"
                      >
                        📦 Archive
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnarchiveProject(project.id)}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                        title="Unarchive project"
                      >
                        📤 Unarchive
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {viewMode === 'active' && projects.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No active projects</p>
                  <button
                    onClick={() => setShowCreateProject(true)}
                    className="mt-2 text-blue-500 hover:text-blue-600 text-sm"
                  >
                    Create your first project
                  </button>
                </div>
              )}
              
              {viewMode === 'archived' && archivedProjects.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No archived projects</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {selectedProject ? (
              <>
                {/* Project Header with Quick Actions */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h2>
                        {selectedProject.auto_approve && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                            ⚡ Auto-Approval
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600">{selectedProject.description || 'No description'}</p>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowBrandingEditor(true)}
                        className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                      >
                        🎨 Branding
                      </button>
                      <button
                        onClick={() => window.open(`${selectedProject.id}/display`, '_blank')}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                      >
                        👁️ View Wall
                      </button>
                      <button
                        onClick={() => window.open(`/${selectedProject.id}`, '_blank')}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        ✏️ Add Note
                      </button>
                      <button
                        onClick={handleOpenProjectSettings}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                      >
                        ⚙️ Settings
                      </button>
                      <button
                        onClick={() => setShowFormManagement(true)}
                        className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm"
                      >
                        📝 Form
                      </button>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                      <div className="text-sm text-gray-600">Total Notes</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                      <div className="text-sm text-gray-600">Pending</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                      <div className="text-sm text-gray-600">Approved</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                      <div className="text-sm text-gray-600">Rejected</div>
                    </div>
                  </div>

                  {/* Project URL Sharing */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">Share Project</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-blue-700 mb-2">Form URL (for participants):</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-sm text-blue-600 bg-white p-2 rounded border break-all">
                            thewall.callum.digital/{selectedProject.id}
                          </code>
                          <button
                            onClick={() => copyUrl(selectedProject.id)}
                            className={`px-3 py-2 text-sm rounded transition-colors ${
                              copied 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            {copied ? '✓ Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-blue-700 mb-2">Display URL (for viewing wall):</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-sm text-blue-600 bg-white p-2 rounded border break-all">
                            thewall.callum.digital/{selectedProject.id}/display
                          </code>
                          <button
                            onClick={() => copyUrl(`${selectedProject.id}/display`)}
                            className={`px-3 py-2 text-sm rounded transition-colors ${
                              copied 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            {copied ? '✓ Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Management */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Notes Management</h3>
                    
                    <div className="flex gap-2">
                      {/* Filter buttons */}
                      <div className="flex gap-1">
                        {['all', 'pending', 'approved', 'rejected'].map((status) => (
                          <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-3 py-1 text-sm rounded ${
                              filter === status
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                      
                      {/* Bulk actions */}
                      {stats.pending > 0 && (
                        <button
                          onClick={handleBulkApprove}
                          className="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600"
                        >
                          Approve All ({stats.pending})
                        </button>
                      )}
                      
                      {/* Export actions */}
                      <div className="flex gap-1">
                        <button
                          onClick={exportToCSV}
                          className="bg-blue-500 text-white px-3 py-1 text-sm rounded hover:bg-blue-600"
                          title="Export to CSV"
                        >
                          📊 CSV
                        </button>
                        <button
                          onClick={exportToPDF}
                          className="bg-purple-500 text-white px-3 py-1 text-sm rounded hover:bg-purple-600"
                          title="Export to PDF"
                        >
                          📄 PDF
                        </button>
                        <button
                          onClick={printWall}
                          className="bg-gray-500 text-white px-3 py-1 text-sm rounded hover:bg-gray-600"
                          title="Print Wall"
                        >
                          🖨️ Print
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {filteredNotes.filter(note => note && note.id).map((note) => (
                      <div
                        key={note.id}
                        className={`sticky-note ${note.color || 'yellow'} p-4 ${
                          note.status === 'rejected' ? 'opacity-50' : ''
                        }`}
                      >
                        {editingNote === note.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                              rows={3}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveEdit}
                                className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="sticky-note-text text-gray-800 font-medium leading-relaxed mb-3">
                            {note.text || 'No text content'}
                          </p>
                        )}
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-600">
                            {formatTimestamp(note?.created_at || note?.timestamp)}
                          </div>
                          <div className="flex space-x-2">
                            {note.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(note.id)}
                                  className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(note.id)}
                                  className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {note.status === 'approved' && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                Approved
                              </span>
                            )}
                            {note.status === 'rejected' && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                Rejected
                              </span>
                            )}
                            
                            {/* Additional action buttons */}
                            <button
                              onClick={() => handleEditNote(note)}
                              className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                              title="Edit note"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleRemoveNote(note.id)}
                              className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                              title="Remove note"
                            >
                              🗑️ Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Project Selected</h3>
                <p className="text-gray-600">Select a project from the sidebar to manage its notes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Creation Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Project</h3>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={newProject.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Design Workshop 2024"
                  required
                />
              </div>
              
                <div>
                  <label htmlFor="customUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Custom URL
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      thewall.callum.digital/
                    </span>
                  <input
                    id="customUrl"
                    type="text"
                    value={newProject.customUrl}
                    onChange={(e) => setNewProject({ ...newProject, customUrl: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="design-workshop-2024"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Auto-generated from project name. You can customize it.
                </p>
              </div>
              
              <div>
                <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="projectDescription"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the project"
                  rows={3}
                />
              </div>
              
              {/* Project Settings */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900">Project Settings</h4>
                
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={newProject.auto_approve}
                      onChange={(e) => setNewProject({ ...newProject, auto_approve: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Auto-Approval Mode</div>
                      <div className="text-xs text-gray-500">
                        Notes will be automatically approved and appear on the wall immediately
                      </div>
                    </div>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={newProject.show_timestamps}
                      onChange={(e) => setNewProject({ ...newProject, show_timestamps: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Show Timestamps</div>
                      <div className="text-xs text-gray-500">
                        Display timestamps on notes in the wall view (🕐 1m 17:15 format)
                      </div>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Create Project
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateProject(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Settings Modal */}
      {showProjectSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={projectSettings.auto_approve}
                    onChange={(e) => setProjectSettings({ ...projectSettings, auto_approve: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Auto-Approval Mode</div>
                    <div className="text-xs text-gray-500">
                      Notes will be automatically approved and appear on the wall immediately
                    </div>
                  </div>
                </label>
              </div>
              
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={projectSettings.show_timestamps}
                    onChange={(e) => setProjectSettings({ ...projectSettings, show_timestamps: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Show Timestamps</div>
                    <div className="text-xs text-gray-500">
                      Display timestamps on notes in the wall view
                    </div>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveProjectSettings}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Save Settings
              </button>
              <button
                onClick={() => setShowProjectSettings(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Management Modal */}
      {showFormManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Management</h3>
            
            <div className="space-y-6">
              {/* Form Preview */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Form Preview</h4>
                <div className="bg-white rounded-lg p-4 border">
                  <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{formSettings.title}</h2>
                    <p className="text-gray-600">{formSettings.subtitle}</p>
                  </div>
                  <div className="space-y-4">
                    {formConfig.fields.map((field) => (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {field.type === 'textarea' && (
                          <textarea
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={field.placeholder}
                            maxLength={field.maxLength}
                            disabled
                          />
                        )}
                        {field.type === 'text' && (
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={field.placeholder}
                            maxLength={field.maxLength}
                            disabled
                          />
                        )}
                        {field.type === 'email' && (
                          <input
                            type="email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={field.placeholder}
                            disabled
                          />
                        )}
                        {field.type === 'select' && (
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled
                          >
                            <option value="">{field.placeholder}</option>
                            {field.options?.map((option, index) => (
                              <option key={index} value={option}>{option}</option>
                            ))}
                          </select>
                        )}
                        {field.showCharacterCount && field.maxLength && (
                          <div className="text-right text-sm text-gray-500 mt-1">
                            0/{field.maxLength}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium mt-4"
                    disabled
                  >
                    {formSettings.buttonText}
                  </button>
                </div>
              </div>

              {/* Form Field Builder */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-medium text-gray-700">Form Fields</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addFormField('text')}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      + Text
                    </button>
                    <button
                      onClick={() => addFormField('textarea')}
                      className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                    >
                      + Textarea
                    </button>
                    <button
                      onClick={() => addFormField('email')}
                      className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                    >
                      + Email
                    </button>
                    <button
                      onClick={() => addFormField('select')}
                      className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                    >
                      + Select
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {formConfig.fields.map((field, index) => (
                    <div key={field.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                              {field.type}
                            </span>
                            {field.required && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                Required
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateFormField(field.id, { label: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-2"
                            placeholder="Field label"
                          />
                          <input
                            type="text"
                            value={field.placeholder}
                            onChange={(e) => updateFormField(field.id, { placeholder: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-2"
                            placeholder="Placeholder text"
                          />
                          {field.type === 'select' && (
                            <div className="mb-2">
                              <label className="block text-xs text-gray-600 mb-1">Options (one per line)</label>
                              <textarea
                                value={field.options?.join('\n') || ''}
                                onChange={(e) => updateFormField(field.id, { 
                                  options: e.target.value.split('\n').filter(opt => opt.trim()) 
                                })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                rows={3}
                                placeholder="Option 1&#10;Option 2&#10;Option 3"
                              />
                            </div>
                          )}
                          {(field.type === 'text' || field.type === 'textarea') && (
                            <div className="flex items-center gap-4 mb-2">
                              <label className="flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) => updateFormField(field.id, { required: e.target.checked })}
                                  className="h-3 w-3"
                                />
                                <span className="text-xs text-gray-600">Required</span>
                              </label>
                              <label className="flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={field.showCharacterCount}
                                  onChange={(e) => updateFormField(field.id, { showCharacterCount: e.target.checked })}
                                  className="h-3 w-3"
                                />
                                <span className="text-xs text-gray-600">Show count</span>
                              </label>
                            </div>
                          )}
                          {field.maxLength && (
                            <input
                              type="number"
                              value={field.maxLength}
                              onChange={(e) => updateFormField(field.id, { maxLength: parseInt(e.target.value) || 280 })}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                              placeholder="Max length"
                              min="1"
                              max="1000"
                            />
                          )}
                        </div>
                        <div className="flex flex-col gap-1 ml-2">
                          <button
                            onClick={() => moveFormField(field.id, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveFormField(field.id, 'down')}
                            disabled={index === formConfig.fields.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            title="Move down"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => removeFormField(field.id)}
                            className="p-1 text-red-400 hover:text-red-600"
                            title="Remove field"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Form Title
                  </label>
                  <input
                    type="text"
                    value={formSettings.title}
                    onChange={(e) => setFormSettings({ ...formSettings, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={formSettings.subtitle}
                    onChange={(e) => setFormSettings({ ...formSettings, subtitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Placeholder Text
                  </label>
                  <input
                    type="text"
                    value={formSettings.placeholder}
                    onChange={(e) => setFormSettings({ ...formSettings, placeholder: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Length
                  </label>
                  <input
                    type="number"
                    value={formSettings.maxLength}
                    onChange={(e) => setFormSettings({ ...formSettings, maxLength: parseInt(e.target.value) || 280 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="50"
                    max="1000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={formSettings.buttonText}
                    onChange={(e) => setFormSettings({ ...formSettings, buttonText: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Success Title
                  </label>
                  <input
                    type="text"
                    value={formSettings.successTitle}
                    onChange={(e) => setFormSettings({ ...formSettings, successTitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Success Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Success Message
                </label>
                <textarea
                  value={formSettings.successMessage}
                  onChange={(e) => setFormSettings({ ...formSettings, successMessage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              {/* Form Options */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Form Options</h4>
                
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formSettings.showCharacterCount}
                      onChange={(e) => setFormSettings({ ...formSettings, showCharacterCount: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-900">Show character count</span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formSettings.allowMultipleSubmissions}
                      onChange={(e) => setFormSettings({ ...formSettings, allowMultipleSubmissions: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-900">Allow multiple submissions</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-6">
              <button
                onClick={saveFormConfig}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Save Form Settings
              </button>
              <button
                onClick={() => setShowFormManagement(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Branding Editor Modal */}
      {showBrandingEditor && selectedProject && (
        <BrandingEditor
          project={selectedProject}
          onSave={async (branding, titleQuestion) => {
            try {
              console.log('🎨 AdminPage: Received save request with:', { branding, titleQuestion })
              await projectService.updateProjectSettings(selectedProject.id, { 
                branding,
                title_question: titleQuestion 
              })
              console.log('✅ Branding and titleQuestion updated:', { branding, titleQuestion })
              
              // Update local project data
              setProjects(prev => prev.map(p => 
                p.id === selectedProject.id 
                  ? { ...p, branding, titleQuestion }
                  : p
              ))
              
              setSelectedProject(prev => ({ ...prev, branding, titleQuestion }))
              setShowBrandingEditor(false)
            } catch (error) {
              console.error('❌ Error updating branding:', error)
            }
          }}
          onCancel={() => setShowBrandingEditor(false)}
        />
      )}

      {/* User Management Modal (Owner only) */}
      {showUserManagement && permissions.canManageUsers(userProfile?.role) && (
        <UserManagement onClose={() => setShowUserManagement(false)} />
      )}
    </div>
  )
}

export default AdminPage
