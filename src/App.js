import React, { useState, useEffect, useCallback } from 'react';
import DesktopIcon from './components/DesktopIcon';
import Window from './components/Window';
import Dock from './components/Dock';
import FloatingGif from './components/FloatingGif';
// import FloatingMusicPlayer from './components/FloatingMusicPlayer';
import ImageFileIcon from './components/ImageFileIcon';
import MusicPlayerMenuItem from './components/MusicPlayerMenuItem';
import PhotoGallery from './components/PhotoGallery';
import portfolioData from './data/portfolio.json';
import './styles/App.css';

function App() {
  const [openWindows, setOpenWindows] = useState([]);
  const [windowZIndex, setWindowZIndex] = useState(100);
  const [draggingWindow, setDraggingWindow] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState('');
  const [imageIconPositions, setImageIconPositions] = useState({});

  // --- Functions for Window Dragging ---
  const handleTitleBarMouseDown = (e, windowId) => {
    e.preventDefault();
    const windowElement = document.getElementById(windowId);
    if (!windowElement)  {
      // DEBUG LOG: If windowElement not found, this is a serious issue
      console.error(`[App] handleTitleBarMouseDown: Window element not found for ID: ${windowId}`);
      return;
    }
    // DEBUG LOG 3: Confirm this handler is called for the correct window
    console.log(`[App] Attempting to drag window: ${windowId}`);

    setDraggingWindow(windowId);
    setDragOffset({
      x: e.clientX - windowElement.offsetLeft,
      y: e.clientY - windowElement.offsetTop,
    });
    handleWindowMouseDown(windowId);
  };

  const handleMouseMove = useCallback((e) => {
    if (draggingWindow) {
      const windowElement = document.getElementById(draggingWindow);
      if (windowElement) {
        let newX = e.clientX - dragOffset.x;
        let newY = e.clientY - dragOffset.y;

        const desktopWidth = window.innerWidth;
        const desktopHeight = window.innerHeight;
        const windowWidth = windowElement.offsetWidth;
        const windowHeight = windowElement.offsetHeight;

        newX = Math.max(0, Math.min(newX, desktopWidth - windowWidth));
        newY = Math.max(24, Math.min(newY, desktopHeight - windowHeight - 80)); // 24px for menu bar
        // Set new position directly to style, which will be maintained by React's rendering
        windowElement.style.left = `${newX}px`;
        windowElement.style.top = `${newY}px`;
      }
    }
  }, [draggingWindow, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setDraggingWindow(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
 
  // NEW: Handle icon drag end
  const handleIconDragEnd = useCallback((id, newPosition) => {
    setImageIconPositions(prevPositions => ({
      ...prevPositions,
      [id]: newPosition,
    }));
  }, []);

  // --- NEW useEffect for initial image icon positions ---
  // This effect runs ONLY ONCE when the component mounts.
  useEffect(() => {
    const newPositions = {};
    portfolioData.randomDesktopImages.forEach(image => {
      // If position is explicitly defined in JSON, use it. Otherwise, generate random.
      // This ensures positions are generated ONLY ONCE on initial mount.
      newPositions[image.id] = image.position || {
        x: Math.random() * (window.innerWidth - 180) + 50, // Adjusted range to better fit desktop
        y: Math.random() * (window.innerHeight - 300) + 100 // Adjusted range to better fit desktop
      };
    });
    setImageIconPositions(newPositions);
  }, []); // <-- CRITICAL: Empty dependency array ensures it runs only once.

  // --- Open Widgets Automatically on Load ---
  useEffect(() => {
    // Start Z-index for auto-opened widgets from a base value, e.g., 100
    let currentZIndex = 100;
    const initialWindows = portfolioData.autoOpenWidgets.map(widget => {
      currentZIndex += 1; // Increment for each widget
      return {
        id: widget.id,
        title: widget.title,
        content: widget.content,
        type: widget.type,
        videoType: widget.videoType, // Pass videoType to window data
        videoPath: widget.videoPath, // Pass videoPath to window data
        videoUrl: widget.videoUrl,   // Pass videoUrl to window data
        // Use the local `currentZIndex` for the widget
        zIndex: currentZIndex,
        initialPosition: widget.initialPosition,
        initialSize: widget.initialSize
      };
    });
    setOpenWindows(initialWindows);
    // After all auto-opened widgets are set, update the main windowZIndex
    // so subsequent desktop icon clicks start from the highest widget Z-index + 1
    setWindowZIndex(currentZIndex);
  }, []); // Empty dependency array remains, as we don't depend on external state changes


  // --- Existing App Logic ---
  const handleIconClick = (item) => {
    // If it's an image file icon, create a new window for it
    if (item.fullImagePath) { // Assuming item.fullImagePath indicates it's an image file
      if (!openWindows.some(win => win.id === item.id)) {
        setWindowZIndex(prev => prev + 1);
        const newWindow = {
          id: item.id,
          title: item.name, // Use the image's name as window title
          content: { type: 'image', src: item.fullImagePath }, // New content type 'image'
          zIndex: windowZIndex + 1,
          initialPosition: {
            x: Math.random() * 200 + 100,
            y: Math.random() * 100 + 80
          },
          initialSize: { width: 640, height: 360 } // Default size for image preview window
        };
        setOpenWindows(prev => [...prev, newWindow]);
      } else {
        // Bring existing image window to front
        setOpenWindows(prev =>
          prev.map(win =>
            win.id === item.id ? { ...win, zIndex: windowZIndex + 1 } : win
          ).sort((a, b) => a.zIndex - b.zIndex)
        );
        setWindowZIndex(prev => prev + 1);
      }
    } else {
      if (!openWindows.some(win => win.id === item.id)) {
        setWindowZIndex(prev => prev + 1);
        const newWindow = {
          id: item.id,
          title: item.windowContent.title,
          content: item.windowContent,
          zIndex: windowZIndex + 1,
          initialPosition: {
            x: Math.random() * 200 + 100,
            y: Math.random() * 100 + 80
          },
          // Desktop icons don't have initialSize, will use default CSS
          initialSize: undefined
        };
        setOpenWindows(prev => [...prev, newWindow]);
      } else {
        setOpenWindows(prev =>
          prev.map(win =>
            win.id === item.id ? { ...win, zIndex: windowZIndex + 1 } : win
          ).sort((a, b) => a.zIndex - b.zIndex)
        );
        setWindowZIndex(prev => prev + 1);
      }
    }
  };

  const handleCloseWindow = (id) => {
    setOpenWindows(prev => prev.filter(win => win.id !== id));
  };

  const handleWindowMouseDown = (windowId) => {
    setWindowZIndex(prev => prev + 1);
    setOpenWindows(prev =>
      prev.map(win =>
        win.id === windowId ? { ...win, zIndex: windowZIndex + 1 } : win
      ).sort((a, b) => a.zIndex - b.zIndex)
    );
  };


  // --- Current Time for Menu Bar ---
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = { hour: '2-digit', minute: '2-digit', hour12: false };
      setCurrentTime(now.toLocaleTimeString('en-GB', options));
    };

    updateTime();
    const intervalId = setInterval(updateTime, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Helper function to render window content based on type
  const renderWindowContent = (windowData) => {
       if (windowData.type === 'video') {
      // Handle video content dynamically
      if (windowData.videoType === 'local' && windowData.videoPath) {
        // Use <video> tag for local files
        return (
          <video width="100%" height="100%" controls autoPlay muted>
            <source src={process.env.PUBLIC_URL + windowData.videoPath} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        );
      } else if (windowData.videoType === 'online' && windowData.videoUrl) {
        // Use <iframe> for online videos
        return (
          <iframe
            width="100%"
            height="100%"
            src={windowData.videoUrl}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={windowData.title} // Add title for accessibility
          ></iframe>
        );
      } else {
        return <p>Video content type not recognized or path/URL missing.</p>;
      }
    } else if (windowData.content.type === 'image') { // NEW: Handle image content type
        return (
            <img
                src={process.env.PUBLIC_URL + windowData.content.src}
                alt={windowData.title}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
        );
    }
    // NEW: Handle Photo Gallery content
    else if (windowData.content.type === 'photoGallery') {
      return <PhotoGallery images={windowData.content.images} />;
    }
    // Existing content rendering for desktop icons
    switch (windowData.content.type) {
      case 'text':
        return <p>{windowData.content.content}</p>;
      case 'projectList':
        return (
          <div>
            <h3>Projects</h3>
            {windowData.content.items.map((project) => (
              <div key={project.id} className="project-item">
                <h4>{project.title}</h4>
                <p>{project.description}</p>
                {project.deliverables && (
                  <ul>
                    {project.deliverables.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                )}
                {project.images && project.images.map((imgSrc, i) => (
                  <img key={i} src={process.env.PUBLIC_URL + imgSrc} alt={`${project.title} ${i + 1}`} />
                ))}
                {project.link && <p><a href={project.link} target="_blank" rel="noopener noreferrer">View Project</a></p>}
              </div>
            ))}
          </div>
        );
      case 'workList':
        return (
          <div>
            <h3>Work Examples</h3>
            {windowData.content.items.map((work) => (
              <div key={work.id} className="work-example-item">
                <h4>{work.title}</h4>
                <p>{work.description}</p>
                {/* NEW: Container for side-by-side images */}
                {work.image && Array.isArray(work.image) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                    {work.image.map((imgSrc, i) => (
                      <img
                        key={i}
                        src={process.env.PUBLIC_URL + imgSrc}
                        alt={`${work.title} example ${i + 1}`}
                        style={{ maxWidth: '48%', height: 'auto', flex: '1 1 auto', objectFit: 'contain' }} /* Adjust maxWidth for multiple images */
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      case 'moodboard':
        return (
          <div>
            <h3>Moodboard</h3>
            <div className="moodboard-grid">
              {windowData.content.images.map((imgSrc, i) => (
                <img key={i} src={process.env.PUBLIC_URL + imgSrc} alt={`Moodboard ${i + 1}`} className="moodboard-image" />
              ))}
            </div>
          </div>
        );
      default:
        return <p>Content type not recognized.</p>;
    }
  };

  return (
    <div className="app-container">
      {/* Menu Bar */}
      <div className="menu-bar">
        <div className="menu-bar-left">
          <img src={process.env.PUBLIC_URL + "/assets/wund-ara.png"} alt="Finder" className="menu-bar-finder-icon" />
          <span className="menu-bar-app-name">Ara's MacBook</span>
        </div>
        <div className="menu-bar-right">
          {/* Pass music player data directly, or define it in portfolio.json if it needs more structure */}
          {/* For simplicity now, let's hardcode the music data for the component */}
          <MusicPlayerMenuItem
            musicData={{
              src: "/assets/nu-song.mp3", // Make sure this path is correct
              artworkSrc: "/assets/nu-artwork.gif", // Make sure this path is correct
              title: "Now Playing 🎧",
              autoPlay: true, // Will autoplay muted
              loop: true
            }}
          />
          <span className="menu-bar-time">{currentTime}</span>
        </div>
      </div>

      <div className="desktop">
        {portfolioData.desktopIcons.map(icon => (
          <DesktopIcon
            key={icon.id}
            id={icon.id}
            icon={icon.icon}
            name={icon.name}
            onClick={() => handleIconClick(icon)}
            position={icon.position}
          />
        ))}

        {/* NEW: Random Desktop Images */}
        {portfolioData.randomDesktopImages && portfolioData.randomDesktopImages.map(image => {
          const isWindowForIconOpen = openWindows.some(win => win.id === image.id);
          return (
            <ImageFileIcon
              key={image.id}
              id={image.id}
              name={image.name}
              thumbnailPath={image.thumbnailPath}
              fullImagePath={image.fullImagePath}
              // For now, let's hardcode positions or add them to portfolio.json for specific placement
              // Or you can generate random positions here dynamically
              position={imageIconPositions[image.id]}
              onClick={handleIconClick} // Pass the same handler as for desktop icons
              onDragEnd={handleIconDragEnd} // NEW: Pass the drag end handler
              isWindowOpen={isWindowForIconOpen} // NEW: Tell icon if its window is open
            />
          );
        })}

        {openWindows.map(window => (
          <Window
            key={window.id}
            id={window.id}
            title={window.title}
            onClose={handleCloseWindow}
            // Combine initialPosition/initialSize with dynamic style for dragging
            style={{
              zIndex: window.zIndex,
              left: window.initialPosition?.x, // Use optional chaining for safety
              top: window.initialPosition?.y,
              width: window.initialSize?.width,
              height: window.initialSize?.height
            }}
            onMouseDown={(e) => handleWindowMouseDown(window.id)}
            onTitleBarMouseDown={(e) => handleTitleBarMouseDown(e, window.id)}
          >
            {renderWindowContent(window)} {/* Pass the whole window object */}
          </Window>
        ))}

        {/* Render the Floating GIF if defined in portfolioData */}
        {portfolioData.floatingGif && (
          <FloatingGif
            id={portfolioData.floatingGif.id}
            src={portfolioData.floatingGif.src}
            initialPosition={portfolioData.floatingGif.initialPosition}
            initialSize={portfolioData.floatingGif.initialSize}
            zIndex={portfolioData.floatingGif.zIndex}
          />
        )}
        {/* NEW: Floating Music Player */}
        {/*portfolioData.floatingMusicPlayer && (
          <FloatingMusicPlayer
            id={portfolioData.floatingMusicPlayer.id}
            title={portfolioData.floatingMusicPlayer.title}
            src={portfolioData.floatingMusicPlayer.src}
            artworkSrc={portfolioData.floatingMusicPlayer.artworkSrc}
            initialPosition={portfolioData.floatingMusicPlayer.initialPosition}
            initialSize={portfolioData.floatingMusicPlayer.initialSize}
            zIndex={portfolioData.floatingMusicPlayer.zIndex}
            autoPlay={portfolioData.floatingMusicPlayer.autoPlay}
            controls={portfolioData.floatingMusicPlayer.controls}
            loop={portfolioData.floatingMusicPlayer.loop}
          />
        )}
        */}
      </div>
      <Dock items={portfolioData.dockItems} />
    </div>
  );
}

export default App;