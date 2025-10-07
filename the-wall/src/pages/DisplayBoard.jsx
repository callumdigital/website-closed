import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { noteService, projectService, realtimeService } from '../services/supabaseClient.jsx'
import { getNoteColorClasses, loadSingleFont, VIBRANT_NOTE_COLORS } from '../services/brandingService.jsx'
import Logo from '../components/Logo.jsx'
import QRCode from '../components/QRCode.jsx'

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

    console.log('🔴 Setting up realtime subscription for project:', projectId)
    
    const subscription = realtimeService.subscribeToNotes(projectId, (payload) => {
      console.log('🔴 Realtime event received:', payload)
      
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

    return () => {
      console.log('🔴 Cleaning up realtime subscription')
      if (subscription) {
        realtimeService.unsubscribe(subscription)
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
      let size = 120 // Default size
      
      if (width >= 1920) size = 250      // Full HD - bigger
      else if (width >= 1440) size = 220  // Large desktop - bigger
      else if (width >= 1024) size = 180  // Desktop - bigger
      else if (width >= 768) size = 140   // Tablet
      else size = 120                     // Mobile
      
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

  return (
    <>
      {/* Large screen optimization styles */}
      <style jsx>{`
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
          .wall-card-text {
            font-size: 1.125rem;
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
          .wall-card-text {
            font-size: 1.25rem;
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
          .wall-card-text {
            font-size: 1.5rem;
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
          .wall-card-text {
            font-size: 2rem;
            line-height: 1.4;
          }
          .note-emoji {
            font-size: 4rem !important;
          }
        }
      `}</style>
      
    <div 
      className="wall-container min-h-screen w-full p-4 md:p-6 lg:p-8 xl:p-10" 
      style={{
        backgroundColor: project?.branding?.backgroundColor || '#F8FAFC',
        fontFamily: fontToUse,
        width: '100vw',
        maxWidth: '100vw',
        overflow: 'hidden'
      }}
    >
      <div 
        className="w-full"
        style={{
          fontFamily: fontToUse
        }}
      >
        {/* Header Section - Optimized for large screens */}
        <div className="flex items-center justify-between mb-6 lg:mb-8 xl:mb-10">
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
                className="wall-question-title font-bold leading-tight whitespace-nowrap"
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

        
        <div className="wall-notes-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-5">
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
      
      {/* QR Code - Fixed to bottom right */}
      {projectId && (
        <div className="fixed bottom-4 right-4 z-10">
          <div className="text-center">
            <QRCode 
              url={`${window.location.origin}/form/${projectId}`}
              size={qrSize}
              className="hover:scale-105 transition-transform duration-200 mb-2"
            />
            <div className="text-xs sm:text-sm text-gray-600 font-bold bg-white px-2 py-1 sm:px-3 sm:py-2 rounded border border-gray-300 shadow-sm">
              Scan to add note
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}

export default DisplayBoard