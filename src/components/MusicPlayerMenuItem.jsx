import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/MusicPlayerMenuItem.css';

const MusicPlayerMenuItem = ({ musicData }) => {
  const audioRef = useRef(null);
  const menuRef = useRef(null); // Ref for the menu item itself

  // Component states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Tracks the actual mute state of the audio element
  const [showControls, setShowControls] = useState(false);
  const [volume, setVolume] = useState(0.5); // Controls the slider position and audio element's volume
  const [currentTime, setCurrentTime] = useState(0); // Current playback time for progress bar
  const [duration, setDuration] = useState(0);     // Total track duration for progress bar

  // Destructure data from the musicData prop with default values
  const {
    src,
    autoPlay = true, // Whether to attempt autoplay (will be muted initially)
    loop = true,     // Whether the track should loop
    title = "Music Player", // Title to display
    artworkSrc       // Path to the artwork image
  } = musicData;

  // Helper function to format time (e.g., 150 seconds -> 02:30)
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00'; // Handle invalid or negative seconds
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // This useEffect handles the lifecycle of the audio element and its event listeners.
  // Dependencies: src, autoPlay, loop (for re-initializing if track changes), volume (for initial volume setting)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return; // Ensure audio element is available

    // Set the initial volume of the audio element
    audio.volume = volume;

    // Autoplay logic: Browsers typically require audio to be muted for autoplay without user interaction.
    if (autoPlay) {
      audio.muted = true; // Start muted to comply with browser policies
      audio.play().then(() => {
        setIsPlaying(true);
        setIsMuted(true); // Confirm muted state if autoplayed successfully
      }).catch(error => {
        // Log if autoplay was prevented (e.g., if it tried to play with sound)
        console.warn("Autoplay was prevented (likely due to sound or browser policy):", error);
        setIsPlaying(false); // Ensure state reflects actual non-playing status
        setIsMuted(true); // Still reflect it as muted if autoplay failed with sound
      });
    }

    // --- Event Listeners for Audio Playback State and Progress ---
    // These listeners update React states based on the actual audio element's properties.
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    // Updates `isMuted` state based on audio element's `muted` property or if volume is near zero.
    const handleVolumeChangeFromAudio = () => setIsMuted(audio.muted || audio.volume < 0.001);

    // Updates `currentTime` state frequently as audio plays.
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    // Sets `duration` state once the audio's metadata is loaded.
    const handleDurationChange = () => setDuration(audio.duration || 0);
    // Resets playback state when the track finishes.
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      // If looping, the browser will restart, but ensure state reflects it
      if (loop) {
        audio.play(); // Explicitly call play for consistent loop behavior
      } else {
        audio.pause(); // If not looping, ensure it pauses
      }
    };

    // Add all event listeners
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('volumechange', handleVolumeChangeFromAudio);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    // --- Cleanup function for useEffect ---
    // Removes event listeners when the component unmounts to prevent memory leaks.
    // IMPORTANT: We do NOT call audio.pause() here, as the audio should continue playing
    // even if the menu item component is unmounted (e.g., if the user navigates away from the page).
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('volumechange', handleVolumeChangeFromAudio);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src, autoPlay, loop, volume]); // `volume` is a dependency here for initial setup

  // Toggles play/pause state of the audio element.
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      // If audio was muted by autoplay, UNMUTE it when the user manually clicks Play.
      if (audio.muted) {
        audio.muted = false;
        setIsMuted(false); // Update local state
      }
      audio.play().catch(error => {
        console.error("Failed to play:", error);
      });
    } else {
      audio.pause();
    }
  };

  // Handles changes from the volume slider.
  const handleVolumeSliderChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVolume;
      // Use a small threshold to determine if volume is effectively zero for muting.
      const shouldBeMuted = newVolume < 0.001;

      audio.muted = shouldBeMuted; // Control the audio element's actual muted state

      // Update React states immediately to reflect the new state for smooth UI.
      setVolume(newVolume);
      setIsMuted(shouldBeMuted);
    }
  };

  // Toggles the mute state of the audio element.
  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !audio.muted; // Toggle the audio element's muted property
      setIsMuted(audio.muted); // Update local React state to reflect actual audio element's state

      // If unmuting and the volume was previously very low (effectively 0), set a default audible volume.
      if (!audio.muted && audio.volume < 0.001) {
        audio.volume = 0.5;
        setVolume(0.5); // Update local state for slider position
      }
    }
  };

  // Handles changes from the progress bar slider (scrubbing).
  const handleProgressBarChange = (e) => {
    const audio = audioRef.current;
    if (audio) {
      const newTime = parseFloat(e.target.value);
      audio.currentTime = newTime; // Set the audio's current playback time
      setCurrentTime(newTime); // Update state immediately for smoother UI feedback
    }
  };

  // Toggles the visibility of the music controls pop-up.
  const toggleControls = (e) => {
    e.stopPropagation(); // Prevent immediate closing due to global click listener
    setShowControls(prev => !prev);
  };

  // Callback to close the pop-up when a click occurs outside of it.
  const handleClickOutside = useCallback((event) => {
    // If the pop-up is open AND the click happened outside this component's area, close it.
    if (showControls && menuRef.current && !menuRef.current.contains(event.target)) {
      setShowControls(false);
    }
  }, [showControls]); // `showControls` is a dependency to ensure callback is updated if state changes

  // Effect to add/remove the global click listener for closing the pop-up.
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]); // `handleClickOutside` is a dependency

  return (
    <div className="music-player-menu-item" ref={menuRef}>
      {/*
        The <audio> element is rendered unconditionally here.
        This is CRUCIAL for continuous playback, as it ensures the audio element
        is always in the DOM and maintains its playback state even when the popup is closed.
      */}
      <audio ref={audioRef} src={process.env.PUBLIC_URL + src} loop={loop} />

      {/* Menu Bar Icon/Text (always visible) */}
      <div className="menu-item-icon" onClick={toggleControls}>
        {isPlaying ? (
          // Icon to show when music is playing (e.g., a play icon or sound waves)
          <img src={process.env.PUBLIC_URL + "/assets/play-icon.png"} alt="Playing" />
        ) : (
          // Icon to show when music is paused (e.g., a pause icon or muted speaker)
          <img src={process.env.PUBLIC_URL + "/assets/pause-icon.png"} alt="Paused" />
        )}
        <span className="menu-item-text">{title}</span>
      </div>

      {/* Controls Pop-up (conditionally rendered based on showControls state) */}
      {showControls && (
        <div className="music-controls-popup">
          {/* Title of the track/player */}
          <div className="popup-title">{title}</div>

          {/* Artwork, displayed below the title */}
          {artworkSrc && (
            <img src={process.env.PUBLIC_URL + artworkSrc} alt="Artwork" className="popup-artwork" />
          )}

          {/* Container for all control elements (play/pause, progress, volume) */}
          <div className="popup-controls">
            {/* Play/Pause Button */}
            <button onClick={togglePlayPause} className="control-button">
              {isPlaying ? '⏸︎ Pause' : '▶︎ Play'}
            </button>

            {/* Progress Bar (Current Time / Slider / Duration) */}
            <div className="progress-bar-container">
              <span className="current-time">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                step="0.1" // Allows for finer scrubbing
                onChange={handleProgressBarChange}
                className="progress-slider"
              />
              <span className="duration">{formatTime(duration)}</span>
            </div>

            {/* Volume Control (Mute Button + Slider) */}
            <div className="volume-control">
              <button onClick={toggleMute} className="mute-button">
                {isMuted ? '🔇' : '🔊'}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                // Visually show slider at 0 if muted, otherwise show actual volume
                value={isMuted ? 0 : volume}
                onChange={handleVolumeSliderChange}
                className="volume-slider"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicPlayerMenuItem;
