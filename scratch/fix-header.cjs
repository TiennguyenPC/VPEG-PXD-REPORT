const fs = require('fs');

const files = [
  'src/components/project-details/modules/PermitModule.jsx',
  'src/components/project-details/modules/DesignModule.jsx',
  'src/components/project-details/modules/ProcurementModule.jsx',
  'src/components/project-details/modules/ConstructionModule.jsx',
  'src/components/project-details/modules/HandoverModule.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<ModuleDateHeader projectId=\{project\?\.PROJECT_ID \|\| project\?\.id\} moduleKey="([^"]+)" syncStatus=\{syncStatus\} \/>/g, 
    '<ModuleDateHeader projectId={project?.PROJECT_ID || project?.id} moduleKey="$1" syncStatus={syncStatus} initialData={initialData} />');
  fs.writeFileSync(file, content);
});
