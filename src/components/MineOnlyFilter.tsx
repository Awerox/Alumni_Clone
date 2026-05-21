'use client'

import React from 'react'

interface MineOnlyFilterProps {
  currentTab: string
  isMineOnly: boolean
}

export default function MineOnlyFilter({ currentTab, isMineOnly }: MineOnlyFilterProps) {
  return (
    <div className="flex items-center gap-2 text-xs font-bold text-gray-600 pt-2">
      <input
        type="checkbox"
        id="mineOnly"
        checked={isMineOnly}
        onChange={(e) => {
          // Exécuté côté client sans faire planter le serveur
          window.location.href = `/blog?tab=${currentTab}&mineOnly=${e.target.checked}`
        }}
        className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
      />
      <label htmlFor="mineOnly" className="cursor-pointer">
        Voir mes articles uniquement
      </label>
    </div>
  )
}
