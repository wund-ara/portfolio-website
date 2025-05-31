// src/components/ImageFileIcon.jsx

import React, { useState, useEffect, useRef } from 'react';
import '../styles/ImageFileIcon.css';

const ImageFileIcon = ({ id, name, thumbnailPath, fullImagePath, position, onClick, onDragEnd, isWindowOpen }) => {
  const [currentPosition, setCurrentPosition] = useState(position || { x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const iconRef = useRef(null);

  // DEBUG LOG 1: Check the value of isWindowOpen prop for this icon
  console.log(`[ImageFileIcon ${id}] isWindowOpen prop: ${isWindowOpen}`);


  useEffect(() => {
    if (position) {
      setCurrentPosition(position);
    }
  }, [position]);

  const handleMouseDown = (e) => {
    // DEBUG LOG 2: Check if this handler is even called, and what isWindowOpen is at that moment
    console.log(`[ImageFileIcon ${id}] handleMouseDown triggered. isWindowOpen: ${isWindowOpen}`);

    if (isWindowOpen) {
      // If the window is open, we should NOT drag the icon.
      // This return should prevent any further drag logic for the icon.
      console.log(`[ImageFileIcon ${id}] Drag blocked because window is open.`);
      return;
    }

    e.preventDefault(); // Prevent default browser drag behavior (e.g., image ghosting)
    e.stopPropagation(); // Stop event from bubbling up to parent (desktop)

    setIsDragging(true);
    if (iconRef.current) {
      setDragOffset({
        x: e.clientX - iconRef.current.offsetLeft,
        y: e.clientY - iconRef.current.offsetTop,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      const desktopWidth = window.innerWidth;
      const desktopHeight = window.innerHeight;
      const iconWidth = iconRef.current ? iconRef.current.offsetWidth : 80;
      const iconHeight = iconRef.current ? iconRef.current.offsetHeight : 100;

      newX = Math.max(0, Math.min(newX, desktopWidth - iconWidth));
      newY = Math.max(24, Math.min(newY, desktopHeight - iconHeight - 80));

      setCurrentPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (onDragEnd) {
          onDragEnd(id, currentPosition);
        }
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, id, currentPosition, onDragEnd]);

  const style = {
    left: `${currentPosition?.x || 0}px`,
    top: `${currentPosition?.y || 0}px`,
    zIndex: isDragging ? 50 : 1, // Icon z-index (50 for dragging, 1 otherwise)
    cursor: isWindowOpen ? 'default' : (isDragging ? 'grabbing' : 'pointer'),
  };

  return (
    <div
      id={id}
      ref={iconRef}
      className="image-file-icon"
      style={style}
      // ONLY attach onMouseDown if the window is NOT open
      onMouseDown={isWindowOpen ? undefined : handleMouseDown}
      onClick={(e) => {
        if (!isDragging) { // Only open window if not dragging
          onClick({ id, name, thumbnailPath, fullImagePath });
        }
        e.stopPropagation(); // Stop click from bubbling up
      }}
    >
      <div className="image-file-icon-preview">
        <img src={process.env.PUBLIC_URL + thumbnailPath} alt={name} />
      </div>
      <span className="image-file-icon-name">{name}</span>
    </div>
  );
};

export default ImageFileIcon;