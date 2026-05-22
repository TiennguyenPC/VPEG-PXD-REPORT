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

  // Fix Permit, Design, Handover, Procurement (which use id)
  if (content.includes('let updatedItems = [];\n    let updatedItem = null;')) {
    const isGroups = content.includes('setGroups');
    const stateVar = isGroups ? 'groups' : (file.includes('Permit') ? 'permits' : (file.includes('Design') ? 'designs' : (file.includes('Handover') ? 'handovers' : 'items')));
    
    if (!isGroups) {
      const regex = new RegExp(`let updatedItems = \\[\\];\\s*let updatedItem = null;\\s*set${stateVar.charAt(0).toUpperCase() + stateVar.slice(1)}\\(prev => \\{\\s*const next = prev\\.map\\(p => \\{\\s*if \\(p\\.id === id\\) \\{\\s*updatedItem = \\{ \\.\\.\\.p, \\[field\\]: value \\};\\s*return updatedItem;\\s*\\}\\s*return p;\\s*\\}\\);\\s*updatedItems = next;\\s*return next;\\s*\\}\\);`);
      content = content.replace(regex,
        `let updatedItem = null;
    const nextItems = ${stateVar}.map(p => {
      if (p.id === id) {
        updatedItem = { ...p, [field]: value };
        return updatedItem;
      }
      return p;
    });
    set${stateVar.charAt(0).toUpperCase() + stateVar.slice(1)}(nextItems);`);

      // Also replace updatedItems with nextItems in localstorage
      content = content.replace(/if \(updatedItems\.length > 0\) \{/g, 'if (nextItems.length > 0) {');
      content = content.replace(/updatedItems\.map/g, 'nextItems.map');
    }
  }

  // Handle ConstructionModule which uses groups and task updating
  if (file.includes('Construction')) {
    const regexGroup = /let updatedTask = null;\s*let updatedGroups = \[\];\s*setGroups\(prev => \{\s*const next = prev\.map\(g => \{\s*if \(g\.id === groupId\) \{\s*return \{\s*\.\.\.g,\s*tasks: g\.tasks\.map\(t => \{\s*if \(t\.id === taskId\) \{\s*updatedTask = \{ \.\.\.t, \[field\]: value \};\s*return updatedTask;\s*\}\s*return t;\s*\}\)\s*\};\s*\}\s*return g;\s*\}\);\s*updatedGroups = next;\s*return next;\s*\}\);/;
    content = content.replace(regexGroup,
      `let updatedTask = null;
    const nextGroups = groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          tasks: g.tasks.map(t => {
            if (t.id === taskId) {
              updatedTask = { ...t, [field]: value };
              return updatedTask;
            }
            return t;
          })
        };
      }
      return g;
    });
    setGroups(nextGroups);`);
    
    content = content.replace(/if \(updatedGroups\.length > 0\) \{/g, 'if (nextGroups.length > 0) {');
    content = content.replace(/const rawData = updatedGroups\.flatMap/g, 'const rawData = nextGroups.flatMap');
  }

  fs.writeFileSync(file, content);
});
console.log('Done!');
