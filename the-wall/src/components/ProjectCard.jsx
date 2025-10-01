import React, { useState, useEffect } from 'react'
import { noteService } from '../services/supabaseClient'

const ProjectCard = ({ project, onClick }) => {
  const [stats, setStats] = useState({ total: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const notes = await noteService.getAllNotes(project.id)
        const total = notes.length
        const pending = notes.filter(n => n.status === 'pending').length
        setStats({ total, pending })
      } catch (error) {
        console.error('Error loading stats for', project.id, error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [project.id])
  
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-[20px] border-[3px] border-black p-6 cursor-pointer transition-all duration-200 hover:translate-y-[-4px] hover:shadow-lg"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 admin-heading mb-1">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
        <span className={`px-3 py-1 text-xs rounded-full font-bold ml-2 flex-shrink-0 ${
          project.status === 'active' 
            ? 'bg-green-100 text-green-800 border-2 border-green-300' 
            : 'bg-gray-100 text-gray-800 border-2 border-gray-300'
        }`}>
          {project.status === 'active' ? '✓ Active' : '📦 Archived'}
        </span>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-[14px] border-[3px] border-black p-3">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-600 font-bold">Total Notes</div>
          </div>
          {stats.pending > 0 ? (
            <div className="bg-[#FFF4C7] rounded-[14px] border-[3px] border-black p-3 relative">
              <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
              <div className="text-xs text-gray-600 font-bold">Pending</div>
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full border-2 border-white"></div>
            </div>
          ) : (
            <div className="bg-[#D1FAE5] rounded-[14px] border-[3px] border-black p-3">
              <div className="text-2xl font-bold text-green-700">✓</div>
              <div className="text-xs text-gray-600 font-bold">All Clear</div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t-2 border-gray-200">
        <span className="font-medium">
          Updated {getRelativeTime(project.updated_at || project.created_at)}
        </span>
        {project.auto_approve && (
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
            ⚡ Auto
          </span>
        )}
      </div>
    </div>
  )
}

// Helper function for relative time
const getRelativeTime = (timestamp) => {
  if (!timestamp) return 'recently'
  
  const now = new Date()
  const date = new Date(timestamp)
  const diffInSeconds = Math.floor((now - date) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return date.toLocaleDateString()
}

export default ProjectCard

