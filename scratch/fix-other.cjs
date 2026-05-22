const fs = require('fs');

const files = [
  { path: 'src/components/project-details/modules/DesignModule.jsx', var: 'designs', letter: 'd' },
  { path: 'src/components/project-details/modules/ProcurementModule.jsx', var: 'items', letter: 'i' },
  { path: 'src/components/project-details/modules/HandoverModule.jsx', var: 'handovers', letter: 'h' }
];

files.forEach(({ path, var: stateVar, letter }) => {
  let content = fs.readFileSync(path, 'utf8');

  // Fix the broken replacement
  const regex = new RegExp(`let updatedItems = \\[\\];\\s*let updatedItem = null;\\s*set${stateVar.charAt(0).toUpperCase() + stateVar.slice(1)}\\(prev => \\{\\s*const next = prev\\.map\\(${letter} => \\{\\s*if \\(${letter}\\.id === id\\) \\{\\s*updatedItem = \\{ \\.\\.\\.${letter}, \\[field\\]: value \\};\\s*return updatedItem;\\s*\\}\\s*return ${letter};\\s*\\}\\);\\s*updatedItems = next;\\s*return next;\\s*\\}\\);`);
  
  content = content.replace(regex,
    `let updatedItem = null;
    const nextItems = ${stateVar}.map(${letter} => {
      if (${letter}.id === id) {
        updatedItem = { ...${letter}, [field]: value };
        return updatedItem;
      }
      return ${letter};
    });
    set${stateVar.charAt(0).toUpperCase() + stateVar.slice(1)}(nextItems);`);

  fs.writeFileSync(path, content);
});
