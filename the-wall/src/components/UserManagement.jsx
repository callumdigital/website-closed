import React, { useState, useEffect } from 'react'
import { userProfileService, USER_ROLES, authService } from '../services/authService'
import { Button, Input } from './ui'

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
        
        // Show success message
        alert('User invited! They will receive an email to verify their account and set their password.')
        
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 admin-layout">
      <div className="bg-white rounded-[24px] border-[3px] border-black p-6 sm:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 admin-heading">User Management</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border-[3px] border-black hover:bg-gray-100 transition-all flex items-center justify-center text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        {/* Invite Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowInvite(!showInvite)}
            variant={showInvite ? 'outline' : 'primary'}
            size="medium"
            fullWidth
          >
            {showInvite ? 'Cancel Invite' : '+ Invite New User'}
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Invite User Form - Backseat Style */}
        {showInvite && (
          <div className="mb-6 p-6 bg-[#DFF3FF] rounded-[14px] border-[3px] border-black">
            <h4 className="text-lg font-bold text-gray-900 mb-4 admin-heading">Invite New User</h4>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="email"
                  label="Email Address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
                
                <Input
                  type="text"
                  label="Display Name"
                  value={inviteDisplayName}
                  onChange={(e) => setInviteDisplayName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div>
                <label className="block text-base font-bold text-gray-900 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-3 border-[3px] border-black rounded-[14px] focus:outline-none bg-gray-50 font-bold"
                >
                  <option value={USER_ROLES.VIEWER}>Viewer (Read-only)</option>
                  <option value={USER_ROLES.ADMIN}>Admin (Manage projects)</option>
                  <option value={USER_ROLES.OWNER}>Owner (Full access)</option>
                </select>
                <p className="text-xs text-gray-600 mt-2">
                  User will receive an email to set their password
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="medium"
                  className="flex-1"
                >
                  Send Invite
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  variant="outline"
                  size="medium"
                  className="flex-1"
                >
                  Cancel
                </Button>
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
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border-[3px] border-black rounded-[14px] hover:bg-gray-50 gap-3"
                  >
                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {user.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-gray-900 truncate">
                            {user.display_name || 'No name'}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 truncate">{user.email || user.user_id}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                        className={`px-3 py-2 text-sm rounded-[14px] border-[3px] border-black font-bold focus:outline-none ${getRoleBadgeColor(user.role)}`}
                      >
                        <option value={USER_ROLES.VIEWER}>Viewer</option>
                        <option value={USER_ROLES.ADMIN}>Admin</option>
                        <option value={USER_ROLES.OWNER}>Owner</option>
                      </select>

                      <div className="text-xs text-gray-500 font-medium">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>

                      <button
                        onClick={() => handleDeleteUser(user.user_id)}
                        className="px-3 py-2 bg-red-500 text-white text-sm rounded-[14px] hover:bg-red-600 transition-all border-[3px] border-black font-bold hover:translate-y-[-2px]"
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
        <div className="mt-6 p-4 bg-[#DFF3FF] rounded-[14px] border-[3px] border-black">
          <h4 className="text-sm font-bold text-gray-900 mb-3 admin-heading">Role Permissions</h4>
          <div className="space-y-2 text-sm text-gray-700">
            <p><strong className="font-bold">Owner:</strong> Full access, can manage users and all features</p>
            <p><strong className="font-bold">Admin:</strong> Can manage projects, notes, and settings</p>
            <p><strong className="font-bold">Viewer:</strong> Read-only access to projects and notes</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserManagement
