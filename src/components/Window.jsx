import React from 'react';
import '../styles/Window.css';

// Added onTitleBarMouseDown prop
const Window = ({ id, title, children, onClose, style, onMouseDown, onTitleBarMouseDown }) => {
  return (
    // Pass style prop for dynamic positioning/z-index
    <div className="window" id={id} style={style} onMouseDown={onMouseDown}>
      {/* Attach onTitleBarMouseDown to the title-bar */}
      <div className="title-bar" onMouseDown={onTitleBarMouseDown}>
        <div className="traffic-lights">
          <button className="close-btn" onClick={() => onClose(id)}></button>
          <button className="minimize-btn"></button>
          <button className="maximize-btn"></button>
        </div>
        <span className="window-title">{title}</span>
      </div>
      <div className="window-content">
        {children}
      </div>
    </div>
  );
};

export default Window;