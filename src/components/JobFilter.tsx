'use client'
import React from 'react'

interface JobFilterProps {
  currentTab: string
  isMineOnly: boolean
}

export default function JobFilter({ currentTab, isMineOnly }: JobFilterProps) {
  return (
    <div className="flex items-center gap-2 text-xs font-bold text-gray-600 pt-2 text-left">
      <input
        type="checkbox"
        id="mineOnlyJobs"
        checked={isMineOnly}
        onChange={(e) => {
          window.location.href = `/jobs?tab=${currentTab}&mineOnly=${e.target.checked}`
        }}
        className="rounded text-emerald-500 focus:ring-emerald-400 w-4 h-4 cursor-pointer"
      />
      <label htmlFor="mineOnlyJobs" className="cursor-pointer select-none">
        Voir mes offres uniquement
      </label>
    </div>
  )
}
