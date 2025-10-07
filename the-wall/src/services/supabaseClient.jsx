// Import Supabase client
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

let supabase = null
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} catch (error) {
  console.warn('Supabase client creation failed, using mock data:', error)
}

// Project Service
export const projectService = {
  async getAllProjects() {
    if (!supabase) {
      // Fallback to mock data
      return [
        {
          id: 'demo',
          name: 'Demo Project',
          description: 'A sample project for testing',
          status: 'active',
          auto_approve: false,
          show_timestamps: true,
          created_at: '2025-09-23T04:22:31.910945+00:00',
          updated_at: '2025-09-23T04:22:31.910945+00:00',
          branding: {
            primaryColor: '#3B82F6',
            secondaryColor: '#64748B',
            backgroundColor: '#F8FAFC',
            fontFamily: 'Inter',
            headingColor: '#1E293B',
            noteColors: ['yellow', 'blue', 'pink', 'green', 'purple'],
            noteBorderRadius: '8px',
            noteShadow: 'medium',
            maxWidth: '1200px'
          }
        }
      ]
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Map database fields to JavaScript properties
      if (data) {
        data.forEach(project => {
          project.titleQuestion = project.title_question || ''
        })
      }
      
      return data || []
    } catch (error) {
      console.error('Error fetching projects:', error)
      return []
    }
  },

  async getProjectById(id) {
    if (!supabase) {
      return {
        id: 'demo',
        name: 'Demo Project',
        description: 'A sample project for testing',
        status: 'active',
        auto_approve: false,
        show_timestamps: true
      }
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      
      // Map database field to JavaScript property
      if (data) {
        data.titleQuestion = data.title_question || ''
      }
      
      return data
    } catch (error) {
      console.error('Error fetching project:', error)
      return null
    }
  },

  async getProject(id) {
    return this.getProjectById(id)
  },

  async getProjects() {
    return this.getAllProjects().then(projects => 
      projects.filter(p => p.status === 'active')
    )
  },

  async getArchivedProjects() {
    return this.getAllProjects().then(projects => 
      projects.filter(p => p.status === 'archived')
    )
  },

  async createProject(projectData) {
    if (!supabase) {
      return {
        id: 'new-project-' + Date.now(),
        ...projectData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  },

  async updateProjectStatus(projectId, status) {
    if (!supabase) {
      return { id: projectId, status, updated_at: new Date().toISOString() }
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating project status:', error)
      throw error
    }
  },

  async updateProjectSettings(projectId, settings) {
    if (!supabase) {
      return { id: projectId, ...settings, updated_at: new Date().toISOString() }
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ 
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating project settings:', error)
      throw error
    }
  }
}

// Note Service
export const noteService = {
  async getAllNotes(projectId) {
    if (!supabase) {
      // Fallback to mock data
      return [
        {
          id: '1',
          project_id: projectId,
          text: 'This is a sample note!',
          color: 'yellow',
          status: 'approved',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    }

    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching notes:', error)
      return []
    }
  },

  async createNote(noteData, projectSettings) {
    if (!supabase) {
      return { 
        id: 'test-' + Date.now(), 
        ...noteData,
        status: projectSettings?.auto_approve ? 'approved' : 'pending',
        created_at: new Date().toISOString()
      }
    }

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          ...noteData,
          status: projectSettings?.auto_approve ? 'approved' : 'pending'
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating note:', error)
      throw error
    }
  },

  async updateNoteStatus(noteId, status) {
    if (!supabase) {
      return { id: noteId, status, updated_at: new Date().toISOString() }
    }

    try {
      const { data, error } = await supabase
        .from('notes')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating note status:', error)
      throw error
    }
  },

  async updateNoteText(noteId, text) {
    if (!supabase) {
      return { id: noteId, text, updated_at: new Date().toISOString() }
    }

    try {
      const { data, error } = await supabase
        .from('notes')
        .update({ 
          text,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating note text:', error)
      throw error
    }
  },

  async removeNote(noteId) {
    if (!supabase) {
      return true
    }

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('Error removing note:', error)
      throw error
    }
  }
}

// Real-time Service
export const realtimeService = {
  subscribeToNotes(projectId, callback) {
    if (!supabase) {
      return { unsubscribe: () => {} }
    }

    try {
      return supabase
        .channel(`notes-${projectId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'notes',
            filter: `project_id=eq.${projectId}`
          }, 
          callback
        )
        .subscribe()
    } catch (error) {
      console.error('Error subscribing to notes:', error)
      return { unsubscribe: () => {} }
    }
  },

  subscribeToProject(projectId, callback) {
    if (!supabase) {
      return { unsubscribe: () => {} }
    }

    try {
      return supabase
        .channel(`project-${projectId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'projects',
            filter: `id=eq.${projectId}`
          }, 
          callback
        )
        .subscribe()
    } catch (error) {
      console.error('Error subscribing to project:', error)
      return { unsubscribe: () => {} }
    }
  },

  unsubscribe(subscription) {
    if (supabase && subscription) {
      supabase.removeChannel(subscription)
    }
  }
}