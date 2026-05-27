import { useEffect } from 'react';

export default function useModuleOpenListener(moduleKey, setIsOpen) {
  useEffect(() => {
    const handler = (event) => {
      if (event.detail?.moduleKey === moduleKey) {
        setIsOpen(true);
      }
    };

    window.addEventListener('open-project-module', handler);
    return () => window.removeEventListener('open-project-module', handler);
  }, [moduleKey, setIsOpen]);
}
