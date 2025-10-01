import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { Button, Input } from '../components/ui'
import Logo from '../components/Logo'

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      if (isLogin) {
        // Login
        await authService.signIn(email, password)
        navigate('/admin')
      } else {
        // Sign up
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match')
        }
        
        await authService.signUp(email, password, {
          display_name: displayName
        })
        
        setMessage('Account created! Please check your email to verify your account.')
        setIsLogin(true)
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setDisplayName('')
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      await authService.resetPassword(email)
      setMessage('Password reset email sent! Check your inbox.')
      setShowResetPassword(false)
    } catch (err) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-[#F5E6D3] flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 admin-layout">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-[24px] border-[3px] border-black shadow-lg p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🔑</div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 admin-heading">Reset Password</h2>
              <p className="mt-3 text-base text-gray-600">
                Enter your email to receive a password reset link
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

            <form onSubmit={handleResetPassword} className="space-y-6">
              <Input
                id="email"
                type="email"
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />

              <Button
                type="submit"
                disabled={loading}
                variant="primary"
                size="medium"
                fullWidth
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  onClick={() => setShowResetPassword(false)}
                  variant="ghost"
                  size="small"
                >
                  Back to Login
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5E6D3] flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 admin-layout">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[24px] border-[3px] border-black shadow-lg p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo width={80} height={81} />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 admin-heading">
              {isLogin ? 'The Wall Admin' : 'Create Account'}
            </h2>
            <p className="mt-3 text-base text-gray-600">
              {isLogin ? 'Sign in to access the admin panel' : 'Sign up for a new account'}
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
            {!isLogin && (
              <Input
                id="displayName"
                type="text"
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                required={!isLogin}
              />
            )}

            <Input
              id="email"
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <Input
              id="password"
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />

            {!isLogin && (
              <Input
                id="confirmPassword"
                type="password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required={!isLogin}
                minLength={6}
              />
            )}

            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              size="medium"
              fullWidth
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            {isLogin && (
              <div className="text-center">
                <Button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  variant="ghost"
                  size="small"
                >
                  Forgot your password?
                </Button>
              </div>
            )}

            <div className="text-center">
              <Button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError(null)
                  setMessage(null)
                }}
                variant="ghost"
                size="small"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </Button>
            </div>
          </div>
        </div>

        {!isLogin && (
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>Note: New accounts require approval by an administrator</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LoginPage
