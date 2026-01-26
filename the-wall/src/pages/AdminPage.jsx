import React, { useState, useEffect } from 'react'
import { projectService, noteService, realtimeService } from '../services/supabaseClient.jsx'
import { formService, formUtils, DEFAULT_FORM_CONFIG } from '../services/formService.jsx'
import BrandingEditor from '../components/BrandingEditor.jsx'
import UserManagement from '../components/UserManagement.jsx'
import { authService, permissions, USER_ROLES } from '../services/authService.jsx'
import Logo from '../components/Logo.jsx'
import ProjectCard from '../components/ProjectCard.jsx'
import NewProjectCard from '../components/NewProjectCard.jsx'
import { Tab, Tabs, TabContent, Button, Input } from '../components/ui'

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
  const [editingNote, setEditingNote] = useState(null)
  const [editText, setEditText] = useState('')
  const [expandedFormData, setExpandedFormData] = useState({}) // Track which notes have expanded form data
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
  const [activeTab, setActiveTab] = useState('notes') // notes, settings, form, branding

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
    setActiveTab('notes') // Reset to notes tab when selecting a project
    
    try {
      const notesData = await noteService.getAllNotes(project.id)
      console.log('📋 Admin: Notes loaded for', project.id, ':', notesData)
      setNotes(notesData)
      updateStats(notesData)
    } catch (error) {
      console.error('❌ Admin: Error loading notes for project:', error)
    }
  }

  // Go back to dashboard
  const handleBackToDashboard = () => {
    setSelectedProject(null)
    setActiveTab('notes')
  }

  // Update statistics
  const updateStats = (notesData) => {
    const stats = {
      total: notesData.filter(note => note.status !== 'deleted').length,
      pending: notesData.filter(note => note.status === 'pending').length,
      approved: notesData.filter(note => note.status === 'approved').length,
      rejected: notesData.filter(note => note.status === 'rejected').length,
      deleted: notesData.filter(note => note.status === 'deleted').length
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
        show_timestamps: newProject.show_timestamps,
        form_config: DEFAULT_FORM_CONFIG // Initialize with default form config
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
    if (filter === 'all') {
      // Show all notes except deleted ones in "all" view
      return note.status !== 'deleted'
    }
    if (filter === 'deleted') {
      return note.status === 'deleted'
    }
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
    
    if (filteredNotes.length === 0) {
      alert('No notes to export')
      return
    }
    
    // Get all unique form field keys from all notes
    const allFormFieldKeys = new Set()
    filteredNotes.forEach(note => {
      if (note.form_data && typeof note.form_data === 'object') {
        Object.keys(note.form_data).forEach(key => {
          // Get field label from form config
          const fieldConfig = formConfig?.fields?.find(f => f.id === key)
          if (fieldConfig) {
            allFormFieldKeys.add(key)
          }
        })
      }
    })
    
    // Create base columns
    const baseColumns = ['Note ID', 'Text', 'Emoji', 'Color', 'Status', 'Created', 'Project']
    
    // Add form field columns with their labels
    const formFieldColumns = Array.from(allFormFieldKeys).map(key => {
      const fieldConfig = formConfig?.fields?.find(f => f.id === key)
      return { key, label: fieldConfig?.label || key }
    })
    
    // Create CSV data
    const csvData = filteredNotes.map(note => {
      const row = {
        'Note ID': note.id || '',
        'Text': note.text || '',
        'Emoji': note.emoji || '',
        'Color': note.color || '',
        'Status': note.status || '',
        'Created': formatTimestamp(note?.created_at || note?.timestamp),
        'Project': selectedProject.name
      }
      
      // Add form data fields
      formFieldColumns.forEach(({ key, label }) => {
        const value = note.form_data?.[key]
        row[label] = value != null ? String(value) : ''
      })
      
      return row
    })
    
    // Get all column names
    const allColumns = [...baseColumns, ...formFieldColumns.map(({ label }) => label)]
    
    // Create CSV content
    const csvContent = [
      allColumns.map(col => `"${String(col).replace(/"/g, '""')}"`).join(','),
      ...csvData.map(row => 
        allColumns.map(col => {
          const value = row[col] || ''
          // Escape quotes and wrap in quotes
          return `"${String(value).replace(/"/g, '""')}"`
        }).join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedProject.name}-notes-${new Date().toISOString().split('T')[0]}.csv`
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


  const handleApprove = async (noteId) => {
    console.log('✅ Admin: Approving note:', noteId)
    try {
      // Update in Supabase
      const result = await noteService.updateNoteStatus(noteId, 'approved')
      console.log('✅ Supabase update result:', result)
      
      // Reload notes to ensure we have the latest data
      if (selectedProject) {
        const notesData = await noteService.getAllNotes(selectedProject.id)
        setNotes(notesData)
        updateStats(notesData)
      } else {
        // Fallback: update local state
        const updatedNotes = notes.map(note => 
          note.id === noteId ? { ...note, status: 'approved' } : note
        )
        setNotes(updatedNotes)
        updateStats(updatedNotes)
      }
      
      console.log('✅ Note approved successfully')
    } catch (error) {
      console.error('❌ Error approving note:', error)
      alert(`Failed to approve note: ${error.message || 'Unknown error'}`)
    }
  }

  const handleReject = async (noteId) => {
    console.log('❌ Admin: Rejecting note:', noteId)
    try {
      // Update in Supabase
      const result = await noteService.updateNoteStatus(noteId, 'rejected')
      console.log('✅ Supabase update result:', result)
      
      // Reload notes to ensure we have the latest data
      if (selectedProject) {
        const notesData = await noteService.getAllNotes(selectedProject.id)
        setNotes(notesData)
        updateStats(notesData)
      } else {
        // Fallback: update local state
        const updatedNotes = notes.map(note => 
          note.id === noteId ? { ...note, status: 'rejected' } : note
        )
        setNotes(updatedNotes)
        updateStats(updatedNotes)
      }
      
      console.log('✅ Note rejected successfully')
    } catch (error) {
      console.error('❌ Error rejecting note:', error)
      alert(`Failed to reject note: ${error.message || 'Unknown error'}`)
    }
  }

  // Note action handlers for admin
  const handleRemoveNote = async (noteId) => {
    if (!confirm('Are you sure you want to deactivate this note? It will be hidden from the display but can be restored later.')) {
      return
    }

    try {
      console.log('🗑️ Admin: Deactivating note:', noteId)
      // Soft delete: set status to 'deleted' instead of actually deleting
      const result = await noteService.updateNoteStatus(noteId, 'deleted')
      console.log('✅ Supabase update result:', result)
      
      // Reload notes to ensure we have the latest data
      if (selectedProject) {
        const notesData = await noteService.getAllNotes(selectedProject.id)
        setNotes(notesData)
        updateStats(notesData)
      } else {
        // Fallback: update local state
        const updatedNotes = notes.map(note => 
          note.id === noteId ? { ...note, status: 'deleted' } : note
        )
        setNotes(updatedNotes)
        updateStats(updatedNotes)
      }
      
      console.log('✅ Note deactivated successfully')
    } catch (error) {
      console.error('❌ Error deactivating note:', error)
      alert(`Failed to deactivate note: ${error.message || 'Unknown error'}`)
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

  // Restore deleted note
  const handleRestoreNote = async (noteId) => {
    try {
      console.log('♻️ Admin: Restoring note:', noteId)
      // Restore by setting status back to pending
      const result = await noteService.updateNoteStatus(noteId, 'pending')
      console.log('✅ Supabase update result:', result)
      
      // Reload notes to ensure we have the latest data
      if (selectedProject) {
        const notesData = await noteService.getAllNotes(selectedProject.id)
        setNotes(notesData)
        updateStats(notesData)
      }
      
      console.log('✅ Note restored successfully')
    } catch (error) {
      console.error('❌ Error restoring note:', error)
      alert(`Failed to restore note: ${error.message || 'Unknown error'}`)
    }
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
          console.log('📋 Loading form config for project:', selectedProject.id)
          const config = await formService.getFormConfig(selectedProject.id)
          console.log('📋 Form config loaded:', config)
          setFormConfig(config)
        } catch (error) {
          console.error('❌ Error loading form config from Supabase:', error)
          // Fallback to default config if loading fails
          setFormConfig(DEFAULT_FORM_CONFIG)
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
      console.log('✅ Form configuration saved successfully to Supabase')
      
      // Update local project data to reflect the change
      setProjects(prev => prev.map(p => 
        p.id === selectedProject.id 
          ? { ...p, form_config: formConfig }
          : p
      ))
      
      setSelectedProject(prev => ({ ...prev, form_config: formConfig }))
      
      // Show success message
      alert('Form configuration saved successfully!')
    } catch (error) {
      console.error('❌ Error saving form config to Supabase:', error)
      alert(`Failed to save form configuration: ${error.message || 'Please try again.'}`)
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
    <div className="min-h-screen bg-[#F5E6D3] admin-layout">
      {/* Top Navigation - Backseat Style */}
      <div className="bg-white border-b-[3px] border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <Logo width={50} height={51} />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 admin-heading">The Wall</h1>
              </div>
            </div>
            
            {/* User Actions */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {/* User info badge */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-[14px] border-[3px] border-black">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {userProfile?.display_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-bold text-gray-900">
                    {userProfile?.display_name || user?.email || 'User'}
                  </div>
                  <div className="text-xs text-gray-600 capitalize">{userProfile?.role || 'viewer'}</div>
                </div>
              </div>

              {/* User Management button (Owner only) */}
              {permissions.canManageUsers(userProfile?.role) && (
                <button
                  onClick={() => setShowUserManagement(true)}
                  className="px-4 py-2 bg-purple-500 text-white rounded-[14px] hover:bg-purple-600 transition-all duration-200 text-sm font-bold border-[3px] border-black hover:translate-y-[-2px]"
                >
                  👥 <span className="hidden sm:inline">Users</span>
                </button>
              )}

              {/* Sign Out button */}
              <button
                onClick={async () => {
                  await authService.signOut()
                  window.location.href = '/login'
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-[14px] hover:bg-red-600 transition-all duration-200 text-sm font-bold border-[3px] border-black hover:translate-y-[-2px]"
              >
                🚪 <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {!selectedProject ? (
          /* ===== DASHBOARD VIEW ===== */
          <div>
            {/* Dashboard Header */}
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 admin-heading mb-2">
                Your Projects
              </h1>
              <p className="text-gray-600">
                Manage your walls and moderate content across all projects
              </p>
            </div>


            {/* View Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setViewMode('active')}
                className={`px-6 py-3 text-sm rounded-[14px] transition-all duration-200 font-bold border-[3px] border-black ${
                  viewMode === 'active'
                    ? 'bg-[#F4C542] text-black'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Active ({projects.length})
              </button>
              <button
                onClick={() => setViewMode('archived')}
                className={`px-6 py-3 text-sm rounded-[14px] transition-all duration-200 font-bold border-[3px] border-black ${
                  viewMode === 'archived'
                    ? 'bg-[#F4C542] text-black'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Archived ({archivedProjects.length})
              </button>
            </div>

            {/* Project Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {viewMode === 'active' && (
                <NewProjectCard onClick={() => setShowCreateProject(true)} />
              )}
              
              {(viewMode === 'active' ? projects : archivedProjects).map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => handleProjectSelect(project)}
                />
              ))}
              
              {viewMode === 'active' && projects.length === 0 && (
                <div className="col-span-full text-center py-16 text-gray-500">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No projects yet</h3>
                  <p className="mb-4">Create your first project to get started</p>
                </div>
              )}
              
              {viewMode === 'archived' && archivedProjects.length === 0 && (
                <div className="col-span-full text-center py-16 text-gray-500">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No archived projects</h3>
                  <p>Projects you archive will appear here</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ===== PROJECT DETAIL VIEW ===== */
          <div>
            {/* Back Button & Project Header */}
            <div className="mb-6">
              <button
                onClick={handleBackToDashboard}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 font-bold transition-colors"
              >
                <span>←</span>
                <span>Back to Dashboard</span>
              </button>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900 admin-heading">
                      {selectedProject.name}
                    </h1>
                    {selectedProject.auto_approve && (
                      <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-bold border-2 border-green-300">
                        ⚡ Auto-Approval
                      </span>
                    )}

                  </div>
                  {selectedProject.description && (
                    <p className="text-gray-600">{selectedProject.description}</p>
                  )}
                </div>
                
                {/* Quick Actions */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => window.open(`${selectedProject.id}/display`, '_blank')}
                    className="bg-green-500 text-white px-4 py-2 rounded-[14px] hover:bg-green-600 transition-all text-sm border-[3px] border-black font-bold hover:translate-y-[-2px]"
                  >
                    👁️ View Wall
                  </button>
                  <button
                    onClick={() => window.open(`/${selectedProject.id}`, '_blank')}
                    className="bg-blue-500 text-white px-4 py-2 rounded-[14px] hover:bg-blue-600 transition-all text-sm border-[3px] border-black font-bold hover:translate-y-[-2px]"
                  >
                    ✏️ Add Note
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <Tabs>
              <Tab
                label="Notes"
                icon="📝"
                active={activeTab === 'notes'}
                onClick={() => setActiveTab('notes')}
                badge={stats.pending > 0 ? stats.pending : null}
              />
              <Tab
                label="Settings"
                icon="⚙️"
                active={activeTab === 'settings'}
                onClick={() => setActiveTab('settings')}
              />
              <Tab
                label="Form Builder"
                icon="📋"
                active={activeTab === 'form'}
                onClick={() => setActiveTab('form')}
              />
              <Tab
                label="Branding"
                icon="🎨"
                active={activeTab === 'branding'}
                onClick={() => setActiveTab('branding')}
              />
            </Tabs>

            {/* Tab Content */}
            <TabContent>
              {activeTab === 'notes' && (
              <div>
                  {/* Statistics - Backseat Style */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-[14px] border-[3px] border-black p-4">
                      <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                      <div className="text-sm text-gray-600 font-bold">Total Notes</div>
                    </div>
                    <div className="bg-[#FFF4C7] rounded-[14px] border-[3px] border-black p-4">
                      <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
                      <div className="text-sm text-gray-600 font-bold">Pending</div>
                    </div>
                    <div className="bg-[#D1FAE5] rounded-[14px] border-[3px] border-black p-4">
                      <div className="text-2xl font-bold text-green-700">{stats.approved}</div>
                      <div className="text-sm text-gray-600 font-bold">Approved</div>
                    </div>
                    <div className="bg-[#FFE4E6] rounded-[14px] border-[3px] border-black p-4">
                      <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
                      <div className="text-sm text-gray-600 font-bold">Rejected</div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 admin-heading">Moderate Notes</h3>
                    
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      {/* Filter buttons - Backseat Style Pills */}
                      <div className="flex gap-2 flex-wrap">
                        {['all', 'pending', 'approved', 'rejected', 'deleted'].map((status) => (
                          <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-[14px] border-[3px] border-black font-bold transition-all ${
                              filter === status
                                ? 'bg-[#F4C542] text-black'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                            {status === 'deleted' && stats.deleted > 0 && (
                              <span className="ml-1">({stats.deleted})</span>
                            )}
                          </button>
                        ))}
                      </div>
                      
                      {/* Bulk actions */}
                      {stats.pending > 0 && (
                        <button
                          onClick={handleBulkApprove}
                          className="bg-green-500 text-white px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-[14px] hover:bg-green-600 whitespace-nowrap border-[3px] border-black font-bold transition-all hover:translate-y-[-2px]"
                        >
                          ✓ Approve All ({stats.pending})
                        </button>
                      )}
                      
                      {/* Export actions */}
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={exportToCSV}
                          className="bg-blue-500 text-white px-3 py-2 text-xs sm:text-sm rounded-[14px] hover:bg-blue-600 border-[3px] border-black font-bold transition-all hover:translate-y-[-2px]"
                          title="Export to CSV"
                        >
                          📊 CSV
                        </button>
                        <button
                          onClick={exportToPDF}
                          className="bg-purple-500 text-white px-3 py-2 text-xs sm:text-sm rounded-[14px] hover:bg-purple-600 border-[3px] border-black font-bold transition-all hover:translate-y-[-2px]"
                          title="Export to PDF"
                        >
                          📄 PDF
                        </button>
                        <button
                          onClick={printWall}
                          className="bg-gray-500 text-white px-3 py-2 text-xs sm:text-sm rounded-[14px] hover:bg-gray-600 border-[3px] border-black font-bold transition-all hover:translate-y-[-2px]"
                          title="Print Wall"
                        >
                          🖨️ Print
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {filteredNotes.filter(note => note && note.id).map((note) => (
                      <div
                        key={note.id}
                        className={`rounded-[14px] border-[3px] border-black p-5 transition-all ${
                          note.status === 'rejected' ? 'opacity-50' : ''
                        }`}
                        style={{
                          backgroundColor: note.color === 'yellow' ? '#FFF4C7' :
                            note.color === 'blue' ? '#DFF3FF' :
                            note.color === 'pink' ? '#FFBFFE' :
                            note.color === 'green' ? '#D1FAE5' :
                            note.color === 'purple' ? '#E9D5FF' :
                            note.color === 'orange' ? '#FED7AA' :
                            note.color === 'red' ? '#FFE4E6' :
                            '#FFF4C7'
                        }}
                      >
                        {editingNote === note.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full p-3 border-[3px] border-black rounded-[14px] text-sm resize-none bg-white focus:outline-none"
                              rows={3}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveEdit}
                                className="px-4 py-2 bg-green-500 text-white text-sm rounded-[14px] hover:bg-green-600 transition-all border-[3px] border-black font-bold hover:translate-y-[-2px]"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-4 py-2 bg-gray-500 text-white text-sm rounded-[14px] hover:bg-gray-600 transition-all border-[3px] border-black font-bold hover:translate-y-[-2px]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-gray-900 font-medium leading-relaxed mb-4 text-base">
                              {note.text || 'No text content'}
                            </p>
                            
                            {/* Display emoji if present */}
                            {note.emoji && (
                              <div className="mb-3 text-2xl">
                                {note.emoji}
                              </div>
                            )}
                            
                            {/* Display additional form data */}
                            {note.form_data && typeof note.form_data === 'object' && Object.keys(note.form_data).length > 0 && (() => {
                              // Filter out fields that are already displayed or empty
                              const additionalFields = Object.entries(note.form_data).filter(([key, value]) => {
                                // Skip if empty or null
                                if (value === '' || value == null || value === undefined) return false
                                
                                // Skip if value exactly matches what's already displayed
                                // (this handles cases where form_data has the same values as note.text/emoji/color)
                                if (String(value).trim() === String(note.text).trim()) return false
                                if (value === note.emoji) return false
                                if (value === note.color) return false
                                
                                return true
                              })
                              
                              if (additionalFields.length === 0) return null
                              
                              return (
                                <div className="mb-4">
                                  <button
                                    onClick={() => setExpandedFormData(prev => ({
                                      ...prev,
                                      [note.id]: !prev[note.id]
                                    }))}
                                    className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors mb-2"
                                  >
                                    <span className="text-base">{expandedFormData[note.id] ? '▼' : '▶'}</span>
                                    <span>Additional Form Data ({additionalFields.length})</span>
                                  </button>
                                  
                                  {expandedFormData[note.id] && (
                                    <div className="bg-white/80 rounded-[10px] border-[2px] border-gray-300 p-3 space-y-2">
                                      {additionalFields.map(([key, value]) => {
                                        // Find the field label from form config
                                        const fieldConfig = formConfig?.fields?.find(f => f.id === key)
                                        const fieldLabel = fieldConfig?.label || key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                                        
                                        return (
                                          <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 pb-2 border-b border-gray-200 last:border-b-0 last:pb-0">
                                            <div className="text-xs font-bold text-gray-600 uppercase tracking-wide min-w-[100px] sm:min-w-[120px] pt-0.5">
                                              {fieldLabel}:
                                            </div>
                                            <div className="text-sm text-gray-900 font-medium break-words flex-1">
                                              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )
                            })()}
                          </>
                        )}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t-2 border-gray-900/10">
                          <div className="text-xs text-gray-600 font-medium">
                            {formatTimestamp(note?.created_at || note?.timestamp)}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {note.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(note.id)}
                                  className="px-3 py-2 bg-green-500 text-white text-xs rounded-[14px] hover:bg-green-600 transition-all border-[3px] border-black font-bold hover:translate-y-[-2px]"
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={() => handleReject(note.id)}
                                  className="px-3 py-2 bg-red-500 text-white text-xs rounded-[14px] hover:bg-red-600 transition-all border-[3px] border-black font-bold hover:translate-y-[-2px]"
                                >
                                  ✗ Reject
                                </button>
                              </>
                            )}
                            {note.status === 'approved' && (
                              <span className="px-3 py-1 bg-green-100 border-[2px] border-green-500 text-green-800 text-xs rounded-full font-bold">
                                ✓ Approved
                              </span>
                            )}
                            {note.status === 'rejected' && (
                              <span className="px-3 py-1 bg-red-100 border-[2px] border-red-500 text-red-800 text-xs rounded-full font-bold">
                                ✗ Rejected
                              </span>
                            )}
                            {note.status === 'deleted' && (
                              <span className="px-3 py-1 bg-gray-100 border-[2px] border-gray-500 text-gray-800 text-xs rounded-full font-bold">
                                🗑️ Deleted
                              </span>
                            )}
                            
                            {/* Additional action buttons */}
                            {note.status === 'deleted' ? (
                              <button
                                onClick={() => handleRestoreNote(note.id)}
                                className="px-3 py-2 bg-green-500 text-white text-xs rounded-[14px] hover:bg-green-600 transition-all border-[3px] border-black font-bold hover:translate-y-[-2px]"
                                title="Restore note"
                              >
                                ♻️ Restore
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditNote(note)}
                                  className="px-3 py-2 bg-blue-500 text-white text-xs rounded-[14px] hover:bg-blue-600 transition-all border-[3px] border-black font-bold hover:translate-y-[-2px]"
                                  title="Edit note"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleRemoveNote(note.id)}
                                  className="px-3 py-2 bg-red-500 text-white text-xs rounded-[14px] hover:bg-red-600 transition-all border-[3px] border-black font-bold hover:translate-y-[-2px]"
                                  title="Deactivate note"
                                >
                                  🗑️
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 admin-heading mb-4">
                    Project Settings
                  </h2>
                  
                  {/* Project URL Sharing */}
                  <div className="p-6 bg-[#DFF3FF] rounded-[14px] border-[3px] border-black">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 admin-heading">Share Project</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-700 font-bold mb-2">Form URL (for participants):</p>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <code className="flex-1 text-sm text-gray-700 bg-white p-3 rounded-[14px] border-[3px] border-black break-all overflow-x-auto font-mono">
                            thewall.callum.digital/{selectedProject.id}
                          </code>
                          <button
                            onClick={() => copyUrl(selectedProject.id)}
                            className={`px-4 py-3 text-sm rounded-[14px] border-[3px] border-black transition-all whitespace-nowrap font-bold ${
                              copied 
                                ? 'bg-green-500 text-white' 
                                : 'bg-[#F4C542] text-black hover:bg-[#E5B73B]'
                            }`}
                          >
                            {copied ? '✓ Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 font-bold mb-2">Display URL (for viewing wall):</p>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <code className="flex-1 text-sm text-gray-700 bg-white p-3 rounded-[14px] border-[3px] border-black break-all overflow-x-auto font-mono">
                            thewall.callum.digital/{selectedProject.id}/display
                          </code>
                          <button
                            onClick={() => copyUrl(`${selectedProject.id}/display`)}
                            className={`px-4 py-3 text-sm rounded-[14px] border-[3px] border-black transition-all whitespace-nowrap font-bold ${
                              copied 
                                ? 'bg-green-500 text-white' 
                                : 'bg-[#F4C542] text-black hover:bg-[#E5B73B]'
                            }`}
                          >
                            {copied ? '✓ Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Project Settings */}
                  <div className="bg-white rounded-[14px] border-[3px] border-black p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 admin-heading">Project Options</h3>
                    <div className="space-y-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedProject.auto_approve || false}
                          onChange={async (e) => {
                            await projectService.updateProjectSettings(selectedProject.id, { 
                              auto_approve: e.target.checked 
                            })
                            setSelectedProject(prev => ({ ...prev, auto_approve: e.target.checked }))
                            const projectsData = await projectService.getProjects()
                            setProjects(projectsData)
                          }}
                          className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                          <div className="text-sm font-bold text-gray-900">Auto-Approval Mode</div>
                          <div className="text-xs text-gray-600">
                            Notes will be automatically approved and appear on the wall immediately
                          </div>
                        </div>
                      </label>
                      
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedProject.show_timestamps !== false}
                          onChange={async (e) => {
                            await projectService.updateProjectSettings(selectedProject.id, { 
                              show_timestamps: e.target.checked 
                            })
                            setSelectedProject(prev => ({ ...prev, show_timestamps: e.target.checked }))
                            const projectsData = await projectService.getProjects()
                            setProjects(projectsData)
                          }}
                          className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                          <div className="text-sm font-bold text-gray-900">Show Timestamps</div>
                          <div className="text-xs text-gray-600">
                            Display timestamps on notes in the wall view
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Archive Project */}
                  <div className="bg-red-50 rounded-[14px] border-[3px] border-black p-6">
                    <h3 className="text-lg font-bold text-red-900 mb-2 admin-heading">Danger Zone</h3>
                    <p className="text-sm text-gray-700 mb-4">
                      Archive this project to hide it from the active list. You can unarchive it later.
                    </p>
                    <button
                      onClick={() => handleArchiveProject(selectedProject.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-[14px] hover:bg-red-600 transition-all text-sm border-[3px] border-black font-bold"
                    >
                      📦 Archive Project
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'form' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 admin-heading mb-6">
                    Form Builder
                  </h2>
                  
                  <div className="bg-blue-50 border-[3px] border-blue-200 rounded-[14px] p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="text-blue-500 text-xl">💡</div>
                      <div>
                        <h3 className="text-sm font-bold text-blue-900 mb-1">Form Builder Tips</h3>
                        <ul className="text-xs text-blue-800 space-y-1">
                          <li>• <strong>Text/Textarea:</strong> Required for note content - at least one text field is needed</li>
                          <li>• <strong>Emoji:</strong> Optional emoji selector for notes</li>
                          <li>• <strong>Color:</strong> Optional color picker (uses your branding colors)</li>
                          <li>• <strong>Email/Select:</strong> Additional form fields for data collection</li>
                          <li>• You can remove the default "main-note" field and create your own text fields</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Form Field Builder */}
                  <div className="bg-white rounded-[14px] border-[3px] border-black p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900 admin-heading">Form Fields</h3>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => addFormField('text')}
                          className="px-3 py-2 bg-blue-500 text-white text-sm rounded-[14px] hover:bg-blue-600 border-[3px] border-black font-bold transition-all hover:translate-y-[-2px]"
                        >
                          + Text
                        </button>
                        <button
                          onClick={() => addFormField('textarea')}
                          className="px-3 py-2 bg-green-500 text-white text-sm rounded-[14px] hover:bg-green-600 border-[3px] border-black font-bold transition-all hover:translate-y-[-2px]"
                        >
                          + Textarea
                        </button>
                        <button
                          onClick={() => addFormField('email')}
                          className="px-3 py-2 bg-purple-500 text-white text-sm rounded-[14px] hover:bg-purple-600 border-[3px] border-black font-bold transition-all hover:translate-y-[-2px]"
                        >
                          + Email
                        </button>
                        <button
                          onClick={() => addFormField('select')}
                          className="px-3 py-2 bg-orange-500 text-white text-sm rounded-[14px] hover:bg-orange-600 border-[3px] border-black font-bold transition-all hover:translate-y-[-2px]"
                        >
                          + Select
                        </button>
                        <button
                          onClick={() => addFormField('emoji')}
                          className="px-3 py-2 bg-pink-500 text-white text-sm rounded-[14px] hover:bg-pink-600 border-[3px] border-black font-bold transition-all hover:translate-y-[-2px]"
                        >
                          + Emoji
                        </button>
                        <button
                          onClick={() => addFormField('color')}
                          className="px-3 py-2 bg-indigo-500 text-white text-sm rounded-[14px] hover:bg-indigo-600 border-[3px] border-black font-bold transition-all hover:translate-y-[-2px]"
                        >
                          + Color
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {formConfig.fields.map((field, index) => (
                        <div key={field.id} className="border-[3px] border-black rounded-[14px] p-4 bg-gray-50">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs bg-white border-[2px] border-black text-gray-900 px-3 py-1 rounded-full font-bold">
                                  {field.type}
                                </span>
                                {field.required && (
                                  <span className="text-xs bg-red-100 border-[2px] border-red-500 text-red-700 px-3 py-1 rounded-full font-bold">
                                    Required
                                  </span>
                                )}
                              </div>
                              <Input
                                type="text"
                                value={field.label}
                                onChange={(e) => updateFormField(field.id, { label: e.target.value })}
                                placeholder="Field label"
                                className="mb-2"
                              />
                              <Input
                                type="text"
                                value={field.placeholder}
                                onChange={(e) => updateFormField(field.id, { placeholder: e.target.value })}
                                placeholder="Placeholder text"
                                className="mb-2"
                              />
                              {field.type === 'select' && (
                                <div className="mb-2">
                                  <label className="block text-xs text-gray-700 font-bold mb-1">Options (one per line)</label>
                                  <textarea
                                    value={field.options?.join('\n') || ''}
                                    onChange={(e) => updateFormField(field.id, { 
                                      options: e.target.value.split('\n').filter(opt => opt.trim()) 
                                    })}
                                    className="w-full px-4 py-3 border-[3px] border-black rounded-[14px] bg-gray-50 text-sm resize-none focus:outline-none"
                                    rows={3}
                                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                                  />
                                </div>
                              )}
                              {field.type === 'emoji' && (
                                <div className="mb-2">
                                  <div className="flex items-center gap-4 mb-2">
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={field.required}
                                        onChange={(e) => updateFormField(field.id, { required: e.target.checked })}
                                        className="h-4 w-4"
                                      />
                                      <span className="text-sm text-gray-700 font-bold">Required</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={field.allowCustomEmoji !== false}
                                        onChange={(e) => updateFormField(field.id, { allowCustomEmoji: e.target.checked })}
                                        className="h-4 w-4"
                                      />
                                      <span className="text-sm text-gray-700 font-bold">Allow custom emojis</span>
                                    </label>
                                  </div>
                                  <div className="mb-2">
                                    <label className="block text-xs text-gray-700 font-bold mb-1">Available Emojis (one per line)</label>
                                    <textarea
                                      value={field.emojis?.join('\n') || '😀\n😊\n😍\n🤔\n😢\n😡\n🎉\n❤️\n👍\n👎'}
                                      onChange={(e) => updateFormField(field.id, { 
                                        emojis: e.target.value.split('\n').filter(emoji => emoji.trim()) 
                                      })}
                                      className="w-full px-4 py-3 border-[3px] border-black rounded-[14px] bg-gray-50 text-sm resize-none focus:outline-none"
                                      rows={4}
                                      placeholder="😀&#10;😊&#10;😍&#10;🤔&#10;😢"
                                    />
                                    <span className="text-xs text-gray-500 italic">
                                      {field.allowCustomEmoji !== false 
                                        ? 'Users can select from these emojis or type their own' 
                                        : 'Users can only select from these emojis'}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {field.type === 'color' && (
                                <div className="mb-2">
                                  <div className="flex items-center gap-4 mb-2">
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={field.required}
                                        onChange={(e) => updateFormField(field.id, { required: e.target.checked })}
                                        className="h-4 w-4"
                                      />
                                      <span className="text-sm text-gray-700 font-bold">Required</span>
                                    </label>
                                  </div>
                                  <span className="text-xs text-gray-500 italic">Users can select from the note colors configured in branding settings</span>
                                </div>
                              )}
                              {(field.type === 'text' || field.type === 'textarea') && (
                                <div className="mb-2">
                                  <div className="flex items-center gap-4 mb-2">
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={field.required}
                                        onChange={(e) => updateFormField(field.id, { required: e.target.checked })}
                                        className="h-4 w-4"
                                      />
                                      <span className="text-sm text-gray-700 font-bold">Required</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={field.showCharacterCount}
                                        onChange={(e) => updateFormField(field.id, { showCharacterCount: e.target.checked })}
                                        className="h-4 w-4"
                                      />
                                      <span className="text-sm text-gray-700 font-bold">Show count</span>
                                    </label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-700 font-bold">Max Length:</label>
                                    <input
                                      type="number"
                                      value={field.maxLength || (field.type === 'textarea' ? 280 : 100)}
                                      onChange={(e) => updateFormField(field.id, { maxLength: parseInt(e.target.value) || (field.type === 'textarea' ? 280 : 100) })}
                                      className="w-20 px-2 py-1 text-sm border-[2px] border-black rounded bg-gray-50"
                                      min="1"
                                      max="1000"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 ml-2">
                              <button
                                onClick={() => moveFormField(field.id, 'up')}
                                disabled={index === 0}
                                className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 font-bold text-xl"
                                title="Move up"
                              >
                                ↑
                              </button>
                              <button
                                onClick={() => moveFormField(field.id, 'down')}
                                disabled={index === formConfig.fields.length - 1}
                                className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 font-bold text-xl"
                                title="Move down"
                              >
                                ↓
                              </button>
                              <button
                                onClick={() => removeFormField(field.id)}
                                className="p-2 text-red-500 hover:text-red-700 font-bold text-xl"
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

                  {/* Save Button */}
                  <Button
                    onClick={saveFormConfig}
                    variant="primary"
                    size="medium"
                    fullWidth
                  >
                    Save Form Configuration
                  </Button>
                </div>
              )}

              {activeTab === 'branding' && (
                <BrandingEditor
                  project={selectedProject}
                  onSave={async (branding, titleQuestion) => {
                    try {
                      console.log('🎨 AdminPage: Saving branding inline:', { branding, titleQuestion })
                      await projectService.updateProjectSettings(selectedProject.id, { 
                        branding,
                        title_question: titleQuestion 
                      })
                      console.log('✅ Branding updated')
                      
                      // Update local project data
                      setProjects(prev => prev.map(p => 
                        p.id === selectedProject.id 
                          ? { ...p, branding, titleQuestion }
                          : p
                      ))
                      
                      setSelectedProject(prev => ({ ...prev, branding, titleQuestion }))
                      
                      // Show success message
                      alert('Branding saved successfully!')
                    } catch (error) {
                      console.error('❌ Error updating branding:', error)
                      alert('Failed to save branding. Please try again.')
                    }
                  }}
                  onCancel={null}
                  isInline={true}
                />
              )}
            </TabContent>
          </div>
        )}
      </div>

      {/* Project Creation Modal - Backseat Style */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] border-[3px] border-black p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 admin-heading">Create New Project</h3>
            
            <form onSubmit={handleCreateProject} className="space-y-6">
              <Input
                id="projectName"
                type="text"
                label="Project Name"
                value={newProject.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Design Workshop 2024"
                required
              />
              
              <div>
                <label htmlFor="customUrl" className="block text-base font-bold text-gray-900 mb-2">
                  Custom URL
                </label>
                <div className="flex items-stretch">
                  <span className="inline-flex items-center px-4 rounded-l-[14px] border-[3px] border-r-0 border-black bg-gray-50 text-gray-700 text-sm font-bold">
                    thewall.callum.digital/
                  </span>
                  <input
                    id="customUrl"
                    type="text"
                    value={newProject.customUrl}
                    onChange={(e) => setNewProject({ ...newProject, customUrl: e.target.value })}
                    className="flex-1 px-4 py-3 border-[3px] border-black rounded-r-[14px] focus:outline-none bg-gray-50 focus:border-black"
                    placeholder="design-workshop-2024"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Auto-generated from project name. You can customize it.
                </p>
              </div>
              
              <Input
                id="projectDescription"
                type="textarea"
                label="Description (Optional)"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Brief description of the project"
                rows={3}
              />
              
              {/* Project Settings */}
              <div className="space-y-4 pt-4 border-t-[3px] border-gray-200">
                <h4 className="text-base font-bold text-gray-900 admin-heading">Project Settings</h4>
                
                <label className="flex items-start gap-3 cursor-pointer p-4 rounded-[14px] border-[3px] border-gray-200 hover:border-black transition-colors">
                  <input
                    type="checkbox"
                    checked={newProject.auto_approve}
                    onChange={(e) => setNewProject({ ...newProject, auto_approve: e.target.checked })}
                    className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <div className="text-sm font-bold text-gray-900">Auto-Approval Mode</div>
                    <div className="text-xs text-gray-600">
                      Notes will be automatically approved and appear on the wall immediately
                    </div>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 cursor-pointer p-4 rounded-[14px] border-[3px] border-gray-200 hover:border-black transition-colors">
                  <input
                    type="checkbox"
                    checked={newProject.show_timestamps}
                    onChange={(e) => setNewProject({ ...newProject, show_timestamps: e.target.checked })}
                    className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <div className="text-sm font-bold text-gray-900">Show Timestamps</div>
                    <div className="text-xs text-gray-600">
                      Display timestamps on notes in the wall view (🕐 1m 17:15 format)
                    </div>
                  </div>
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="medium"
                  className="flex-1"
                >
                  Create Project
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowCreateProject(false)}
                  variant="outline"
                  size="medium"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Form Management Modal - DEPRECATED: Now integrated into tabs */}
      {false && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 admin-heading">Form Management</h3>
            
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
                    <button
                      onClick={() => addFormField('emoji')}
                      className="px-3 py-1 bg-pink-500 text-white text-xs rounded hover:bg-pink-600"
                    >
                      + Emoji
                    </button>
                    <button
                      onClick={() => addFormField('color')}
                      className="px-3 py-1 bg-indigo-500 text-white text-xs rounded hover:bg-indigo-600"
                    >
                      + Color
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

      {/* Branding Editor Modal - DEPRECATED: Now integrated into tabs */}
      {false && selectedProject && (
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
