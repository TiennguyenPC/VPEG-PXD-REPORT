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
  
  if (!content.includes('const [syncStatus')) {
    content = content.replace(/const \[isUpdating, setIsUpdating\] = useState\(false\);/, 
      'const [isUpdating, setIsUpdating] = useState(false);\n  const [syncStatus, setSyncStatus] = useState(null);');
  }

  content = content.replace(/setIsUpdating\(true\);/g, 'setIsUpdating(true); setSyncStatus("saving");');
  content = content.replace(/setIsUpdating\(false\);/g, 'setIsUpdating(false); setSyncStatus("success"); setTimeout(() => setSyncStatus(null), 3000);');
  content = content.replace(/setSyncError\(true\);/g, 'setSyncError(true); setSyncStatus("error"); setTimeout(() => setSyncStatus(null), 3000);');
  
  // Pass syncStatus to ModuleDateHeader
  content = content.replace(/<ModuleDateHeader\s+([\s\S]*?)moduleKey="([^"]+)"([\s\S]*?)\/>/g, '<ModuleDateHeader $1moduleKey="$2" syncStatus={syncStatus} $3/>');
  
  // Append module date to payload
  const dateAppendRegex = /_rowIndex: updatedItem\._rowIndex,[\s\S]*?PROJECT_ID: [^,]+,/g;
  content = content.replace(dateAppendRegex, match => {
    return match + `\n          NGÀY_BẮT_ĐẦU_MODULE: JSON.parse(localStorage.getItem(\`dates_\${project?.PROJECT_ID || project?.id}\`) || '{}').start || '',\n          SỐ_NGÀY_MODULE: JSON.parse(localStorage.getItem(\`dates_\${project?.PROJECT_ID || project?.id}\`) || '{}').days || '',`;
  });

  fs.writeFileSync(file, content);
});
