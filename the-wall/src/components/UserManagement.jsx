import React, { useState, useEffect } from 'react'
import { userProfileService, USER_ROLES, authService } from '../services/authService'

const UserManagement = ({ onClose }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState(USER_ROLES.VIEWER)
  const [inviteDisplayName, setInviteDisplayName] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const usersData = await userProfileService.getAllUsers()
      setUsers(usersData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await userProfileService.updateUserRole(userId, newRole)
      setUsers(prev => prev.map(user => 
        user.user_id === userId ? { ...user, role: newRole } : user
      ))
    } catch (err) {
      alert(`Failed to update role: ${err.message}`)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This will remove them from the system completely. This action cannot be undone.')) {
      return
    }

    try {
      // First try to delete from auth (if service key is available)
      try {
        await authService.deleteUser(userId)
      } catch (authError) {
        console.warn('Could not delete from auth:', authError.message)
        // Continue with profile deletion even if auth deletion fails
      }
      
      // Delete the profile
      await userProfileService.deleteUserProfile(userId)
      
      // Remove from local list
      setUsers(prev => prev.filter(user => user.user_id !== userId))
      
      alert('User deleted successfully!')
    } catch (err) {
      alert(`Failed to delete user: ${err.message}`)
    }
  }

  const handleInviteUser = async (e) => {
    e.preventDefault()
    
    try {
      // Generate a random temporary password
      const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!'
      
      // Create the auth user
      const { user, error: signupError } = await authService.signUp(inviteEmail, tempPassword, {
        display_name: inviteDisplayName
      })
      
      if (signupError) {
        throw signupError
      }
      
      if (user) {
        // Wait a moment for the auto-trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Update the profile with the correct role (instead of creating a new one)
        await userProfileService.updateUserRole(user.id, inviteRole)
        
        // Sign out the newly created user
        await authService.signOut()
        
        // Send password setup email
        await authService.sendPasswordSetupEmail(inviteEmail)
        
        // Show success message
        alert('User invited! They will receive an email to set their password.')
        
        // Reset form
        setInviteEmail('')
        setInviteDisplayName('')
        setInviteRole(USER_ROLES.VIEWER)
        setShowInvite(false)
        
        // Reload users list (don't reload page to stay logged in)
        await loadUsers()
      }
    } catch (err) {
      console.error('Invite error:', err)
      alert(`Failed to invite user: ${err.message}`)
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case USER_ROLES.OWNER:
        return 'bg-purple-100 text-purple-800'
      case USER_ROLES.ADMIN:
        return 'bg-blue-100 text-blue-800'
      case USER_ROLES.VIEWER:
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              {showInvite ? 'Cancel' : '+ Invite User'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Invite User Form */}
        {showInvite && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Invite New User</h4>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="user@example.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={inviteDisplayName}
                    onChange={(e) => setInviteDisplayName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={USER_ROLES.VIEWER}>Viewer (Read-only)</option>
                    <option value={USER_ROLES.ADMIN}>Admin (Manage projects)</option>
                    <option value={USER_ROLES.OWNER}>Owner (Full access)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    User will receive an email to set their password
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  Send Invite
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading users...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium text-gray-700">All Users ({users.length})</h4>
            </div>

            {users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No users found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                          {user.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.display_name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email || user.user_id}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                        className={`px-3 py-1 text-sm rounded-full font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${getRoleBadgeColor(user.role)}`}
                      >
                        <option value={USER_ROLES.VIEWER}>Viewer</option>
                        <option value={USER_ROLES.ADMIN}>Admin</option>
                        <option value={USER_ROLES.OWNER}>Owner</option>
                      </select>

                      <div className="text-xs text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>

                      <button
                        onClick={() => handleDeleteUser(user.user_id)}
                        className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 transition-colors"
                        title="Delete user"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Role Descriptions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Role Permissions</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <p><strong>Owner:</strong> Full access, can manage users and all features</p>
            <p><strong>Admin:</strong> Can manage projects, notes, and settings</p>
            <p><strong>Viewer:</strong> Read-only access to projects and notes</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserManagement
