import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import Logo from '../components/Logo'

const LandingPage = () => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth check timeout')), 3000)
        )
        
        const session = await Promise.race([
          authService.getSession(),
          timeoutPromise
        ])
        
        if (session?.user) {
          setUser(session.user)
          
          try {
            // Get user profile with timeout
            const profile = await Promise.race([
              authService.getUserProfile(session.user.id),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Profile fetch timeout')), 2000)
              )
            ])
            setUserProfile(profile)
          } catch (profileError) {
            console.warn('Profile fetch error:', profileError)
            // Continue anyway, just without profile
          }
          
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
      <div className="min-h-screen bg-[#F5E6D3] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-[4px] border-black border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-900 font-bold">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5E6D3]">
      {/* Header */}
      <div className="bg-white border-b-[3px] border-black">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Logo width={45} height={46} />
              <h1 className="text-2xl font-bold text-black" style={{ fontFamily: 'Roboto Condensed, sans-serif', letterSpacing: '-0.02em' }}>
                The Wall
              </h1>
            </div>
            
            <button
              onClick={() => navigate('/login')}
              className="btn-primary px-7 py-2.5 bg-[#F5E6D3] text-black rounded-full font-bold text-sm border-[3px] border-black"
              style={{ 
                fontFamily: 'Roboto Condensed, sans-serif'
              }}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-20 md:py-32">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-[2px] border-black rounded-full">
              <span className="text-xl">📝</span>
              <span className="text-sm font-bold text-black" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>
                LIVE STICKY NOTE DISPLAYS
              </span>
            </div>
          </div>

          <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-black mb-10 text-center" style={{ fontFamily: 'Roboto Condensed, sans-serif', letterSpacing: '-0.03em', lineHeight: '1.05' }}>
            Collect thoughts.{' '}
            <span className="relative inline-block">
              <span className="relative z-10">Display them</span>
              <span className="absolute bottom-2 left-0 w-full h-4 bg-[#F4C542] -rotate-1 -z-0"></span>
            </span>{' '}
            live.
          </h2>

          <p className="text-xl sm:text-2xl text-gray-800 mb-8 text-center max-w-3xl mx-auto leading-relaxed" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
            Gather sticky notes from anyone via a form, then watch them appear in real-time on a big screen. Perfect for workshops, events, and live feedback.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button
              onClick={() => navigate('/login')}
              className="btn-primary px-10 py-4 bg-[#F4C542] text-black text-lg rounded-full font-bold border-[3px] border-black w-full sm:w-auto"
              style={{ 
                fontFamily: 'Roboto Condensed, sans-serif'
              }}
            >
              Get Started
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn-secondary px-10 py-4 bg-white text-black text-lg rounded-full font-bold border-[3px] border-black w-full sm:w-auto"
              style={{ 
                fontFamily: 'Roboto Condensed, sans-serif'
              }}
            >
              View Demo
            </button>
          </div>

          {/* Flow */}
          <div className="flex items-center justify-center gap-3 text-base text-gray-700 flex-wrap" style={{ fontFamily: 'Inter, sans-serif' }}>
            <span className="font-medium">Share link</span>
            <span className="text-2xl">→</span>
            <span className="font-medium">People submit</span>
            <span className="text-2xl">→</span>
            <span className="font-medium">Appear instantly</span>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 md:py-28">
        <h3 className="text-4xl md:text-5xl font-bold text-black mb-4 text-center" style={{ fontFamily: 'Roboto Condensed, sans-serif', letterSpacing: '-0.02em' }}>
          Everything you need
        </h3>
        <p className="text-xl text-gray-700 mb-16 text-center max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
          From form creation to live display, we've got you covered
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Custom Forms */}
          <div className="group bg-gradient-to-br from-[#FFD35A] to-[#FFEAA7] rounded-[28px] border-[3px] border-black p-8 hover:translate-y-[-4px] transition-all duration-200 cursor-pointer">
            <div className="w-16 h-16 bg-black rounded-[16px] flex items-center justify-center mb-6 group-hover:rotate-[-5deg] transition-transform duration-200">
              <span className="text-3xl">📝</span>
            </div>
            <h3 className="text-3xl font-bold text-black mb-4" style={{ fontFamily: 'Roboto Condensed, sans-serif', letterSpacing: '-0.01em' }}>
              Custom Forms
            </h3>
            <p className="text-gray-900 leading-relaxed text-lg mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Build your form with drag-and-drop questions, emoji reactions, and color-coded responses
            </p>
            <ul className="space-y-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              <li className="flex items-center gap-2 text-gray-800">
                <span className="text-lg">•</span> Multiple question types
              </li>
              <li className="flex items-center gap-2 text-gray-800">
                <span className="text-lg">•</span> Custom branding
              </li>
              <li className="flex items-center gap-2 text-gray-800">
                <span className="text-lg">•</span> Mobile optimized
              </li>
            </ul>
          </div>

          {/* Live Display */}
          <div className="group bg-gradient-to-br from-[#74B9FF] to-[#C9E7FF] rounded-[28px] border-[3px] border-black p-8 hover:translate-y-[-4px] transition-all duration-200 cursor-pointer">
            <div className="w-16 h-16 bg-black rounded-[16px] flex items-center justify-center mb-6 group-hover:rotate-[5deg] transition-transform duration-200">
              <span className="text-3xl">📺</span>
            </div>
            <h3 className="text-3xl font-bold text-black mb-4" style={{ fontFamily: 'Roboto Condensed, sans-serif', letterSpacing: '-0.01em' }}>
              Live Display
            </h3>
            <p className="text-gray-900 leading-relaxed text-lg mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Watch notes appear instantly on any screen, from phones to 8K displays
            </p>
            <ul className="space-y-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              <li className="flex items-center gap-2 text-gray-800">
                <span className="text-lg">•</span> Real-time updates
              </li>
              <li className="flex items-center gap-2 text-gray-800">
                <span className="text-lg">•</span> TV optimized (4K/8K)
              </li>
              <li className="flex items-center gap-2 text-gray-800">
                <span className="text-lg">•</span> Auto-scaling text
              </li>
            </ul>
          </div>

          {/* Moderation */}
          <div className="group bg-gradient-to-br from-[#A29BFE] to-[#E9D5FF] rounded-[28px] border-[3px] border-black p-8 hover:translate-y-[-4px] transition-all duration-200 cursor-pointer">
            <div className="w-16 h-16 bg-black rounded-[16px] flex items-center justify-center mb-6 group-hover:rotate-[-5deg] transition-transform duration-200">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-3xl font-bold text-black mb-4" style={{ fontFamily: 'Roboto Condensed, sans-serif', letterSpacing: '-0.01em' }}>
              Moderation
            </h3>
            <p className="text-gray-900 leading-relaxed text-lg mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Full control over what appears on your wall with powerful admin tools
            </p>
            <ul className="space-y-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              <li className="flex items-center gap-2 text-gray-800">
                <span className="text-lg">•</span> Approve/reject notes
              </li>
              <li className="flex items-center gap-2 text-gray-800">
                <span className="text-lg">•</span> Hide inappropriate content
              </li>
              <li className="flex items-center gap-2 text-gray-800">
                <span className="text-lg">•</span> Export to CSV
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-5xl mx-auto px-6 lg:px-12 py-16 md:py-24">
        <div className="bg-white rounded-[32px] border-[2px] border-black p-10 lg:p-16">
          <h3 className="text-4xl md:text-5xl font-bold text-black mb-16 text-center" style={{ fontFamily: 'Roboto Condensed, sans-serif', letterSpacing: '-0.02em' }}>
            How It Works
          </h3>
          
          <div className="space-y-12">
            <div className="flex items-start gap-6 md:gap-8">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>
                1
              </div>
              <div className="flex-1">
                <h4 className="text-2xl md:text-3xl font-bold text-black mb-3" style={{ fontFamily: 'Roboto Condensed, sans-serif', letterSpacing: '-0.01em' }}>
                  Create Your Wall
                </h4>
                <p className="text-gray-700 text-lg leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Sign in, create a project, and customize your form with questions, colors, and emojis.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6 md:gap-8">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>
                2
              </div>
              <div className="flex-1">
                <h4 className="text-2xl md:text-3xl font-bold text-black mb-3" style={{ fontFamily: 'Roboto Condensed, sans-serif', letterSpacing: '-0.01em' }}>
                  Share the Link
                </h4>
                <p className="text-gray-700 text-lg mb-4 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Give participants your form URL so they can submit their thoughts:
                </p>
                <code className="bg-[#F5E6D3] px-5 py-3 rounded-full text-sm md:text-base font-mono border-[2px] border-black inline-block break-all">
                  thewall.callum.digital/<span className="text-blue-600">project</span>
                </code>
              </div>
            </div>

            <div className="flex items-start gap-6 md:gap-8">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>
                3
              </div>
              <div className="flex-1">
                <h4 className="text-2xl md:text-3xl font-bold text-black mb-3" style={{ fontFamily: 'Roboto Condensed, sans-serif', letterSpacing: '-0.01em' }}>
                  Display Live
                </h4>
                <p className="text-gray-700 text-lg mb-4 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Open the display URL on a big screen and watch notes appear instantly:
                </p>
                <code className="bg-[#F5E6D3] px-5 py-3 rounded-full text-sm md:text-base font-mono border-[2px] border-black inline-block break-all">
                  thewall.callum.digital/<span className="text-blue-600">project</span>/display
                </code>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => navigate('/login')}
              className="btn-primary px-12 py-4 bg-[#F4C542] text-black text-lg rounded-full font-bold border-[3px] border-black"
              style={{ 
                fontFamily: 'Roboto Condensed, sans-serif'
              }}
            >
              Start Building Your Wall
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-[2px] border-black bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Logo width={35} height={36} />
              <span className="text-lg font-bold text-black" style={{ fontFamily: 'Roboto Condensed, sans-serif' }}>
                The Wall
              </span>
            </div>
            <p className="text-gray-700 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              Built by{' '}
              <a 
                href="https://callum.digital" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-black font-bold hover:underline transition-all"
              >
                Callum Healey
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
