'use client'

import React, { useState, useEffect } from 'react'

const images = [
  "https://www.barre-lambot.com/wp-content/uploads/2022/11/01ENC.jpg",
  "https://www.enc-bessieres.org/wp-content/uploads/2021/01/IMG_5390-scaled-e1610381385584.jpg.webp",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000"
]

const HeroSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Change d'image automatiquement toutes les 5 secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="md:w-1/2 w-full">
      {/* Conteneur de l'image avec aspect ratio fixe pour éviter les sauts de mise en page */}
      <div className="relative overflow-hidden rounded-3xl shadow-lg h-[350px] bg-gray-200">
        {images.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Slide ${index}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
      </div>
      
      {/* Indicateurs (les petits carrés sous l'image) */}
      <div className="flex justify-center mt-6 gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-3 rounded-sm transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-enc w-8' // Le carré devient un rectangle bordeaux quand il est actif
                : 'w-3 border border-enc hover:bg-enc/20'
            }`}
            aria-label={`Afficher l'image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export default HeroSlider