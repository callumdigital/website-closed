import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'

const LandingPage = () => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authService.getSession()
        if (session?.user) {
          setUser(session.user)
          
          // Get user profile
          const profile = await authService.getUserProfile(session.user.id)
          setUserProfile(profile)
          
          // If user is authenticated, redirect to admin
          navigate('/admin')
          return
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">📝</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">The Wall</h1>
                <p className="text-sm text-gray-600">Interactive Sticky Note Platform</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium border border-blue-600"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to The Wall
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Create interactive sticky note walls for workshops, brainstorming, and collaboration
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Walls</h3>
            <p className="text-gray-600 text-sm">
              Set up custom sticky note walls for any project or event
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Collaborate</h3>
            <p className="text-gray-600 text-sm">
              Share links with participants to add notes in real-time
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage</h3>
            <p className="text-gray-600 text-sm">
              Moderate, approve, and organize notes with admin controls
            </p>
          </div>
        </div>

        {/* How to Access */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            How to Access Your Walls
          </h3>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Sign In to Admin</h4>
                <p className="text-gray-600 mb-3">
                  Use the "Sign In" button above to access the admin panel where you can create and manage your walls.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  Go to Admin Panel →
                </button>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Access Project Walls</h4>
                <p className="text-gray-600 mb-3">
                  Once you have a project, you can access it directly using these URL patterns:
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded text-sm border">
                      thewall.callum.digital/your-project-id
                    </code>
                    <span className="text-sm text-gray-500">← Add notes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded text-sm border">
                      thewall.callum.digital/your-project-id/display
                    </code>
                    <span className="text-sm text-gray-500">← View wall</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Share with Participants</h4>
                <p className="text-gray-600">
                  Share the project URLs with your team or workshop participants so they can add their notes to your wall.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>Need help? Contact support or check the documentation for more details.</p>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
