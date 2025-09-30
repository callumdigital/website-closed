import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { authService, userProfileService, permissions } from '../services/authService'

const ProtectedRoute = ({ children, requireRole = null }) => {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        
        if (!currentUser) {
          setLoading(false)
          return
        }

        setUser(currentUser)

        // Get user profile with role
        const profile = await userProfileService.getUserProfile(currentUser.id)
        setUserProfile(profile)

        // Check role-based authorization
        if (requireRole) {
          const hasPermission = permissions[requireRole]?.(profile.role)
          setAuthorized(hasPermission)
        } else {
          // Just require authentication, no specific role
          setAuthorized(true)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setAuthorized(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(() => {
      checkAuth()
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [requireRole])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Your role: <span className="font-medium">{userProfile?.role || 'No role assigned'}</span>
          </p>
          <button
            onClick={() => authService.signOut().then(() => window.location.href = '/login')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  // Clone children and pass user and profile as props
  return React.cloneElement(children, { user, userProfile })
}

export default ProtectedRoute
