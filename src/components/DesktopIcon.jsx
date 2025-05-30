import React from 'react';
import '../styles/DesktopIcon.css';

const DesktopIcon = ({ icon, name, onClick, position }) => {
  return (
    <div
      className="desktop-icon"
      onClick={onClick}
      style={{ top: position.y, left: position.x }}
    >
      <img src={process.env.PUBLIC_URL + icon} alt={name} className="icon-image" />
      <span className="icon-name">{name}</span>
    </div>
  );
};

export default DesktopIcon;