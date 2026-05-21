'use client'
import React from 'react'

interface EvenementFilterProps {
  currentTab: string
  isMineOnly: boolean
}

export default function EvenementFilter({ currentTab, isMineOnly }: EvenementFilterProps) {
  return (
    <div className="flex items-center gap-2 text-xs font-bold text-gray-600 pt-2 text-left">
      <input
        type="checkbox"
        id="mineOnlyEvents"
        checked={isMineOnly}
        onChange={(e) => {
          window.location.href = `/evenements?tab=${currentTab}&mineOnly=${e.target.checked}`
        }}
        className="rounded text-emerald-500 focus:ring-emerald-400 w-4 h-4 cursor-pointer"
      />
      <label htmlFor="mineOnlyEvents" className="cursor-pointer">
        Voir mes événements uniquement
      </label>
    </div>
  )
}
