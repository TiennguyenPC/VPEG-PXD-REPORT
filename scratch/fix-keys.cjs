const fs = require('fs');

const files = [
  { path: 'src/components/project-details/modules/PermitModule.jsx', key: 'permit' },
  { path: 'src/components/project-details/modules/DesignModule.jsx', key: 'design' },
  { path: 'src/components/project-details/modules/ProcurementModule.jsx', key: 'procurement' },
  { path: 'src/components/project-details/modules/ConstructionModule.jsx', key: 'construction' },
  { path: 'src/components/project-details/modules/HandoverModule.jsx', key: 'handover' }
];

files.forEach(({ path, key }) => {
  let content = fs.readFileSync(path, 'utf8');
  
  // Replace the broken localStorage key with the correct one
  content = content.replace(/localStorage\.getItem\(`dates_\$\{project\?\.PROJECT_ID \|\| project\?\.id\}`\)/g, 
    `localStorage.getItem(\`dates_${key}_\${project?.PROJECT_ID || project?.id}\`)`);
    
  fs.writeFileSync(path, content);
});
