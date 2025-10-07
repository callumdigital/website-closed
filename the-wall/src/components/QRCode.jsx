import React, { useEffect, useRef, useState } from 'react'
import QRCodeLib from 'qrcode'

const QRCode = ({ url, size = 120, className = '', draggable = false, initialPosition = null }) => {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [error, setError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState(initialPosition || { x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isInitialized, setIsInitialized] = useState(false)

  // Set initial position to bottom right if not provided
  useEffect(() => {
    if (draggable && !isInitialized && !initialPosition) {
      const qrSizeWithPadding = size + 32 // size + padding + border
      const labelHeight = 40 // Approximate label height
      const totalHeight = qrSizeWithPadding + labelHeight + 8 // 8px margin between QR and label
      const totalWidth = qrSizeWithPadding + 16 // 16px margin
      
      // Ensure QR code doesn't go off screen
      const maxX = window.innerWidth - totalWidth
      const maxY = window.innerHeight - totalHeight
      
      const x = Math.max(16, Math.min(maxX, window.innerWidth - qrSizeWithPadding - 16)) // 16px margin
      const y = Math.max(16, Math.min(maxY, window.innerHeight - totalHeight - 16)) // 16px margin
      
      setPosition({ x, y })
      setIsInitialized(true)
    }
  }, [draggable, isInitialized, initialPosition, size])

  useEffect(() => {
    if (!url || !canvasRef.current) return

    const generateQR = async () => {
      try {
        setError(null)
        await QRCodeLib.toCanvas(canvasRef.current, url, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
      } catch (err) {
        console.error('Error generating QR code:', err)
        setError('Failed to generate QR code')
      }
    }

    generateQR()
  }, [url, size])

  // Drag functionality
  const handleMouseDown = (e) => {
    if (!draggable) return
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleMouseMove = (e) => {
    if (!isDragging || !draggable) return
    e.preventDefault()
    
    const qrSizeWithPadding = size + 32 // size + padding + border
    const labelHeight = 40 // Approximate label height
    const totalHeight = qrSizeWithPadding + labelHeight + 8 // 8px margin between QR and label
    const totalWidth = qrSizeWithPadding + 16 // 16px margin
    
    // Calculate new position
    let newX = e.clientX - dragStart.x
    let newY = e.clientY - dragStart.y
    
    // Constrain to screen boundaries
    newX = Math.max(0, Math.min(newX, window.innerWidth - totalWidth))
    newY = Math.max(0, Math.min(newY, window.innerHeight - totalHeight))
    
    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    if (!draggable) return
    setIsDragging(false)
  }

  useEffect(() => {
    if (draggable) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart, draggable])

  if (error) {
    return (
      <div className={`bg-white border-[3px] border-black rounded-[14px] p-2 ${className}`}>
        <div className="text-xs text-red-600 text-center">QR Error</div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={`text-center ${draggable ? 'cursor-move select-none' : ''}`}
      style={draggable ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.2s ease',
        maxWidth: `${size + 40}px` // Prevent label from extending too far
      } : {}}
      onMouseDown={handleMouseDown}
    >
      <div className={`bg-white border-[3px] border-black rounded-[14px] p-2 shadow-lg ${className.includes('w-full') ? 'w-full' : 'inline-block'}`}>
        <div className={`${className.includes('w-full') ? 'w-full' : ''} flex items-center justify-center`} style={{ aspectRatio: '1/1' }}>
          <canvas 
            ref={canvasRef} 
            style={{ 
              width: className.includes('w-full') ? '95%' : '95%', 
              height: className.includes('w-full') ? '95%' : '95%',
              display: 'block',
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          />
        </div>
      </div>
      {draggable && (
        <div className="text-xs sm:text-sm text-gray-600 font-bold bg-white px-2 py-1 sm:px-3 sm:py-2 rounded border border-gray-300 shadow-sm mt-2 whitespace-nowrap">
          Scan to add note • Drag to move
        </div>
      )}
    </div>
  )
}

export default QRCode
