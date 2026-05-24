import React, { createContext, useContext } from 'react';

const ProjectEditContext = createContext(true);

export function ProjectEditProvider({ canEdit = true, children }) {
  return (
    <ProjectEditContext.Provider value={Boolean(canEdit)}>
      {children}
    </ProjectEditContext.Provider>
  );
}

export function useProjectCanEdit() {
  return useContext(ProjectEditContext);
}
