import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { Button, Input } from '../components/ui'

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if we have a valid session (from the reset link)
    const checkSession = async () => {
      try {
        const session = await authService.getSession()
        if (!session) {
          setError('Invalid or expired reset link. Please request a new one.')
        }
      } catch (err) {
        console.error('Session check error:', err)
        setError('Unable to verify reset link. Please try again.')
      }
    }
    checkSession()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match')
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      await authService.updatePassword(password)
      
      setMessage('Password updated successfully! Redirecting to login...')
      
      // Wait a moment then redirect
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5E6D3] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 admin-layout">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[24px] border-[3px] border-black shadow-lg p-10">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-4xl font-bold text-gray-900 admin-heading">Set Your Password</h2>
            <p className="mt-3 text-base text-gray-600">
              Create a secure password for your account
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="password"
              type="password"
              label="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              helpText="Must be at least 6 characters"
              required
              minLength={6}
            />

            <Input
              id="confirmPassword"
              type="password"
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />

            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              size="medium"
              fullWidth
            >
              {loading ? 'Updating...' : 'Set Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
