// src/components/PhotoGallery.jsx

import React, { useState, useCallback } from 'react';
import '../styles/PhotoGallery.css'; // We'll create this CSS file next

const PhotoGallery = ({ images }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Function to navigate to the previous image
  const goToPrevious = useCallback(() => {
    setCurrentImageIndex(prevIndex =>
      (prevIndex === 0 ? images.length - 1 : prevIndex - 1)
    );
  }, [images.length]); // images.length is a dependency as it determines the boundary

  // Function to navigate to the next image
  const goToNext = useCallback(() => {
    setCurrentImageIndex(prevIndex =>
      (prevIndex === images.length - 1 ? 0 : prevIndex + 1)
    );
  }, [images.length]); // images.length is a dependency

  if (!images || images.length === 0) {
    return <div className="photo-gallery-empty">No photos to display.</div>;
  }

  return (
    <div className="photo-gallery-container">
      <img
        src={process.env.PUBLIC_URL + images[currentImageIndex]}
        alt={`Gallery ${currentImageIndex + 1}`}
        className="photo-gallery-image"
      />
      {/* Navigation overlays */}
      <div className="photo-gallery-nav-left" onClick={goToPrevious}></div>
      <div className="photo-gallery-nav-right" onClick={goToNext}></div>
      {/* Image counter */}
      <div className="photo-gallery-counter">
        {currentImageIndex + 1} / {images.length}
      </div>
    </div>
  );
};

export default PhotoGallery;
