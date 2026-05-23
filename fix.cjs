const fs = require('fs');
let c = fs.readFileSync('backend/Code.gs', 'utf8');
c = c.replace(/\.([^\s\(\)\[\]\{\}\.\,\;\:\+\-\*\/\=\!\?\<\>\|\\\&\%\"']+)/g, (m, p1) => {
  if (/[^\x00-\x7F]/.test(p1)) {
    return "['" + p1 + "']";
  }
  return m;
});
// Fix double brackets in case my previous powershell regex left some like `['['NGÀY']']`
c = c.replace(/\[\'\[\'/g, "['").replace(/\'\]\'\]/g, "']");
fs.writeFileSync('backend/Code.gs', c, 'utf8');
