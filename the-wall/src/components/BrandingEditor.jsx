import React, { useState, useEffect, useRef } from 'react'
import { DEFAULT_BRANDING, loadFontForBranding, debugCustomFont } from '../services/brandingService.jsx'
import { Button, Input } from './ui'
import BannerBuilder from './BannerBuilder'

const BrandingEditor = ({ project, onSave, onCancel, isInline = false }) => {
  const [branding, setBranding] = useState(DEFAULT_BRANDING)
  const [titleQuestion, setTitleQuestion] = useState('')
  const [fontsLoaded, setFontsLoaded] = useState(true)
  const [activeTab, setActiveTab] = useState('overall')
  const textBlurbRef = useRef(null)

  useEffect(() => {
    if (project?.branding) {
      // Ensure sidebar and banner properties exist with defaults
      const mergedBranding = { 
        ...DEFAULT_BRANDING, 
        ...project.branding,
        sidebar: {
          ...DEFAULT_BRANDING.sidebar,
          ...project.branding.sidebar
        },
        banner: {
          ...DEFAULT_BRANDING.banner,
          ...project.branding.banner
        }
      }
      setBranding(mergedBranding)
    } else {
      setBranding(DEFAULT_BRANDING)
    }
    if (project?.titleQuestion) {
      setTitleQuestion(project.titleQuestion)
    } else {
      setTitleQuestion('') // Ensure it's set to empty string if not provided
    }
    console.log('🎨 BrandingEditor: Project data loaded:', { 
      project, 
      branding: project?.branding, 
      titleQuestion: project?.titleQuestion 
    })
  }, [project])


  const handleSave = () => {
    console.log('🎨 BrandingEditor: Saving with:', { branding, titleQuestion })
    console.log('🎨 BrandingEditor: Banner data:', branding.banner)
    onSave(branding, titleQuestion)
  }

  const formatText = (command, value = null) => {
    if (textBlurbRef.current) {
      const selection = window.getSelection()
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null
      
      textBlurbRef.current.focus()
      document.execCommand(command, false, value)
      
      // Restore cursor position and force LTR
      if (range) {
        selection.removeAllRanges()
        selection.addRange(range)
      }
      textBlurbRef.current.style.direction = 'ltr'
      textBlurbRef.current.setAttribute('dir', 'ltr')
    }
  }




  const updateBranding = async (key, value) => {
    console.log('🎨 BrandingEditor: Updating', key, 'to', value)
    let newBranding
    if (key === 'sidebar') {
      // Handle sidebar updates
      newBranding = { ...branding, sidebar: value }
    } else if (key === 'banner') {
      // Handle banner updates
      console.log('🎨 BrandingEditor: Updating banner with:', value)
      newBranding = { ...branding, banner: value }
      console.log('🎨 BrandingEditor: New branding object:', newBranding)
    } else {
      // Handle other updates
      newBranding = { ...branding, [key]: value }
    }
    setBranding(newBranding)
    
    // If font family changed, load the new font
    if (key === 'fontFamily' || key === 'customFontFamily') {
      console.log('🔤 Font changed in BrandingEditor')
      console.log('🔤 fontFamily:', newBranding.fontFamily)
      console.log('🔤 customFontFamily:', newBranding.customFontFamily)
      
      // Debug custom fonts specifically
      if (newBranding.fontFamily === 'CUSTOM' || newBranding.customFontFamily) {
        debugCustomFont(newBranding)
      }
      
      setFontsLoaded(false)
      try {
        await loadFontForBranding(newBranding)
        setFontsLoaded(true)
        console.log('✅ Font loaded successfully in BrandingEditor')
      } catch (error) {
        console.warn('Failed to load font:', error)
        setFontsLoaded(true) // Continue anyway
      }
    }
  }

  const colorPresets = [
    { name: 'Blue', primary: '#3B82F6', secondary: '#64748B' },
    { name: 'Green', primary: '#10B981', secondary: '#6B7280' },
    { name: 'Purple', primary: '#8B5CF6', secondary: '#6B7280' },
    { name: 'Pink', primary: '#EC4899', secondary: '#6B7280' },
    { name: 'Orange', primary: '#F59E0B', secondary: '#6B7280' },
    { name: 'Red', primary: '#EF4444', secondary: '#6B7280' }
  ]

  const Wrapper = isInline ? 'div' : ({ children }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 admin-layout">
      <div className={`bg-white rounded-[24px] border-[3px] border-black w-full max-h-[90vh] overflow-y-auto ${
        activeTab === 'banner' ? 'max-w-6xl' : 'max-w-2xl'
      }`}>
        {children}
      </div>
    </div>
  );

  return (
    <Wrapper>
      <div className={isInline ? '' : 'p-6 sm:p-8'}>
        {!isInline && (
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 admin-heading">Branding Settings</h2>
            <button
              onClick={onCancel}
              className="w-10 h-10 rounded-full border-[3px] border-black hover:bg-gray-100 transition-all flex items-center justify-center text-2xl font-bold"
            >
              ×
            </button>
          </div>
        )}
        
        {isInline && (
          <h2 className="text-2xl font-bold text-gray-900 admin-heading mb-6">
            Branding & Appearance
          </h2>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-[14px] border-[3px] border-black">
            <button
              onClick={() => setActiveTab('overall')}
              className={`flex-1 py-3 px-4 rounded-[10px] font-bold text-sm transition-all ${
                activeTab === 'overall'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Overall Branding
            </button>
            <button
              onClick={() => setActiveTab('sidebar')}
              className={`flex-1 py-3 px-4 rounded-[10px] font-bold text-sm transition-all ${
                activeTab === 'sidebar'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Sidebar
            </button>
            <button
              onClick={() => setActiveTab('banner')}
              className={`flex-1 py-3 px-4 rounded-[10px] font-bold text-sm transition-all ${
                activeTab === 'banner'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Banner
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overall Branding Tab */}
          {activeTab === 'overall' && (
            <div className="space-y-6">
              {/* Color Presets */}
              <div>
              <label className="block text-base font-bold text-gray-900 mb-3 admin-heading">
                Quick Color Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setBranding(prev => ({
                        ...prev,
                        primaryColor: preset.primary,
                        secondaryColor: preset.secondary
                      }))
                    }}
                    className="p-4 border-[3px] border-black rounded-[14px] hover:bg-gray-50 transition-all hover:translate-y-[-2px]"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-black"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-black"
                        style={{ backgroundColor: preset.secondary }}
                      />
                      <span className="text-sm font-bold">{preset.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-bold text-gray-900 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) => updateBranding('primaryColor', e.target.value)}
                    className="w-14 h-12 border-[3px] border-black rounded-[14px] cursor-pointer bg-gray-50"
                  />
                  <input
                    type="text"
                    value={branding.primaryColor}
                    onChange={(e) => updateBranding('primaryColor', e.target.value)}
                    className="flex-1 px-4 py-3 border-[3px] border-black rounded-[14px] focus:outline-none bg-gray-50 font-mono text-sm"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div>
                <label className="block text-base font-bold text-gray-900 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.secondaryColor}
                    onChange={(e) => updateBranding('secondaryColor', e.target.value)}
                    className="w-14 h-12 border-[3px] border-black rounded-[14px] cursor-pointer bg-gray-50"
                  />
                  <input
                    type="text"
                    value={branding.secondaryColor}
                    onChange={(e) => updateBranding('secondaryColor', e.target.value)}
                    className="flex-1 px-4 py-3 border-[3px] border-black rounded-[14px] focus:outline-none bg-gray-50 font-mono text-sm"
                    placeholder="#64748B"
                  />
                </div>
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-base font-bold text-gray-900 mb-2">
                Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={branding.backgroundColor}
                  onChange={(e) => updateBranding('backgroundColor', e.target.value)}
                  className="w-14 h-12 border-[3px] border-black rounded-[14px] cursor-pointer bg-gray-50"
                />
                <input
                  type="text"
                  value={branding.backgroundColor}
                  onChange={(e) => updateBranding('backgroundColor', e.target.value)}
                  className="flex-1 px-4 py-3 border-[3px] border-black rounded-[14px] focus:outline-none bg-gray-50 font-mono text-sm"
                  placeholder="#F8FAFC"
                />
              </div>
            </div>

            {/* Question/Title Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-bold text-gray-900 mb-2">
                  Question Background Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.questionBackgroundColor || '#F4C542'}
                    onChange={(e) => updateBranding('questionBackgroundColor', e.target.value)}
                    className="w-14 h-12 border-[3px] border-black rounded-[14px] cursor-pointer bg-gray-50"
                  />
                  <input
                    type="text"
                    value={branding.questionBackgroundColor || '#F4C542'}
                    onChange={(e) => updateBranding('questionBackgroundColor', e.target.value)}
                    className="flex-1 px-4 py-3 border-[3px] border-black rounded-[14px] focus:outline-none bg-gray-50 font-mono text-sm"
                    placeholder="#F4C542"
                  />
                </div>
              </div>

              <div>
                <label className="block text-base font-bold text-gray-900 mb-2">
                  Question Text Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.questionTextColor || '#000000'}
                    onChange={(e) => updateBranding('questionTextColor', e.target.value)}
                    className="w-14 h-12 border-[3px] border-black rounded-[14px] cursor-pointer bg-gray-50"
                  />
                  <input
                    type="text"
                    value={branding.questionTextColor || '#000000'}
                    onChange={(e) => updateBranding('questionTextColor', e.target.value)}
                    className="flex-1 px-4 py-3 border-[3px] border-black rounded-[14px] focus:outline-none bg-gray-50 font-mono text-sm"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>

            {/* Font Family */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-bold text-gray-900 mb-2">
                  Font Family
                </label>
                <select
                  value={branding.fontFamily}
                  onChange={(e) => updateBranding('fontFamily', e.target.value)}
                  className="w-full px-4 py-3 border-[3px] border-black rounded-[14px] focus:outline-none bg-gray-50 font-bold"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lato">Lato</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Source Sans Pro">Source Sans Pro</option>
                  <option value="Fredoka">Fredoka</option>
                  <option value="Roboto Condensed">Roboto Condensed</option>
                  <option value="Helvetica">Helvetica (System Font)</option>
                  <option value="Arial">Arial (System Font)</option>
                  <option value="Georgia">Georgia (System Font)</option>
                  <option value="Times New Roman">Times New Roman (System Font)</option>
                  <option value="CUSTOM">Custom Font...</option>
                </select>
              </div>
              
              {branding.fontFamily === 'CUSTOM' && (
                <div>
                  <Input
                    type="text"
                    label="Custom Font Family"
                    value={branding.customFontFamily || ''}
                    onChange={(e) => updateBranding('customFontFamily', e.target.value)}
                    placeholder="e.g., 'Bitcount Prop Single Ink'"
                    helpText="Enter the exact font name. System fonts will work immediately, Google Fonts will be loaded automatically."
                  />
                </div>
              )}
            </div>

            {/* Title/Question */}
            <Input
              type="text"
              label="Title/Question"
              value={titleQuestion}
              onChange={(e) => setTitleQuestion(e.target.value)}
              placeholder="e.g., 'What's on your mind?', 'Share your thoughts'"
              helpText="This will be displayed on the form and in the top-right of the wall display. Leave empty to use the project name."
            />

            {/* Note Colors */}
            <div>
              <label className="block text-base font-bold text-gray-900 mb-3">
                Available Note Colors
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['yellow', 'blue', 'pink', 'green', 'purple', 'orange', 'red', 'indigo'].map((color) => {
                  const colorMap = {
                    yellow: '#FFEAA7',
                    blue: '#74B9FF',
                    pink: '#FD79A8',
                    green: '#55EFC4',
                    purple: '#A29BFE',
                    orange: '#FDCB6E',
                    red: '#FF7675',
                    indigo: '#6C5CE7'
                  }
                  return (
                    <label 
                      key={color} 
                      className={`flex items-center gap-2 p-3 rounded-[14px] border-[3px] cursor-pointer transition-all ${
                        branding.noteColors.includes(color) 
                          ? 'border-black' 
                          : 'border-gray-300 hover:border-black'
                      }`}
                      style={{ backgroundColor: branding.noteColors.includes(color) ? colorMap[color] : 'white' }}
                    >
                      <input
                        type="checkbox"
                        checked={branding.noteColors.includes(color)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateBranding('noteColors', [...branding.noteColors, color])
                          } else {
                            updateBranding('noteColors', branding.noteColors.filter(c => c !== color))
                          }
                        }}
                        className="h-5 w-5 rounded border-gray-300"
                      />
                      <span className="text-sm font-bold capitalize">{color}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Logo URL */}
            <Input
              type="url"
              label="Logo URL (optional)"
              value={branding.logoUrl || ''}
              onChange={(e) => updateBranding('logoUrl', e.target.value)}
              placeholder="https://example.com/logo.png"
            />
            </div>
          )}

          {/* Sidebar Tab */}
          {activeTab === 'sidebar' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Right Sidebar Configuration</h3>
              
              {/* Enable Sidebar */}
              <div className="mb-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={branding.sidebar?.enabled || false}
                    onChange={(e) => updateBranding('sidebar', {
                      ...branding.sidebar,
                      enabled: e.target.checked
                    })}
                    className="h-5 w-5 rounded border-gray-300"
                  />
                  <span className="text-base font-bold text-gray-900">Enable right sidebar</span>
                </label>
                <p className="text-sm text-gray-600 mt-1">Add a sidebar to the right of the display wall</p>
              </div>

              {branding.sidebar?.enabled && (
                <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                  {/* Sidebar Colors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Background Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={branding.sidebar?.backgroundColor || '#FFFFFF'}
                          onChange={(e) => updateBranding('sidebar', {
                            ...branding.sidebar,
                            backgroundColor: e.target.value
                          })}
                          className="w-12 h-10 border-[2px] border-black rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={branding.sidebar?.backgroundColor || '#FFFFFF'}
                          onChange={(e) => updateBranding('sidebar', {
                            ...branding.sidebar,
                            backgroundColor: e.target.value
                          })}
                          className="flex-1 px-3 py-2 border-[2px] border-black rounded text-sm font-mono"
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Text Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={branding.sidebar?.textColor || '#000000'}
                          onChange={(e) => updateBranding('sidebar', {
                            ...branding.sidebar,
                            textColor: e.target.value
                          })}
                          className="w-12 h-10 border-[2px] border-black rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={branding.sidebar?.textColor || '#000000'}
                          onChange={(e) => updateBranding('sidebar', {
                            ...branding.sidebar,
                            textColor: e.target.value
                          })}
                          className="flex-1 px-3 py-2 border-[2px] border-black rounded text-sm font-mono"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Width */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Sidebar Width
                    </label>
                    <select
                      value={branding.sidebar?.width || '300px'}
                      onChange={(e) => updateBranding('sidebar', {
                        ...branding.sidebar,
                        width: e.target.value
                      })}
                      className="w-full px-3 py-2 border-[2px] border-black rounded text-sm"
                    >
                      <option value="250px">250px (Narrow)</option>
                      <option value="300px">300px (Medium)</option>
                      <option value="350px">350px (Wide)</option>
                      <option value="400px">400px (Extra Wide)</option>
                    </select>
                  </div>

                  {/* QR Code Position */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      QR Code Position
                    </label>
                    <select
                      value={branding.sidebar?.qrCodePosition || 'bottom'}
                      onChange={(e) => updateBranding('sidebar', {
                        ...branding.sidebar,
                        qrCodePosition: e.target.value
                      })}
                      className="w-full px-3 py-2 border-[2px] border-black rounded text-sm"
                    >
                      <option value="top">Top of sidebar</option>
                      <option value="bottom">Bottom of sidebar</option>
                      <option value="hidden">Hidden (use floating QR)</option>
                    </select>
                  </div>

                  {/* Text Blurb */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Text Blurb
                    </label>
                    <div className="border-[2px] border-black rounded">
                      {/* Rich Text Toolbar */}
                      <div className="flex gap-1 p-2 bg-gray-100 border-b border-gray-300">
                        <button
                          type="button"
                          onClick={() => formatText('bold')}
                          className="px-2 py-1 text-xs font-bold border border-gray-300 rounded hover:bg-gray-200"
                          title="Bold"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => formatText('italic')}
                          className="px-2 py-1 text-xs italic border border-gray-300 rounded hover:bg-gray-200"
                          title="Italic"
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => formatText('underline')}
                          className="px-2 py-1 text-xs underline border border-gray-300 rounded hover:bg-gray-200"
                          title="Underline"
                        >
                          U
                        </button>
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                        <button
                          type="button"
                          onClick={() => formatText('foreColor', '#FF0000')}
                          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-200"
                          title="Red Text"
                          style={{ color: '#FF0000' }}
                        >
                          A
                        </button>
                        <button
                          type="button"
                          onClick={() => formatText('foreColor', '#0000FF')}
                          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-200"
                          title="Blue Text"
                          style={{ color: '#0000FF' }}
                        >
                          A
                        </button>
                        <button
                          type="button"
                          onClick={() => formatText('foreColor', '#00AA00')}
                          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-200"
                          title="Green Text"
                          style={{ color: '#00AA00' }}
                        >
                          A
                        </button>
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                        <button
                          type="button"
                          onClick={() => formatText('removeFormat')}
                          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-200"
                          title="Remove Formatting"
                        >
                          Clear
                        </button>
                      </div>
                      <div
                        ref={textBlurbRef}
                        contentEditable
                        onInput={(e) => {
                          updateBranding('sidebar', {
                            ...branding.sidebar,
                            textBlurb: e.target.innerHTML
                          })
                        }}
                        onKeyDown={(e) => {
                          // Store cursor position before any key operation
                          const selection = window.getSelection()
                          const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null
                          
                          // Prevent cursor jumping
                          setTimeout(() => {
                            if (textBlurbRef.current && range) {
                              textBlurbRef.current.style.direction = 'ltr'
                              textBlurbRef.current.setAttribute('dir', 'ltr')
                              selection.removeAllRanges()
                              selection.addRange(range)
                            }
                          }, 0)
                        }}
                        onKeyUp={(e) => {
                          // Ensure LTR after key release
                          if (textBlurbRef.current) {
                            textBlurbRef.current.style.direction = 'ltr'
                            textBlurbRef.current.setAttribute('dir', 'ltr')
                          }
                        }}
                        onFocus={(e) => {
                          // Ensure LTR on focus
                          e.target.style.direction = 'ltr'
                          e.target.setAttribute('dir', 'ltr')
                        }}
                        className="w-full px-3 py-2 text-sm min-h-[80px] focus:outline-none"
                        style={{ 
                          minHeight: '80px',
                          direction: 'ltr',
                          textAlign: 'left',
                          unicodeBidi: 'normal'
                        }}
                        dangerouslySetInnerHTML={{ __html: branding.sidebar?.textBlurb || '' }}
                        placeholder="e.g., 'Tell us your thoughts and go in the draw!' or 'Share your feedback and win prizes'"
                        dir="ltr"
                        suppressContentEditableWarning={true}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Use the toolbar to format text with bold, italic, underline, and colors.</p>
                  </div>

                  {/* Text Size */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Text Size
                    </label>
                    <select
                      value={branding.sidebar?.textSize || 'large'}
                      onChange={(e) => updateBranding('sidebar', {
                        ...branding.sidebar,
                        textSize: e.target.value
                      })}
                      className="w-full px-3 py-2 border-[2px] border-black rounded text-sm"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="extra-large">Extra Large</option>
                    </select>
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Image URL (optional)
                    </label>
                    <input
                      type="url"
                      value={branding.sidebar?.imageUrl || ''}
                      onChange={(e) => updateBranding('sidebar', {
                        ...branding.sidebar,
                        imageUrl: e.target.value
                      })}
                      placeholder="https://example.com/image.png"
                      className="w-full px-3 py-2 border-[2px] border-black rounded text-sm"
                    />
                    <p className="text-xs text-gray-600 mt-1">Images will be contained within the sidebar width</p>
                  </div>

                  {/* Image Alt Text */}
                  {branding.sidebar?.imageUrl && (
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Image Alt Text
                      </label>
                      <input
                        type="text"
                        value={branding.sidebar?.imageAlt || ''}
                        onChange={(e) => updateBranding('sidebar', {
                          ...branding.sidebar,
                          imageAlt: e.target.value
                        })}
                        placeholder="Description of the image"
                        className="w-full px-3 py-2 border-[2px] border-black rounded text-sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Banner Tab */}
          {activeTab === 'banner' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Banner Configuration</h3>
              <BannerBuilder 
                project={project}
                onSave={(bannerData) => {
                  console.log('🎨 BrandingEditor: Received banner data from BannerBuilder:', bannerData)
                  // Update branding and then save
                  const newBranding = { ...branding, banner: bannerData }
                  setBranding(newBranding)
                  
                  // Save immediately with the new data
                  console.log('🎨 BrandingEditor: About to call onSave with new branding')
                  onSave(newBranding, titleQuestion)
                }}
                onCancel={() => {}}
              />
            </div>
          )}
        </div>

          {/* Preview */}
          <div className="mt-6 p-6 border-[3px] border-black rounded-[14px] bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900 admin-heading">Preview</h3>
              <span className="text-xs text-gray-600 font-bold">
                Font: {branding.customFontFamily || branding.fontFamily}
              </span>
            </div>
            <div 
              className="p-6 rounded-[14px] border-[3px] border-black"
              style={{ 
                backgroundColor: branding.backgroundColor,
                fontFamily: branding.customFontFamily || branding.fontFamily 
              }}
            >
              <h4 
                className="text-xl font-bold mb-3"
                style={{ color: branding.headingColor }}
              >
                Sample Form
              </h4>
              <p className="text-sm text-gray-600 mb-4">Share your thoughts and ideas</p>
              
              {/* Question Preview */}
              {titleQuestion && (
                <div 
                  className="mb-4 px-4 py-2 rounded-[20px] border-[3px] border-black"
                  style={{
                    backgroundColor: branding.questionBackgroundColor || '#F4C542',
                    color: branding.questionTextColor || '#000000'
                  }}
                >
                  <h5 className="font-bold text-sm">
                    {titleQuestion}
                  </h5>
                </div>
              )}
              
              <div 
                className="px-6 py-3 rounded-[14px] text-sm font-bold border-[3px] border-black"
                style={{ 
                  backgroundColor: branding.primaryColor,
                  color: branding.backgroundColor === '#000000' ? '#FFFFFF' : '#000000'
                }}
              >
                Submit Button
              </div>
            </div>
          </div>

          {/* Actions */}
          {!isInline ? (
            <div className="flex gap-3 mt-6 pt-6 border-t-[3px] border-gray-200">
              <Button
                onClick={onCancel}
                variant="outline"
                size="medium"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                variant="primary"
                size="medium"
                className="flex-1"
              >
                Save Branding
              </Button>
            </div>
          ) : (
            <div className="mt-6 pt-6 border-t-[3px] border-gray-200">
              <Button
                onClick={handleSave}
                variant="primary"
                size="medium"
                fullWidth
              >
                Save Branding Changes
              </Button>
            </div>
          )}
        </div>
      </Wrapper>
  )
}

export default BrandingEditor
