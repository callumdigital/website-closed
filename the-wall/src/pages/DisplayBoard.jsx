import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { noteService, projectService, realtimeService } from '../services/supabaseClient.jsx'
import { getNoteColorClasses, loadSingleFont, VIBRANT_NOTE_COLORS } from '../services/brandingService.jsx'
import Logo from '../components/Logo.jsx'
import QRCode from '../components/QRCode.jsx'
import Sidebar from '../components/Sidebar.jsx'
import Banner from '../components/Banner.jsx'

// Utility function to format timestamps in short format for display
const formatShortTimestamp = (timestamp) => {
  if (!timestamp) return ''
  
  const noteTime = new Date(timestamp)
  const now = new Date()
  const diffMs = now - noteTime
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMinutes < 1) return 'now'
  if (diffMinutes < 60) return `${diffMinutes}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  
  // For older notes, show time
  return noteTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// Helper function to apply font to DOM elements
const applyFontToElements = (fontName) => {
  console.log(`🔧 Applying font "${fontName}" to all relevant elements`)
  
  // Find all elements that should use the custom font
  const elementsToUpdate = [
    ...document.querySelectorAll('h1, h2, h3, h4, h5, h6'), // Headings
    ...document.querySelectorAll('p, span, div'), // Text elements
    ...document.querySelectorAll('[style*="fontFamily"]') // Elements with existing font styles
  ]
  
  console.log(`🔧 Found ${elementsToUpdate.length} elements to update`)
  
  elementsToUpdate.forEach((element, index) => {
    try {
      // Apply the font with fallbacks
      element.style.fontFamily = `"${fontName}", sans-serif`
      console.log(`🔧 Applied font to element ${index}:`, element.tagName, element.className)
    } catch (error) {
      console.warn(`⚠️ Failed to apply font to element ${index}:`, error)
    }
  })
  
  // Force a reflow to ensure the changes take effect
  document.body.offsetHeight
  
  console.log(`✅ Font application completed for "${fontName}"`)
}

const DisplayBoard = () => {
  const { projectId } = useParams()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState(null)
  const [fontLoaded, setFontLoaded] = useState(false)
  const [qrSize, setQrSize] = useState(120)

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Loading project data...')
        const projectData = await projectService.getProject(projectId)
        const notesData = await noteService.getAllNotes(projectId)
        
        console.log('📋 Project data:', projectData)
        console.log('📝 Notes data:', notesData)
        
        setProject(projectData)
        setNotes(notesData)
        
        // Load font if specified - simplified approach
        let fontToLoad = null
        if (projectData?.branding?.customFontFamily) {
          fontToLoad = projectData.branding.customFontFamily
          console.log('🔄 Loading custom font:', fontToLoad)
        } else if (projectData?.branding?.fontFamily && projectData.branding.fontFamily !== 'CUSTOM') {
          fontToLoad = projectData.branding.fontFamily
          console.log('🔄 Loading font:', fontToLoad)
        }
        
        if (fontToLoad) {
          try {
            await loadSingleFont(fontToLoad)
            console.log('✅ Font loading completed:', fontToLoad)
            
            // Wait a bit more for the font to be fully processed by the browser
            await new Promise(resolve => setTimeout(resolve, 300))
            console.log('✅ Font processing delay completed')
          } catch (error) {
            console.warn('⚠️ Font loading failed, continuing anyway:', error)
          }
        }
        
        setFontLoaded(true)
        
        // Apply font to DOM elements after a short delay to ensure font is loaded
        setTimeout(() => {
          if (fontToLoad) {
            console.log('🔧 Applying font to DOM elements:', fontToLoad)
            applyFontToElements(fontToLoad)
          }
        }, 500)
        
        setLoading(false)
      } catch (error) {
        console.error('❌ Error loading data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [projectId])

  // Subscribe to realtime updates
  useEffect(() => {
    if (!projectId) return

    console.log('🔴 Setting up realtime subscriptions for project:', projectId)
    
    // Subscribe to notes changes
    const notesSubscription = realtimeService.subscribeToNotes(projectId, (payload) => {
      console.log('🔴 Notes realtime event received:', payload)
      
      if (payload.eventType === 'INSERT' && payload.new) {
        // Only show approved notes on the wall
        if (payload.new.status === 'approved') {
          console.log('✅ New approved note, adding to wall:', payload.new)
          setNotes(prev => [payload.new, ...prev])
        }
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        console.log('🔄 Note updated:', payload.new)
        setNotes(prev => prev.map(note => 
          note.id === payload.new.id ? payload.new : note
        ))
      } else if (payload.eventType === 'DELETE' && payload.old) {
        console.log('🗑️ Note deleted:', payload.old)
        setNotes(prev => prev.filter(note => note.id !== payload.old.id))
      }
    })

    // Subscribe to project changes (for banner updates, etc.)
    const projectSubscription = realtimeService.subscribeToProject(projectId, (payload) => {
      console.log('🔴 Project realtime event received:', payload)
      
      if (payload.eventType === 'UPDATE' && payload.new) {
        console.log('🔄 Project updated, refreshing project data:', payload.new)
        setProject(payload.new)
      }
    })

    return () => {
      console.log('🔴 Cleaning up realtime subscriptions')
      if (notesSubscription) {
        realtimeService.unsubscribe(notesSubscription)
      }
      if (projectSubscription) {
        realtimeService.unsubscribe(projectSubscription)
      }
    }
  }, [projectId])

  // Load Roboto Condensed for the title
  useEffect(() => {
    const loadRobotoCondensed = () => {
      const existingLink = document.querySelector('link[href*="Roboto+Condensed"]')
      if (!existingLink) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&display=swap'
        document.head.appendChild(link)
        console.log('✅ Roboto Condensed font loaded for title')
      }
    }
    loadRobotoCondensed()
  }, [])

  // Calculate QR code size based on screen size
  useEffect(() => {
    const calculateQrSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      let size = 120 // Default size
      
      if (width >= 7680) size = Math.min(400, height * 0.15)      // 8K - cap at 15% of screen height
      else if (width >= 3840) size = Math.min(350, height * 0.12) // 4K - cap at 12% of screen height
      else if (width >= 2560) size = Math.min(300, height * 0.1)  // 2K - cap at 10% of screen height
      else if (width >= 1920) size = 250      // Full HD - bigger
      else if (width >= 1440) size = 220      // Large desktop - bigger
      else if (width >= 1024) size = 180      // Desktop - bigger
      else if (width >= 768) size = 140       // Tablet
      else size = 120                         // Mobile
      
      setQrSize(size)
    }

    calculateQrSize()
    window.addEventListener('resize', calculateQrSize)
    
    return () => window.removeEventListener('resize', calculateQrSize)
  }, [])

  // Reapply fonts when project data changes
  useEffect(() => {
    if (project && fontLoaded) {
      let fontToApply = null
      if (project?.branding?.customFontFamily) {
        fontToApply = project.branding.customFontFamily
      } else if (project?.branding?.fontFamily && project.branding.fontFamily !== 'CUSTOM') {
        fontToApply = project.branding.fontFamily
      }
      
      if (fontToApply) {
        // Apply font after a short delay to ensure DOM is ready
        setTimeout(() => {
          applyFontToElements(fontToApply)
        }, 100)
      }
    }
  }, [project, fontLoaded])

  // Make debug functions available globally
  useEffect(() => {
    window.testFontLoading = async (fontName = 'Roboto') => {
      console.log(`🧪 Testing font loading for: ${fontName}`)
      try {
        await loadSingleFont(fontName)
        console.log(`✅ ${fontName} loaded successfully`)
        
        // Apply to test element
        const testElement = document.querySelector('h1')
        if (testElement) {
          testElement.style.fontFamily = `"${fontName}", sans-serif`
          console.log(`✅ Applied ${fontName} to title element`)
        }
      } catch (error) {
        console.error(`❌ Failed to load ${fontName}:`, error)
      }
    }
    
    window.applyFontToAll = (fontName) => {
      applyFontToElements(fontName)
    }
    
    window.debugFonts = () => {
      const allFontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]')
      console.log('🔍 Google Fonts links:', allFontLinks.length)
      allFontLinks.forEach((link, index) => {
        console.log(`🔍 Link ${index}:`, link.href)
      })
      
      const elementsWithFonts = document.querySelectorAll('[style*="fontFamily"]')
      console.log('🔍 Elements with font styles:', elementsWithFonts.length)
      elementsWithFonts.forEach((element, index) => {
        console.log(`🔍 Element ${index}:`, element.tagName, element.className, element.style.fontFamily)
      })
    }
  }, [])

  if (loading || !fontLoaded) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-lg">
            {loading ? 'Loading...' : 'Loading fonts...'}
          </div>
        </div>
      </div>
    )
  }

  // Determine the font to use - now that we know inline styles work!
  let fontToUse = 'Inter, sans-serif'
  if (project?.branding?.customFontFamily) {
    fontToUse = project.branding.customFontFamily
    console.log('🎨 Using custom font family:', fontToUse)
  } else if (project?.branding?.fontFamily && project.branding.fontFamily !== 'CUSTOM') {
    fontToUse = project.branding.fontFamily
    console.log('🎨 Using regular font family:', fontToUse)
  } else {
    console.log('🎨 Using default font:', fontToUse)
  }

  console.log('🎨 Using font:', fontToUse)
  console.log('🎨 Project branding:', project?.branding)
  console.log('🎨 Banner config:', project?.branding?.banner)
  console.log('🎨 Banner height:', project?.branding?.banner?.height)
  console.log('🎨 Banner position:', project?.branding?.banner?.position)

  return (
    <>
      {/* Large screen optimization styles */}
      <style jsx>{`
        body {
          overflow-x: hidden;
        }
        .wall-card {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .wall-card > div {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          width: 100%;
        }
        
        .wall-title {
          font-family: 'Roboto Condensed', sans-serif !important;
        }
        
        /* Ensure wall-title overrides any branding font */
        h1.wall-title {
          font-family: 'Roboto Condensed', sans-serif !important;
        }
        
        /* Full HD (1920x1080) - Common TV size */
        @media (min-width: 1920px) {
          .wall-container {
            padding: 2rem;
          }
          .wall-title {
            font-size: 3.5rem !important;
            line-height: 1.1;
          }
          .wall-question-title {
            font-size: 2rem !important;
            line-height: 1.1;
          }
          .wall-card-text {
            font-size: 1.25rem;
            font-weight: bold;
            line-height: 1.3;
          }
        }
        
        /* 2K/QHD (2560x1440) - Large monitors */
        @media (min-width: 2560px) {
          .wall-container {
            padding: 2.5rem;
          }
          .wall-title {
            font-size: 4rem !important;
          }
          .wall-question-title {
            font-size: 2.5rem !important;
            line-height: 1.1;
          }
          .wall-card-text {
            font-size: 1.375rem;
            font-weight: bold;
            line-height: 1.3;
          }
        }
        
        /* 4K UHD (3840x2160) - 55" TVs, Large displays */
        @media (min-width: 3840px) {
          .wall-container {
            padding: 3rem;
          }
          .wall-title {
            font-size: 5rem !important;
          }
          .wall-question-title {
            font-size: 3.5rem !important;
            line-height: 1.1;
          }
          .wall-card-text {
            font-size: 1.75rem;
            font-weight: bold;
            line-height: 1.4;
          }
          .note-emoji {
            font-size: 3rem !important;
          }
        }
        
        /* 8K (7680x4320) - Ultra large displays */
        @media (min-width: 7680px) {
          .wall-container {
            padding: 4rem;
          }
          .wall-title {
            font-size: 7rem !important;
          }
          .wall-question-title {
            font-size: 5rem !important;
            line-height: 1.1;
          }
          .wall-card-text {
            font-size: 2.25rem;
            font-weight: bold;
            line-height: 1.4;
          }
          .note-emoji {
            font-size: 4rem !important;
          }
        }
        
        /* Marquee animation */
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .marquee-content {
          animation: marquee 120s linear infinite;
        }
        
        /* Ensure banner always spans full width */
        .banner-container {
          width: 100vw !important;
          left: 0 !important;
          right: 0 !important;
        }
        
        /* Make title question bigger than logo on all screen sizes */
        .wall-question-title {
          font-size: 1.5rem !important;
          line-height: 1.1 !important;
        }
        
        /* Ensure header maintains consistent height */
        .header-section {
          min-height: 80px;
          display: flex;
          align-items: center;
        }
        
        /* Make card text bigger and bold on all screen sizes */
        .wall-card-text {
          font-size: 1.25rem !important;
          font-weight: bold !important;
          line-height: 1.3;
        }
        
        /* Force title question to be larger and allow wrapping */
        h2.wall-question-title {
          font-size: 1.5rem !important;
          line-height: 1.1 !important;
          max-width: none !important;
          white-space: normal !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          hyphens: auto !important;
        }
        
        /* Large screen scaling for sidebar and banner */
        @media (min-width: 1920px) {
          .sidebar-container {
            transform: scale(1.2);
            transform-origin: top right;
          }
          .banner-container {
            transform: scale(1.2);
            transform-origin: center;
            width: 100vw !important;
            left: 0 !important;
            right: 0 !important;
          }
        }
        
        @media (min-width: 2560px) {
          .sidebar-container {
            transform: scale(1.5);
            transform-origin: top right;
          }
          .banner-container {
            transform: scale(1.5);
            transform-origin: center;
            width: 100vw !important;
            left: 0 !important;
            right: 0 !important;
          }
        }
        
        @media (min-width: 3840px) {
          .sidebar-container {
            transform: scale(2);
            transform-origin: top right;
          }
          .banner-container {
            transform: scale(2);
            transform-origin: center;
            width: 100vw !important;
            left: 0 !important;
            right: 0 !important;
          }
        }
        
      `}</style>
      
    <div 
      className="wall-container p-4 md:p-6 lg:p-8 xl:p-10" 
      style={{
        backgroundColor: project?.branding?.backgroundColor || '#F8FAFC',
        fontFamily: fontToUse,
        width: project?.branding?.sidebar?.enabled 
          ? `calc(100vw - ${project.branding.sidebar.width || '300px'})` 
          : '100vw',
        maxWidth: project?.branding?.sidebar?.enabled 
          ? `calc(100vw - ${project.branding.sidebar.width || '300px'})` 
          : '100vw',
        minHeight: project?.branding?.banner?.enabled && project?.branding?.banner?.position === 'bottom'
          ? `calc(100vh - ${project.branding.banner.height || '60px'})` 
          : '100vh',
        transition: 'width 0.3s ease, max-width 0.3s ease, min-height 0.3s ease',
        position: 'relative',
        overflowX: 'hidden',
        paddingTop: project?.branding?.banner?.enabled && project?.branding?.banner?.position === 'top'
          ? `calc(${project.branding.banner.height || '60px'} + 1rem)`
          : undefined
      }}
    >
      <div 
        className="w-full"
        style={{
          fontFamily: fontToUse
        }}
      >
        {/* Header Section - Optimized for large screens */}
        <div className="header-section flex items-center justify-between mb-6 lg:mb-8 xl:mb-10">
          <div className="flex items-center">
            <Logo width={60} height={61} className="lg:w-20 lg:h-20 xl:w-24 xl:h-24" />
            <h1 
              className="wall-title font-bold ml-2 whitespace-nowrap"
              style={{
                color: '#000000',
                fontFamily: 'Roboto Condensed, sans-serif !important',
                letterSpacing: '-0.02em'
              }}
            >
              The Wall
            </h1>
            {project?.branding?.logoUrl && (
              <>
                <div className="h-10 lg:h-12 xl:h-16 w-px bg-black mx-3 lg:mx-4"></div>
                <img 
                  src={project.branding.logoUrl} 
                  alt="Custom Logo" 
                  className="h-12 lg:h-16 xl:h-20 w-auto"
                />
              </>
            )}
          </div>
          {project?.titleQuestion && (
            <div 
              className="text-right px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4 border-[3px] border-black rounded-[20px] shadow-md"
              style={{
                fontFamily: fontToUse,
                backgroundColor: project?.branding?.questionBackgroundColor || '#F4C542'
              }}
            >
              <h2 
                className="wall-question-title font-bold leading-tight"
                style={{
                  fontFamily: fontToUse,
                  color: project?.branding?.questionTextColor || '#000000'
                }}
              >
                {project.titleQuestion}
              </h2>
            </div>
          )}
        </div>

        {/* Banner positioned under header */}
        {project?.branding?.banner?.enabled && project?.branding?.banner?.position === 'under-header' && (
          <Banner project={project} />
        )}

        
        <div className={`wall-notes-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-5 ${project?.branding?.banner?.enabled && project?.branding?.banner?.position === 'under-header' ? 'mt-6 lg:mt-8 xl:mt-10' : ''}`}>
          {notes.map((note) => (
            <div
              key={note.id}
              className={`wall-card rounded-[32px] lg:rounded-[40px] border-[3px] border-[#111] transition-all duration-200 shadow-md ${getNoteColorClasses(note.color, project?.branding?.noteShadow)}`}
              style={{
                fontFamily: fontToUse,
                width: '100%',
                height: '0',
                paddingBottom: '100%',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: VIBRANT_NOTE_COLORS[note.color] || VIBRANT_NOTE_COLORS.yellow
              }}
            >
              <div className="absolute inset-0 flex flex-col text-center p-4 lg:p-5">
                <div className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden">
                  <p 
                    className="wall-card-text text-gray-900 font-medium w-full" 
                    style={{ 
                      fontFamily: fontToUse,
                      display: '-webkit-box',
                      WebkitLineClamp: note.emoji ? 7 : 9,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      hyphens: 'auto'
                    }}
                  >
                    {note.text}
                  </p>
                </div>
                {note.emoji && (
                  <div className="note-emoji flex-shrink-0 mt-3">
                    {note.emoji}
                  </div>
                )}
                {project?.show_timestamps && (
                  <div className="wall-timestamp flex-shrink-0 text-gray-600 font-medium pt-2">
                    🕐 {formatShortTimestamp(note.created_at)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {notes.length === 0 && (
          <div 
            className="text-center text-gray-500 mt-16 lg:mt-20 xl:mt-24"
            style={{ fontFamily: fontToUse }}
          >
            <div className="text-2xl lg:text-3xl xl:text-4xl mb-4">
              No notes yet.
            </div>
            <div className="text-lg lg:text-xl xl:text-2xl">
              Be the first to add one!
            </div>
          </div>
        )}
      </div>
      
      {/* QR Code - Draggable (only if sidebar QR is hidden) */}
      {projectId && project?.branding?.sidebar?.qrCodePosition === 'hidden' && (
        <QRCode 
          url={`${window.location.origin}/${projectId}`}
          size={qrSize}
          draggable={true}
          className="hover:scale-105 transition-transform duration-200"
        />
      )}
    </div>
    
    {/* Sidebar */}
    <Sidebar project={project} qrSize={qrSize} />
    
    {/* Banner - only show if not positioned under header */}
    {!(project?.branding?.banner?.enabled && project?.branding?.banner?.position === 'under-header') && (
      <Banner project={project} />
    )}
    </>
  )
}

export default DisplayBoard