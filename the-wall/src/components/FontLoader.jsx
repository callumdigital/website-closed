import React, { useEffect } from 'react'
import { loadSingleFont } from '../services/brandingService.jsx'

// FontLoader component to load Google Fonts
const FontLoader = ({ fontFamily, onLoad, onError }) => {
  useEffect(() => {
    if (!fontFamily) return

    loadSingleFont(fontFamily)
      .then(() => {
        if (onLoad) onLoad()
      })
      .catch((error) => {
        if (onError) onError(error)
      })
  }, [fontFamily, onLoad, onError])

  // This component doesn't render anything visible
  return null
}

export default FontLoader
