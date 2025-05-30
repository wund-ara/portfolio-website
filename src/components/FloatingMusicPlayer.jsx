import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/FloatingMusicPlayer.css';

const FloatingMusicPlayer = ({ id, src, initialPosition, initialSize, zIndex, autoPlay, controls, loop, title, artworkSrc }) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const playerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && autoPlay && !controls) {
      audioRef.current.play().catch(error => {
        console.warn("Autoplay was prevented:", error);
      });
    }
  }, [autoPlay, controls]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      const desktopWidth = window.innerWidth;
      const desktopHeight = window.innerHeight;
      const menuBarHeight = 24;
      const dockHeight = 80;

      newX = Math.max(0, Math.min(newX, desktopWidth - initialSize.width));
      newY = Math.max(menuBarHeight, Math.min(newY, desktopHeight - initialSize.height - dockHeight));

      setPosition({ x: newX, y: newY });
    }
  }, [isDragging, dragOffset, initialSize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
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
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  return (
    <div
      ref={playerRef}
      className="floating-music-player"
      style={{
        top: position.y,
        left: position.x,
        width: initialSize.width,
        height: initialSize.height,
        zIndex: zIndex,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Title at the top */}
      <div className="music-player-title">{title}</div>

      {/* Artwork in the middle */}
      {artworkSrc && (
        <img src={process.env.PUBLIC_URL + artworkSrc} alt="Artwork" className="music-player-artwork" />
      )}

      {/* Audio controls at the bottom */}
      <audio
        ref={audioRef}
        src={process.env.PUBLIC_URL + src}
        autoPlay={autoPlay}
        controls={controls}
        loop={loop}
        muted={true}
      >
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default FloatingMusicPlayer;