'use client'

import { useState, useEffect } from 'react'

export default function InstallBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
    const dismissed = localStorage.getItem('installBannerDismissed')
    
    if (isIOS && !isInStandaloneMode && !dismissed) {
      setShow(true)
    }
  }, [])

  function handleDismiss() {
    localStorage.setItem('installBannerDismissed', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed top-10 left-0 right-0 z-40 md:hidden px-4 pt-2">
      <div className="bg-blue-600 text-white rounded-xl p-4 shadow-lg">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="font-semibold text-sm">📲 安装到主屏幕 / Add to Home Screen</p>
            <p className="text-blue-100 text-xs mt-1">
              点底部 <span className="bg-blue-500 px-1 rounded">分享</span> 按钮，选「添加到主屏幕」体验更流畅 / Tap Share then Add to Home Screen for a faster app experience
            </p>
          </div>
          <button onClick={handleDismiss} className="text-blue-200 ml-3 text-lg">✕</button>
        </div>
      </div>
    </div>
  )
}