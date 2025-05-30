import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/FloatingGif.css'; // Create this CSS file next

const FloatingGif = ({ id, src, initialPosition, initialSize, zIndex }) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeOffset, setResizeOffset] = useState({ x: 0, y: 0 });
  const gifRef = useRef(null); // Ref to the GIF element itself

  // Memoize handleMouseMove and handleMouseUp for performance and useEffect dependencies
  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      // Keep within bounds of the desktop (accounting for menu bar and dock)
      const desktopWidth = window.innerWidth;
      const desktopHeight = window.innerHeight;
      const menuBarHeight = 24; // Assuming your menu bar height
      const dockHeight = 80; // Approximate dock height

      newX = Math.max(0, Math.min(newX, desktopWidth - size.width));
      newY = Math.max(menuBarHeight, Math.min(newY, desktopHeight - size.height - dockHeight));

      setPosition({ x: newX, y: newY });
    } else if (isResizing) {
      const newWidth = e.clientX - resizeOffset.x;
      const newHeight = e.clientY - resizeOffset.y;

      // Ensure minimum size
      setSize({
        width: Math.max(100, newWidth),
        height: Math.max(100, newHeight)
      });
    }
  }, [isDragging, isResizing, dragOffset, resizeOffset, size]); // size is a dependency for bounds check

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleMouseDown = (e) => {
    // Check if the click is on the resize handle (bottom-right 20px)
    const elementRect = gifRef.current.getBoundingClientRect();
    const isClickOnResizeHandle =
      e.clientX > elementRect.right - 20 && e.clientY > elementRect.bottom - 20;

    if (isClickOnResizeHandle) {
      setIsResizing(true);
      setResizeOffset({
        x: elementRect.right - e.clientX,
        y: elementRect.bottom - e.clientY
      });
    } else {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  return (
    <div
      ref={gifRef} // Attach ref here
      className="floating-gif"
      style={{
        top: position.y,
        left: position.x,
        width: size.width,
        height: size.height,
        zIndex: zIndex, // Ensure it's above desktop icons but below dock
      }}
      onMouseDown={handleMouseDown}
    >
      <img src={process.env.PUBLIC_URL + src} alt="Floating Element" />
      {/* Resizer Handle - visually indicate resize area */}
      <div className="resizer-handle"></div>
    </div>
  );
};

export default FloatingGif;