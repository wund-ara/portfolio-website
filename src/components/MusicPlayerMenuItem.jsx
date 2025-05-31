// src/components/MusicPlayerMenuItem.jsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/MusicPlayerMenuItem.css';

const MusicPlayerMenuItem = ({ musicData }) => {
  const audioRef = useRef(null);
  const menuRef = useRef(null);

  // Component states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false); // To prevent listener conflicts during drag

  // Destructure data from the musicData prop with default values
  const {
    src,
    autoPlay = true,
    loop = true,
    title = "Music Player",
    artworkSrc
  } = musicData;

  // Helper function to format time (e.g., 150 seconds -> 02:30)
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- NEW: useEffect for initial autoplay only ---
  // This effect runs only once on mount (or if src/autoPlay prop changes),
  // ensuring that the autoplay logic doesn't re-trigger unnecessarily.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !autoPlay) return; // Only proceed if audio element exists and autoplay is desired

    audio.muted = true; // Always start muted for browser compatibility
    audio.play().then(() => {
      setIsPlaying(true);
      setIsMuted(true);
    }).catch(error => {
      console.warn("Autoplay was prevented (likely due to sound or browser policy):", error);
      setIsPlaying(false);
      setIsMuted(true);
    });
  }, [src, autoPlay]); // Dependencies: Only re-run if the source or autoplay setting changes.

  // --- REVISED: useEffect for Audio Event Listeners (without autoplay logic) ---
  // This effect handles setting up and cleaning up audio event listeners.
  // It ensures the audio element's state (play, pause, volume, time) is reflected in React state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // The above line is to ignore ESLint's 'unnecessary dependencies' warning for props (src, loop)
  // as they are needed for the effect's logic but ESLint can be overzealous here.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Handlers for audio events
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    // Only update isMuted from audio events if not currently dragging the volume slider.
    // This prevents glitches from rapid updates during user interaction.
    const handleVolumeChangeFromAudio = () => {
      if (!isDraggingVolume) {
        setIsMuted(audio.muted || audio.volume < 0.001);
      }
    };

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (loop) { // 'loop' is a dependency for this effect
        audio.play(); // Explicitly play again if loop is true
      } else {
        audio.pause(); // Pause if not looping
      }
    };

    // Add all event listeners
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('volumechange', handleVolumeChangeFromAudio);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    // Cleanup function: remove event listeners when component unmounts or dependencies change.
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('volumechange', handleVolumeChangeFromAudio);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src, loop, isDraggingVolume]); // Dependencies: Re-run if src, loop, or dragging state changes

  // Toggles play/pause state of the audio element.
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      if (audio.muted) {
        audio.muted = false;
        setIsMuted(false);
      }
      audio.play().catch(error => {
        console.error("Failed to play:", error);
      });
    } else {
      audio.pause();
    }
  };

  // Handles changes from the volume slider. This is the primary controller for volume during user interaction.
  const handleVolumeSliderChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVolume;
      const shouldBeMuted = newVolume < 0.001; // Mute if volume is very close to zero

      audio.muted = shouldBeMuted;

      setVolume(newVolume); // Update React state for slider's visual position
      setIsMuted(shouldBeMuted); // Update React state for mute icon and slider value
    }
  };

  // Toggles the mute state of the audio element.
  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !audio.muted;
      setIsMuted(audio.muted);

      // If unmuting and the volume was near zero, set to a default audible level
      if (!audio.muted && audio.volume < 0.001) {
        audio.volume = 0.5;
        setVolume(0.5);
      }
    }
  };

  // Handles changes from the progress bar slider (scrubbing).
  const handleProgressBarChange = (e) => {
    const audio = audioRef.current;
    if (audio) {
      const newTime = parseFloat(e.target.value);
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Toggles the visibility of the music controls pop-up.
  const toggleControls = (e) => {
    e.stopPropagation();
    setShowControls(prev => !prev);
  };

  // Callback to close the pop-up when a click occurs outside of it.
  const handleClickOutside = useCallback((event) => {
    if (showControls && menuRef.current && !menuRef.current.contains(event.target)) {
      setShowControls(false);
    }
  }, [showControls]);

  // Effect to add/remove the global click listener for closing the pop-up.
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div className="music-player-menu-item" ref={menuRef}>
      {/* The <audio> element is rendered unconditionally here for continuous playback */}
      <audio ref={audioRef} src={process.env.PUBLIC_URL + src} loop={loop} />

      {/* Menu Bar Icon/Text (always visible) */}
      <div className="menu-item-icon" onClick={toggleControls}>
        {isPlaying ? (
          <img src={process.env.PUBLIC_URL + "/assets/play-icon.png"} alt="Playing" />
        ) : (
          <img src={process.env.PUBLIC_URL + "/assets/pause-icon.png"} alt="Paused" />
        )}
        <span className="menu-item-text">{title}</span>
      </div>

      {/* Controls Pop-up (conditionally rendered) */}
      {showControls && (
        <div className="music-controls-popup">
          <div className="popup-title">{title}</div>

          {artworkSrc && (
            <img src={process.env.PUBLIC_URL + artworkSrc} alt="Artwork" className="popup-artwork" />
          )}

          <div className="popup-controls">
            <button onClick={togglePlayPause} className="control-button">
              {isPlaying ? '⏸︎ Pause' : '▶︎ Play'}
            </button>

            <div className="progress-bar-container">
              <span className="current-time">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                step="0.1"
                onChange={handleProgressBarChange}
                className="progress-slider"
              />
              <span className="duration">{formatTime(duration)}</span>
            </div>

            <div className="volume-control">
              <button onClick={toggleMute} className="mute-button">
                {isMuted ? '🔇' : '🔊'}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeSliderChange}
                className="volume-slider"
                // New event handlers to track dragging state for robustness
                onMouseDown={() => setIsDraggingVolume(true)}
                onMouseUp={() => setIsDraggingVolume(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicPlayerMenuItem;