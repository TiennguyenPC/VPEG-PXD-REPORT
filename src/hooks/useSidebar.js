import { useState, useEffect } from 'react';

export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  // Listen to cross-component changes if needed, but since we use hook at top level, it's fine.
  // To keep it synced across instances if they mount differently:
  useEffect(() => {
    const handleStorage = () => {
      setIsCollapsed(localStorage.getItem('sidebarCollapsed') === 'true');
    };
    window.addEventListener('sidebarToggled', handleStorage);
    return () => window.removeEventListener('sidebarToggled', handleStorage);
  }, []);

  const toggleSidebar = () => {
    const currentState = localStorage.getItem('sidebarCollapsed') === 'true';
    const newState = !currentState;
    localStorage.setItem('sidebarCollapsed', newState);
    window.dispatchEvent(new Event('sidebarToggled'));
    setIsCollapsed(newState);
  };

  return { isCollapsed, toggleSidebar };
}
