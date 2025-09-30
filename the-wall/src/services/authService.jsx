import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || null

let supabase = null
let supabaseAdmin = null

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  // Create admin client if service key is available
  if (supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
} catch (error) {
  console.warn('Supabase client creation failed:', error)
}

// User roles
export const USER_ROLES = {
  OWNER: 'owner',       // Full access, can create/manage users
  ADMIN: 'admin',       // Can manage projects and notes
  VIEWER: 'viewer'      // Read-only access
}

// Auth Service
export const authService = {
  // Sign up new user (email/password)
  async signUp(email, password, metadata = {}) {
    if (!supabase) throw new Error('Supabase not initialized')
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    
    if (error) throw error
    return data
  },

  // Sign in with email/password
  async signIn(email, password) {
    if (!supabase) throw new Error('Supabase not initialized')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },

  // Sign out
  async signOut() {
    if (!supabase) throw new Error('Supabase not initialized')
    
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current user
  async getCurrentUser() {
    if (!supabase) return null
    
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Get current session
  async getSession() {
    if (!supabase) return null
    
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } }
    
    return supabase.auth.onAuthStateChange(callback)
  },

  // Reset password
  async resetPassword(email) {
    if (!supabase) throw new Error('Supabase not initialized')
    
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`
    })
    
    if (error) throw error
  },

  // Send password setup email for new users
  async sendPasswordSetupEmail(email) {
    if (!supabase) throw new Error('Supabase not initialized')
    
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`
    })
    
    if (error) throw error
  },

  // Update password
  async updatePassword(newPassword) {
    if (!supabase) throw new Error('Supabase not initialized')
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (error) throw error
  },

  // Verify email with token
  async verifyEmail(token) {
    if (!supabase) throw new Error('Supabase not initialized')
    
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'signup'
    })
    
    if (error) throw error
  },

  // Delete user from auth (admin only - requires service role)
  async deleteUser(userId) {
    if (!supabaseAdmin) {
      throw new Error('Service role key not available. Cannot delete user from auth.')
    }
    
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) throw error
  }
}

// User Profile Service (with roles)
export const userProfileService = {
  // Get user profile with role
  async getUserProfile(userId) {
    if (!supabase) return null
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found, return default viewer role
        return { user_id: userId, role: USER_ROLES.VIEWER, created_at: new Date().toISOString() }
      }
      throw error
    }
    
    return data
  },

  // Create user profile (owner only)
  async createUserProfile(userId, role, displayName = null) {
    if (!supabase) throw new Error('Supabase not initialized')
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{
        user_id: userId,
        role,
        display_name: displayName
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update user role (owner only)
  async updateUserRole(userId, newRole) {
    if (!supabase) throw new Error('Supabase not initialized')
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get all users (owner only)
  async getAllUsers() {
    if (!supabase) return []
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Delete user profile (owner only)
  async deleteUserProfile(userId) {
    if (!supabase) throw new Error('Supabase not initialized')
    
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId)
    
    if (error) throw error
  }
}

// Permission helpers
export const permissions = {
  canManageUsers(role) {
    return role === USER_ROLES.OWNER
  },

  canManageProjects(role) {
    return role === USER_ROLES.OWNER || role === USER_ROLES.ADMIN
  },

  canViewProjects(role) {
    return role === USER_ROLES.OWNER || role === USER_ROLES.ADMIN || role === USER_ROLES.VIEWER
  },

  canManageNotes(role) {
    return role === USER_ROLES.OWNER || role === USER_ROLES.ADMIN
  }
}

export default authService
