const fs = require('fs');
let code = fs.readFileSync('backend/Code.gs', 'utf8');

// Fix 1: appendRow
code = code.replace(
  "newRow[colIndex] = val;",
  `const hStr = String(headers[colIndex]).trim().toUpperCase();
      if ((hStr === 'PROJECT_ID' || hStr === 'ID') && typeof val === 'string' && val.includes('-')) {
        val = "'" + val;
      }
      newRow[colIndex] = val;`
);

// Fix 2: batchAppendRows
code = code.replace(
  "newRow[colIndex] = rowObj[key];",
  `let val = rowObj[key];
        const hStr = String(headers[colIndex]).trim().toUpperCase();
        if ((hStr === 'PROJECT_ID' || hStr === 'ID') && typeof val === 'string' && val.includes('-')) {
          val = "'" + val;
        }
        newRow[colIndex] = val;`
);

// Fix 3: updateRowById
code = code.replace(
  "sheet.getRange(targetRowIndex, colIndex + 1).setValue(val);",
  `const hStr = String(headers[colIndex]).trim().toUpperCase();
      if ((hStr === 'PROJECT_ID' || hStr === 'ID') && typeof val === 'string' && val.includes('-')) {
        val = "'" + val;
      }
      sheet.getRange(targetRowIndex, colIndex + 1).setValue(val);`
);

fs.writeFileSync('backend/Code.gs', code, 'utf8');
