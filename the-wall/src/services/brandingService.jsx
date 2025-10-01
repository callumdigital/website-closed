// Branding service for handling project customization
import WebFont from 'webfontloader'

// Default branding configuration optimized for large displays
export const DEFAULT_BRANDING = {
  primaryColor: '#3B82F6',
  secondaryColor: '#64748B',
  backgroundColor: '#F8FAFC',
  fontFamily: 'Inter',
  customFontFamily: '',
  headingColor: '#1E293B',
  noteColors: ['yellow', 'blue', 'pink', 'green', 'purple'],
  noteBorderRadius: '12px',
  noteShadow: 'medium',
  maxWidth: '100vw' // Full viewport width for large displays
}

// Google Fonts mapping
export const GOOGLE_FONTS = {
  'Inter': 'Inter:wght@300;400;500;600;700',
  'Roboto': 'Roboto:wght@300;400;500;700',
  'Open Sans': 'Open+Sans:wght@300;400;500;600;700',
  'Lato': 'Lato:wght@300;400;700',
  'Poppins': 'Poppins:wght@300;400;500;600;700',
  'Montserrat': 'Montserrat:wght@300;400;500;600;700',
  'Source Sans Pro': 'Source+Sans+Pro:wght@300;400;600;700',
  'Fredoka': 'Fredoka:wght@300;400;500;600;700'
}

// Check if a font is a system font
const isSystemFont = (fontName) => {
  const systemFonts = [
    'Helvetica', 'Arial', 'Georgia', 'Times New Roman', 'Times', 'Courier New', 'Courier',
    'Verdana', 'Geneva', 'Tahoma', 'Trebuchet MS', 'Comic Sans MS', 'Impact', 'Arial Black'
  ]
  return systemFonts.includes(fontName)
}

// Improved font loading with better error handling and timing
export const loadSingleFont = (fontName) => {
  return new Promise((resolve, reject) => {
    try {
      console.log(`🔄 Attempting to load font: ${fontName}`)
      
      // For system fonts, just resolve immediately
      if (isSystemFont(fontName)) {
        console.log(`✅ System font ${fontName} - no loading needed`)
        resolve()
        return
      }

      // Check if font link already exists (more reliable than document.fonts.check)
      const existingLink = document.querySelector(`link[href*="${fontName.replace(/\s+/g, '+')}"]`)
      if (existingLink) {
        console.log(`✅ Font ${fontName} link already exists`)
        // Wait a bit for the font to be fully processed
        setTimeout(() => {
          resolve()
        }, 100)
        return
      }

      console.log(`🔄 Loading Google Font: ${fontName}`)
      
      // Create the Google Fonts URL
      const fontUrl = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`
      console.log(`🔗 Generated font URL: ${fontUrl}`)
      
      // Create and add the link element
      const fontLink = document.createElement('link')
      fontLink.rel = 'stylesheet'
      fontLink.href = fontUrl
      fontLink.crossOrigin = 'anonymous' // Add CORS support
      
      // Use both onload and onerror for better reliability
      let resolved = false
      
      const resolveOnce = (success = true) => {
        if (!resolved) {
          resolved = true
          if (success) {
            console.log(`✅ Font ${fontName} loading completed`)
            resolve()
          } else {
            console.warn(`⚠️ Font ${fontName} loading failed`)
            resolve() // Still resolve to prevent blocking
          }
        }
      }
      
      fontLink.onload = () => {
        console.log(`✅ Font CSS loaded for ${fontName}`)
        
        // Give the browser time to process the font
        setTimeout(() => {
          // Try to verify font is loaded, but don't block on it
          if (document.fonts && document.fonts.check(`16px "${fontName}"`)) {
            console.log(`✅ Font ${fontName} verified as available`)
          } else {
            console.log(`📝 Font ${fontName} CSS loaded (verification skipped)`)
          }
          resolveOnce(true)
        }, 200)
      }
      
      fontLink.onerror = (error) => {
        console.warn(`⚠️ Failed to load font CSS for ${fontName}:`, error)
        resolveOnce(false)
      }
      
      // Add timeout fallback
      setTimeout(() => {
        resolveOnce(true) // Resolve anyway to prevent infinite waiting
      }, 5000)
      
      document.head.appendChild(fontLink)
    } catch (error) {
      console.warn(`⚠️ Error loading font ${fontName}:`, error)
      resolve() // Don't reject, just resolve to prevent blocking
    }
  })
}

// Preload all Google Fonts using direct link injection
export const preloadAllGoogleFonts = async () => {
  console.log('🔄 Starting to preload all Google Fonts using direct link injection...')
  
  try {
    // Get all font names from GOOGLE_FONTS
    const fontNames = Object.keys(GOOGLE_FONTS)
    
    // Load all fonts in parallel
    const fontPromises = fontNames.map(fontName => loadSingleFont(fontName))
    await Promise.all(fontPromises)
    console.log('✅ All Google Fonts preloaded successfully')
  } catch (error) {
    console.warn('⚠️ Some fonts failed to preload:', error)
    // Don't reject, just log and continue
  }
}

// Load font dynamically using direct link injection
export const loadGoogleFont = async (fontFamily) => {
  try {
    await loadSingleFont(fontFamily)
    console.log(`✅ Font ${fontFamily} loaded dynamically`)
  } catch (error) {
    console.warn(`⚠️ Failed to load font ${fontFamily}:`, error)
  }
}

// Merge branding with defaults
export const getBranding = (projectBranding = {}) => {
  const branding = {
    ...DEFAULT_BRANDING,
    ...projectBranding
  }
  
  console.log('🔍 getBranding input:', projectBranding)
  console.log('🔍 getBranding before custom resolution:', branding)
  
  // If custom font is specified, use it as the primary font family
  console.log('🔍 Checking custom font resolution:')
  console.log('🔍 branding.fontFamily:', branding.fontFamily)
  console.log('🔍 branding.customFontFamily:', branding.customFontFamily)
  console.log('🔍 fontFamily === "CUSTOM":', branding.fontFamily === 'CUSTOM')
  console.log('🔍 customFontFamily exists:', !!branding.customFontFamily)
  
  if (branding.customFontFamily && branding.fontFamily === 'CUSTOM') {
    console.log('🔍 Custom font detected:', branding.customFontFamily)
    branding.fontFamily = branding.customFontFamily
    console.log('🔍 Font family updated to:', branding.fontFamily)
  } else {
    console.log('🔍 No custom font resolution needed')
  }
  
  console.log('🔍 getBranding final result:', branding)
  return branding
}

// Generate CSS custom properties from branding
export const generateBrandingCSS = (branding) => {
  // The font family is already resolved in getBranding()
  const actualFontFamily = branding.fontFamily
  
  console.log('🔤 Actual font family being used:', actualFontFamily)
  
  const css = `
    :root {
      --brand-primary: ${branding.primaryColor};
      --brand-secondary: ${branding.secondaryColor};
      --brand-background: ${branding.backgroundColor};
      --brand-heading: ${branding.headingColor};
      --brand-font-family: "${actualFontFamily}", sans-serif;
      --brand-max-width: ${branding.maxWidth};
      --brand-note-radius: ${branding.noteBorderRadius};
    }
    
    .branded-container {
      max-width: var(--brand-max-width);
      font-family: var(--brand-font-family) !important;
    }
    
    .branded-background {
      background-color: var(--brand-background);
      font-family: var(--brand-font-family) !important;
    }
    
    .branded-heading {
      color: var(--brand-heading);
      font-family: var(--brand-font-family) !important;
    }
    
    /* More specific selectors to override Tailwind */
    .branded-container * {
      font-family: var(--brand-font-family) !important;
    }
    
    .branded-heading * {
      font-family: var(--brand-font-family) !important;
    }
    
    .branded-button {
      background-color: var(--brand-primary);
      color: white;
    }
    
    .branded-button:hover {
      background-color: color-mix(in srgb, var(--brand-primary) 85%, black);
    }
    
    .branded-input {
      border-color: var(--brand-secondary);
    }
    
    .branded-input:focus {
      border-color: var(--brand-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-primary) 20%, transparent);
    }
  `
  
  // Add custom CSS if provided
  let finalCss = css
  if (branding.customCSS) {
    finalCss += `\n${branding.customCSS}`
  }
  
  return finalCss
}

// Vibrant color palette (more saturated, Backseat-inspired but still accessible)
export const VIBRANT_NOTE_COLORS = {
  yellow: '#FFEAA7',  // Warm vibrant yellow
  blue: '#74B9FF',    // Bright sky blue
  pink: '#FD79A8',    // Vibrant pink
  green: '#55EFC4',   // Bright mint green
  purple: '#A29BFE',  // Vivid purple
  orange: '#FDCB6E',  // Rich orange
  red: '#FF7675',     // Coral red
  indigo: '#6C5CE7'   // Deep indigo
}

// Get note color classes - simplified for inline background colors
export const getNoteColorClasses = (color, shadow = 'medium') => {
  const shadowClasses = {
    none: '',
    light: 'shadow-sm',
    medium: 'shadow-md',
    heavy: 'shadow-lg'
  }
  
  return shadowClasses[shadow] || shadowClasses.medium
}

// Load a font dynamically when branding changes
export const loadFontForBranding = async (branding) => {
  // Get the resolved branding to get the actual font family
  const resolvedBranding = getBranding(branding)
  const actualFontFamily = resolvedBranding.fontFamily
  
  console.log('🔄 Loading font for branding:', actualFontFamily)
  console.log('🔤 Original branding:', branding)
  console.log('🔤 Resolved branding:', resolvedBranding)
  
  if (actualFontFamily && actualFontFamily !== 'Inter' && actualFontFamily !== 'CUSTOM') {
    try {
      await loadSingleFont(actualFontFamily)
      console.log(`✅ Font ${actualFontFamily} loaded for branding`)
      
      // Wait a bit for the font to be applied
      setTimeout(() => {
        console.log('🔤 Font should now be applied:', actualFontFamily)
      }, 100)
    } catch (error) {
      console.warn(`⚠️ Failed to load font ${actualFontFamily} for branding:`, error)
    }
  } else {
    console.log('📝 Using default font (Inter) or no custom font specified')
  }
}

// Apply branding to a component
export const applyBranding = async (project) => {
  const branding = getBranding(project.branding)
  
  console.log('🎨 Applying branding:', branding)
  console.log('🔤 Font family:', branding.fontFamily)
  console.log('🔤 Custom font family:', branding.customFontFamily)
  
  // Load Google Font if needed FIRST
  await loadFontForBranding(branding)
  
  // Wait a bit more to ensure font is applied
  await new Promise(resolve => setTimeout(resolve, 200))
  
  // Create or update style element
  let styleElement = document.getElementById('project-branding')
  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.id = 'project-branding'
    document.head.appendChild(styleElement)
    console.log('📝 Created new style element for branding')
  } else {
    console.log('📝 Updated existing style element for branding')
  }
  
  const css = generateBrandingCSS(branding)
  styleElement.textContent = css
  console.log('📝 Applied CSS:', css)
  console.log('🔤 Font family in CSS:', branding.fontFamily)
  
  // Enhanced debugging for CSS application
  console.log('🔍 ===== CSS APPLICATION DEBUG =====')
  
  // Debug: Check if elements with branded classes exist
  const brandedElements = document.querySelectorAll('.branded-container, .branded-heading')
  console.log('🎯 Found branded elements:', brandedElements.length)
  
  // Debug: Check what elements actually exist on the page
  const allElements = document.querySelectorAll('*')
  const elementsWithClasses = Array.from(allElements).filter(el => el.className && el.className.includes('branded'))
  console.log('🎯 Elements with "branded" in class name:', elementsWithClasses.length)
  elementsWithClasses.forEach((el, index) => {
    console.log(`🎯 Element ${index}:`, el.className, el)
  })
  
  // Debug: Check computed styles of branded elements
  brandedElements.forEach((element, index) => {
    const computedStyle = window.getComputedStyle(element)
    console.log(`🎯 Element ${index} (${element.className}):`, {
      element: element,
      computedFontFamily: computedStyle.fontFamily,
      expectedFontFamily: branding.fontFamily
    })
  })
  
  // Debug: Check if CSS variables are set correctly
  const rootStyles = window.getComputedStyle(document.documentElement)
  const brandFontFamily = rootStyles.getPropertyValue('--brand-font-family')
  console.log('🎯 CSS Variable --brand-font-family:', brandFontFamily)
  
  // Debug: Check if font is actually loaded
  if (document.fonts && document.fonts.check(`16px "${branding.fontFamily}"`)) {
    console.log('🎯 Font is verified as loaded:', branding.fontFamily)
  } else {
    console.log('🎯 Font is NOT verified as loaded:', branding.fontFamily)
  }
  
  console.log('🔍 ===== END CSS APPLICATION DEBUG =====')
  
  // Force a reflow to ensure the font is applied
  document.body.offsetHeight
  
  // Additional aggressive font application
  setTimeout(() => {
    const brandedElements = document.querySelectorAll('.branded-container, .branded-heading, .branded-background')
    brandedElements.forEach(element => {
      // Force style recalculation
      element.style.fontFamily = `"${branding.fontFamily}", sans-serif`
      console.log(`🔧 Forced font application to element:`, element.className)
    })
  }, 100)

  return branding
}

// Test function to check if fonts are working
export const testFontLoading = async (fontName = 'Poppins') => {
  console.log('🧪 Testing font loading for:', fontName)
  
  try {
    await loadSingleFont(fontName)
    console.log('✅ Test font loaded successfully')
    
    // Check if font is available
    if (document.fonts && document.fonts.check(`16px "${fontName}"`)) {
      console.log('✅ Test font verified as available')
    } else {
      console.warn('⚠️ Test font not verified as available')
    }
    
    return true
  } catch (error) {
    console.error('❌ Test font loading failed:', error)
    return false
  }
}

// Test function to manually apply a font to see if it works
export const testFontApplication = (fontName = 'Oswald') => {
  console.log('🧪 ===== MANUAL FONT APPLICATION TEST =====')
  console.log('🧪 Testing font application for:', fontName)
  
  // Find a branded element and manually set its font
  const brandedElements = document.querySelectorAll('.branded-container, .branded-heading')
  console.log('🧪 Found branded elements:', brandedElements.length)
  
  if (brandedElements.length > 0) {
    brandedElements.forEach((element, index) => {
      console.log(`🧪 Element ${index} before:`, window.getComputedStyle(element).fontFamily)
      element.style.fontFamily = `"${fontName}", sans-serif`
      console.log(`🧪 Element ${index} after:`, window.getComputedStyle(element).fontFamily)
      console.log(`🧪 Element ${index}:`, element)
    })
    console.log('🧪 ✅ Manually applied font to all branded elements')
  } else {
    console.warn('⚠️ No branded elements found to test')
    
    // Try to find any text elements
    const allElements = document.querySelectorAll('h1, h2, h3, p, div')
    console.log('🧪 Found other text elements:', allElements.length)
    if (allElements.length > 0) {
      const testElement = allElements[0]
      console.log('🧪 Testing on element:', testElement)
      testElement.style.fontFamily = `"${fontName}", sans-serif`
      console.log('🧪 Element font-family is now:', window.getComputedStyle(testElement).fontFamily)
    }
  }
  console.log('🧪 ===== END MANUAL FONT APPLICATION TEST =====')
}

// Test function to check if a font URL is valid
export const testFontUrl = async (fontName = 'Roboto Condensed') => {
  console.log('🧪 Testing font URL for:', fontName)
  
  const fontUrl = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`
  console.log('🔗 Font URL:', fontUrl)
  
  try {
    const response = await fetch(fontUrl)
    console.log('📡 Font URL response status:', response.status)
    if (response.ok) {
      const css = await response.text()
      console.log('📄 Font CSS preview:', css.substring(0, 200) + '...')
      return true
    } else {
      console.warn('⚠️ Font URL returned error:', response.status, response.statusText)
      return false
    }
  } catch (error) {
    console.error('❌ Font URL test failed:', error)
    return false
  }
}

// Debug function to show exactly what happens with custom fonts
export const debugCustomFont = (branding) => {
  console.log('🔍 ===== CUSTOM FONT DEBUG =====')
  console.log('🔍 Input branding:', branding)
  
  // Show the resolution process step by step
  const step1 = { ...DEFAULT_BRANDING, ...branding }
  console.log('🔍 Step 1 - After merging with defaults:', step1)
  
  // Show custom font detection
  const hasCustomFont = step1.customFontFamily && step1.fontFamily === 'CUSTOM'
  console.log('🔍 Step 2 - Has custom font?', hasCustomFont)
  console.log('🔍 Step 2 - customFontFamily:', step1.customFontFamily)
  console.log('🔍 Step 2 - fontFamily:', step1.fontFamily)
  
  // Show final resolution
  const finalBranding = getBranding(branding)
  console.log('🔍 Step 3 - Final resolved branding:', finalBranding)
  
  // Show what URL would be generated
  const fontName = finalBranding.fontFamily
  const fontUrl = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`
  console.log('🔍 Step 4 - Generated font URL:', fontUrl)
  console.log('🔍 ===== END CUSTOM FONT DEBUG =====')
  
  return { finalBranding, fontUrl }
}

// Simple test function to check font loading
export const testFontLoadingNow = async () => {
  console.log('🧪 ===== FONT LOADING TEST =====')
  
  // Test 1: Check if we can load a simple font
  try {
    console.log('🧪 Test 1: Loading Oswald font...')
    await loadSingleFont('Oswald')
    console.log('✅ Oswald loaded successfully')
  } catch (error) {
    console.error('❌ Oswald failed to load:', error)
  }
  
  // Test 2: Check current DOM elements
  const brandedElements = document.querySelectorAll('.branded-container, .branded-heading, .branded-background')
  console.log('🧪 Test 2: Found branded elements:', brandedElements.length)
  
  // Test 3: Check if font is actually loaded
  if (document.fonts && document.fonts.check('16px "Oswald"')) {
    console.log('✅ Oswald font is verified as loaded')
  } else {
    console.log('❌ Oswald font is NOT loaded')
  }
  
  // Test 4: Try to apply font manually
  brandedElements.forEach((element, index) => {
    const originalFont = window.getComputedStyle(element).fontFamily
    element.style.fontFamily = 'Oswald, sans-serif'
    const newFont = window.getComputedStyle(element).fontFamily
    console.log(`🧪 Element ${index}: ${originalFont} → ${newFont}`)
  })
  
  console.log('🧪 ===== END FONT LOADING TEST =====')
}

// Enhanced test function for debugging font issues
export const testFontLoadingEnhanced = async (fontName = 'Roboto') => {
  console.log(`🧪 ===== ENHANCED FONT LOADING TEST: ${fontName} =====`)
  
  // Test 1: Check if font link already exists
  const existingLink = document.querySelector(`link[href*="${fontName.replace(/\s+/g, '+')}"]`)
  console.log('🧪 Existing font link:', existingLink ? 'Found' : 'Not found')
  
  // Test 2: Try to load the font
  try {
    console.log(`🧪 Loading ${fontName}...`)
    await loadSingleFont(fontName)
    console.log(`✅ ${fontName} loading completed`)
  } catch (error) {
    console.error(`❌ ${fontName} failed to load:`, error)
  }
  
  // Test 3: Check if font is available
  const isFontAvailable = document.fonts && document.fonts.check(`16px "${fontName}"`)
  console.log(`🧪 Font availability check:`, isFontAvailable ? 'Available' : 'Not available')
  
  // Test 4: Check all font links in document
  const allFontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]')
  console.log(`🧪 Total Google Fonts links:`, allFontLinks.length)
  allFontLinks.forEach((link, index) => {
    console.log(`🧪 Link ${index}:`, link.href)
  })
  
  // Test 5: Try to apply font to a test element
  const testElement = document.querySelector('h1') || document.body
  if (testElement) {
    const originalFont = window.getComputedStyle(testElement).fontFamily
    console.log(`🧪 Original font:`, originalFont)
    
    testElement.style.fontFamily = `"${fontName}", sans-serif`
    const newFont = window.getComputedStyle(testElement).fontFamily
    console.log(`🧪 New font:`, newFont)
    
    // Check if the font actually changed
    if (newFont.includes(fontName)) {
      console.log(`✅ Font successfully applied to test element`)
    } else {
      console.log(`❌ Font not applied to test element`)
    }
  }
  
  console.log(`🧪 ===== END ENHANCED FONT LOADING TEST: ${fontName} =====`)
}

// Create on-screen debug panel
export const createDebugPanel = (project) => {
  // Remove existing debug panel if it exists
  const existingPanel = document.getElementById('font-debug-panel')
  if (existingPanel) {
    existingPanel.remove()
  }

  const branding = getBranding(project?.branding)
  const fontName = branding.fontFamily
  const fontUrl = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`
  const googleFontsPage = `https://fonts.google.com/specimen/${fontName.replace(/\s+/g, '+')}`
  
  // Check if font is loaded
  const isFontLoaded = document.fonts && document.fonts.check(`16px "${fontName}"`)
  
  // Check actual computed styles of main elements
  const titleElement = document.querySelector('h1')
  const mainContainer = document.querySelector('div[style*="fontFamily"]')
  let computedFontInfo = 'None found'
  
  if (titleElement) {
    const computedStyle = window.getComputedStyle(titleElement)
    computedFontInfo = computedStyle.fontFamily
  } else if (mainContainer) {
    const computedStyle = window.getComputedStyle(mainContainer)
    computedFontInfo = computedStyle.fontFamily
  }
  
  // Count elements with inline font styles
  const elementsWithFontStyles = document.querySelectorAll('[style*="fontFamily"]')
  
  // Create debug panel
  const debugPanel = document.createElement('div')
  debugPanel.id = 'font-debug-panel'
  debugPanel.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 350px;
    background: #1f2937;
    color: white;
    padding: 15px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    border: 2px solid #374151;
  `
  
  debugPanel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <strong style="color: #60a5fa;">🔍 Font Debug Panel</strong>
      <button onclick="document.getElementById('font-debug-panel').remove()" style="background: #dc2626; color: white; border: none; border-radius: 4px; padding: 2px 6px; cursor: pointer;">✕</button>
    </div>
    
    <div style="margin-bottom: 8px;">
      <strong>Font Family:</strong><br>
      <span style="color: #34d399;">${fontName}</span>
    </div>
    
    <div style="margin-bottom: 8px;">
      <strong>Font Status:</strong><br>
      <span style="color: ${isFontLoaded ? '#34d399' : '#fbbf24'};">${isFontLoaded ? '✅ Loaded' : '❌ Not Loaded'}</span>
    </div>
    
    <div style="margin-bottom: 8px;">
      <strong>CSS URL:</strong><br>
      <a href="${fontUrl}" target="_blank" style="color: #60a5fa; word-break: break-all; font-size: 10px;">${fontUrl}</a>
    </div>
    
    <div style="margin-bottom: 8px;">
      <strong>Google Fonts Page:</strong><br>
      <a href="${googleFontsPage}" target="_blank" style="color: #60a5fa; word-break: break-all; font-size: 10px;">${googleFontsPage}</a>
    </div>
    
    <div style="margin-bottom: 8px;">
      <strong>Elements with Font Styles:</strong><br>
      <span style="color: #34d399;">${elementsWithFontStyles.length} found</span>
    </div>
    
    <div style="margin-bottom: 8px;">
      <strong>Computed Font:</strong><br>
      <span style="color: #fbbf24; font-size: 10px;">${computedFontInfo}</span>
    </div>
    
    <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #374151;">
      <button onclick="testFontLoadingNow()" style="background: #059669; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; margin-right: 5px; font-size: 10px;">Test Font</button>
      <button onclick="forceFontApplication()" style="background: #dc2626; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; margin-right: 5px; font-size: 10px;">Force Font</button>
    </div>
    <div style="margin-top: 5px;">
      <button onclick="testWithSystemFont()" style="background: #7c3aed; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; margin-right: 5px; font-size: 10px;">Test Times</button>
      <button onclick="testWithDifferentFont()" style="background: #ea580c; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; margin-right: 5px; font-size: 10px;">Test Comic</button>
      <button onclick="testWithGuaranteedFont()" style="background: #dc2626; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; margin-right: 5px; font-size: 10px;">Test Mono</button>
    </div>
    <div style="margin-top: 5px;">
      <button onclick="testFontLoadingAggressive()" style="background: #059669; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; margin-right: 5px; font-size: 10px;">Aggressive Test</button>
      <button onclick="checkLoadedFonts()" style="background: #7c3aed; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; margin-right: 5px; font-size: 10px;">Check Fonts</button>
    </div>
    <div style="margin-top: 5px;">
      <button onclick="testTitleFont()" style="background: #dc2626; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; margin-right: 5px; font-size: 10px;">Test Title</button>
    </div>
    <div style="margin-top: 5px;">
      <button onclick="debugElements()" style="background: #059669; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; margin-right: 5px; font-size: 10px;">Debug Elements</button>
      <button onclick="testAnyStyle()" style="background: #dc2626; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; margin-right: 5px; font-size: 10px;">Test Colors</button>
    </div>
    <div style="margin-top: 5px;">
      <button onclick="testAllElements()" style="background: #7c3aed; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; margin-right: 5px; font-size: 10px;">Nuclear Test</button>
    </div>
    <div style="margin-top: 5px;">
      <button onclick="location.reload()" style="background: #6b7280; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 10px;">Reload</button>
    </div>
  `
  
  // Make test function available globally for the debug panel buttons
  window.testFontLoadingNow = testFontLoadingNow
  
  // Make force font function available globally
  window.forceFontApplication = () => {
    console.log('🔧 Force applying font to all branded elements...')
    const brandedElements = document.querySelectorAll('.branded-container, .branded-heading, .branded-background')
    brandedElements.forEach(element => {
      element.style.fontFamily = `"${fontName}", sans-serif !important`
      console.log(`🔧 Applied font to:`, element.className)
    })
    console.log(`🔧 Applied font to ${brandedElements.length} elements`)
  }
  
  // Test with a completely different font
  window.testWithDifferentFont = () => {
    console.log('🧪 Testing with Comic Sans...')
    const brandedElements = document.querySelectorAll('.branded-container, .branded-heading, .branded-background')
    console.log('🧪 Found branded elements:', brandedElements.length)
    
    // Check if Comic Sans is available
    if (document.fonts && document.fonts.check('16px "Comic Sans MS"')) {
      console.log('✅ Comic Sans MS is available')
    } else {
      console.log('❌ Comic Sans MS is NOT available')
    }
    
    // Try multiple Comic Sans variations
    const comicVariations = [
      '"Comic Sans MS", cursive',
      '"Comic Sans", cursive', 
      'Comic Sans MS, cursive',
      'Comic Sans, cursive'
    ]
    
    brandedElements.forEach((element, index) => {
      console.log(`🧪 Element ${index}:`, element)
      
      // Try each variation
      comicVariations.forEach((variation, varIndex) => {
        element.style.fontFamily = variation
        console.log(`🧪 Applied Comic Sans variation ${varIndex} to:`, element.className)
        
        // Check computed style
        const computed = window.getComputedStyle(element).fontFamily
        console.log(`🧪 Computed font after variation ${varIndex}:`, computed)
      })
    })
  }
  
  // Debug function to see what elements exist
  window.debugElements = () => {
    console.log('🔍 ===== ELEMENT DEBUG =====')
    console.log('🔍 All elements with "branded" in class name:')
    const allElements = document.querySelectorAll('*')
    allElements.forEach((element, index) => {
      if (element.className && element.className.includes('branded')) {
        console.log(`🔍 Element ${index}:`, element.tagName, element.className, element)
      }
    })
    
    console.log('🔍 All h1 elements:')
    const h1s = document.querySelectorAll('h1')
    h1s.forEach((h1, index) => {
      console.log(`🔍 H1 ${index}:`, h1.className, h1.textContent)
    })
    
    console.log('🔍 All div elements:')
    const divs = document.querySelectorAll('div')
    divs.forEach((div, index) => {
      if (div.className && div.className.includes('branded')) {
        console.log(`🔍 Div ${index}:`, div.className, div.textContent?.substring(0, 50))
      }
    })
    console.log('🔍 ===== END ELEMENT DEBUG =====')
  }
  
  // Test with a very obvious system font
  window.testWithSystemFont = () => {
    console.log('🧪 Testing with Times New Roman...')
    const brandedElements = document.querySelectorAll('.branded-container, .branded-heading, .branded-background')
    console.log('🧪 Found branded elements:', brandedElements.length)
    
    // Check if Times New Roman is available
    if (document.fonts && document.fonts.check('16px "Times New Roman"')) {
      console.log('✅ Times New Roman is available')
    } else {
      console.log('❌ Times New Roman is NOT available')
    }
    
    brandedElements.forEach((element, index) => {
      console.log(`🧪 Element ${index}:`, element)
      console.log(`🧪 Element ${index} classes:`, element.className)
      console.log(`🧪 Element ${index} tag:`, element.tagName)
      
      // Try multiple Times variations
      const timesVariations = [
        '"Times New Roman", serif',
        'Times New Roman, serif',
        'serif'
      ]
      
      timesVariations.forEach((variation, varIndex) => {
        element.style.fontFamily = variation
        console.log(`🧪 Applied Times variation ${varIndex} to:`, element.className)
        
        // Check computed style
        const computed = window.getComputedStyle(element).fontFamily
        console.log(`🧪 Computed font after Times variation ${varIndex}:`, computed)
      })
    })
    
    // Try targeting just the title
    const title = document.querySelector('h1')
    if (title) {
      console.log('🧪 Found title element:', title)
      title.style.fontFamily = `"Times New Roman", serif`
      console.log('🧪 Applied Times to title')
      
      const computed = window.getComputedStyle(title).fontFamily
      console.log('🧪 Title computed font:', computed)
    }
  }
  
  // Test with a guaranteed system font
  window.testWithGuaranteedFont = () => {
    console.log('🧪 Testing with monospace (guaranteed)...')
    const brandedElements = document.querySelectorAll('.branded-container, .branded-heading, .branded-background')
    
    brandedElements.forEach((element, index) => {
      // Try multiple approaches
      element.style.fontFamily = 'monospace !important'
      element.style.setProperty('font-family', 'monospace', 'important')
      element.setAttribute('style', element.getAttribute('style') + '; font-family: monospace !important;')
      
      console.log(`🧪 Applied monospace to:`, element.className)
      console.log(`🧪 Element style attribute:`, element.getAttribute('style'))
      
      const computed = window.getComputedStyle(element).fontFamily
      console.log(`🧪 Computed font after monospace:`, computed)
    })
  }
  
  // Nuclear option - test with ALL elements
  window.testAllElements = () => {
    console.log('🧪 NUCLEAR TEST - Applying monospace to ALL elements...')
    const allElements = document.querySelectorAll('*')
    console.log(`🧪 Found ${allElements.length} total elements`)
    
    allElements.forEach((element, index) => {
      if (index < 10) { // Only test first 10 elements
        element.style.fontFamily = 'monospace !important'
        console.log(`🧪 Applied monospace to element ${index}:`, element.tagName, element.className)
      }
    })
  }
  
  // Test if we can change ANY style at all
  window.testAnyStyle = () => {
    console.log('🧪 Testing if we can change ANY style...')
    const brandedElements = document.querySelectorAll('.branded-container, .branded-heading, .branded-background')
    
    brandedElements.forEach((element, index) => {
      // Try changing background color (very obvious)
      element.style.backgroundColor = 'red !important'
      element.style.color = 'yellow !important'
      element.style.border = '5px solid blue !important'
      
      console.log(`🧪 Applied red background to:`, element.className)
      console.log(`🧪 Element style:`, element.getAttribute('style'))
    })
  }
  
  // Test font loading more aggressively
  window.testFontLoadingAggressive = async () => {
    console.log('🧪 AGGRESSIVE FONT TEST...')
    
    // Test 1: Check if Oswald is available
    const oswaldAvailable = document.fonts && document.fonts.check('16px "Oswald"')
    console.log('🧪 Oswald available:', oswaldAvailable)
    
    // Test 2: Try to load Oswald manually
    try {
      await loadSingleFont('Oswald')
      console.log('✅ Oswald loaded via loadSingleFont')
    } catch (error) {
      console.error('❌ Failed to load Oswald:', error)
    }
    
    // Test 3: Check again after loading
    const oswaldAvailableAfter = document.fonts && document.fonts.check('16px "Oswald"')
    console.log('🧪 Oswald available after loading:', oswaldAvailableAfter)
    
    // Test 4: Try to apply font to ALL elements on the page
    const allElements = document.querySelectorAll('*')
    console.log(`🧪 Found ${allElements.length} total elements`)
    
    allElements.forEach((element, index) => {
      if (index < 5) { // Only test first 5 elements
        const originalFont = window.getComputedStyle(element).fontFamily
        element.style.fontFamily = 'Oswald, sans-serif !important'
        const newFont = window.getComputedStyle(element).fontFamily
        console.log(`🧪 Element ${index} (${element.tagName}): ${originalFont} → ${newFont}`)
      }
    })
    
    // Test 5: Try with a system font that should definitely work
    const testElement = document.querySelector('h1')
    if (testElement) {
      console.log('🧪 Testing with h1 element...')
      testElement.style.fontFamily = 'Times New Roman, serif !important'
      const computed = window.getComputedStyle(testElement).fontFamily
      console.log('🧪 H1 computed font after Times New Roman:', computed)
    }
  }
  
  // Check what fonts are actually loaded
  window.checkLoadedFonts = () => {
    console.log('🔍 ===== LOADED FONTS CHECK =====')
    
    if (document.fonts) {
      console.log('🔍 document.fonts available:', !!document.fonts)
      console.log('🔍 document.fonts.size:', document.fonts.size)
      
      // Check specific fonts
      const fontsToCheck = ['Oswald', 'Inter', 'Arial', 'Times New Roman', 'Comic Sans MS', 'Pacifico']
      fontsToCheck.forEach(font => {
        const isLoaded = document.fonts.check(`16px "${font}"`)
        console.log(`🔍 ${font}: ${isLoaded ? '✅ Loaded' : '❌ Not loaded'}`)
      })
    } else {
      console.log('❌ document.fonts not available')
    }
    
    console.log('🔍 ===== END LOADED FONTS CHECK =====')
  }
  
  // Simple test to change title font
  window.testTitleFont = () => {
    console.log('🧪 Testing title font change...')
    const title = document.querySelector('h1')
    if (title) {
      console.log('🧪 Found title:', title)
      console.log('🧪 Current title style:', title.getAttribute('style'))
      console.log('🧪 Current computed font:', window.getComputedStyle(title).fontFamily)
      
      // Try to change to a very obvious font
      title.style.fontFamily = 'Times New Roman, serif !important'
      console.log('🧪 Applied Times New Roman to title')
      console.log('🧪 New title style:', title.getAttribute('style'))
      console.log('🧪 New computed font:', window.getComputedStyle(title).fontFamily)
    } else {
      console.log('❌ No title element found')
    }
  }
  
  document.body.appendChild(debugPanel)
  console.log('🔍 Debug panel created and added to page')
}
