import React from 'react';
import '../styles/Dock.css';

const Dock = ({ items }) => {
  const handleItemClick = (item) => {
    if (item.type === 'link' && item.url) {
      window.open(item.url, item.external ? '_blank' : '_self');
    } else if (item.type === 'app' && item.action) {
      // For future expansion, e.g., 'openFinder' could trigger a specific window
      console.log(`Dock app clicked: ${item.action}`);
    }
  };

  return (
    <div className="dock">
      {items.map((item) => (
        <div key={item.id} className="dock-item" onClick={() => handleItemClick(item)}>
          <img src={process.env.PUBLIC_URL + item.icon} alt={item.name} className="dock-icon-image" />
          <span className="dock-item-name">{item.name}</span>
        </div>
      ))}
    </div>
  );
};

export default Dock;