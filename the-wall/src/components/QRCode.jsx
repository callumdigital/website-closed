import React, { useEffect, useRef, useState } from 'react'
import QRCodeLib from 'qrcode'

const QRCode = ({ url, size = 120, className = '' }) => {
  const canvasRef = useRef(null)
  const [error, setError] = useState(null)

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

  if (error) {
    return (
      <div className={`bg-white border-[3px] border-black rounded-[14px] p-2 ${className}`}>
        <div className="text-xs text-red-600 text-center">QR Error</div>
      </div>
    )
  }

  return (
    <div className={`bg-white border-[3px] border-black rounded-[14px] p-2 shadow-lg ${className}`}>
      <canvas 
        ref={canvasRef} 
        className="w-full h-auto max-w-full"
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          minWidth: '80px',
          minHeight: '80px'
        }}
      />
    </div>
  )
}

export default QRCode
