const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    filelist = fs.statSync(path.join(dir, file)).isDirectory()
      ? walkSync(path.join(dir, file), filelist)
      : filelist.concat(path.join(dir, file));
  });
  return filelist;
};

const files = walkSync('src').filter(f => f.endsWith('.jsx') || f.endsWith('.js'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  content = content.replace(/fetch\(['"]\\?\/api([^'"]*)['"]/g, "fetch(`${API_BASE_URL}/api$1`");
  content = content.replace(/fetch\(`\\?\/api([^`]*)`/g, "fetch(`${API_BASE_URL}/api$1`");
  content = content.replace(/fetch\(`\\?\/(\$\{endpoint\}[^`]*)`/g, "fetch(`${API_BASE_URL}/$1`");

  if (content !== originalContent) {
    const depth = file.split(/\\|\//).length - 2; 
    const relativePath = depth === 0 ? './config/api' : '../'.repeat(depth) + 'config/api';
    
    const importStmt = `import { API_BASE_URL } from '${relativePath}';\n`;
    
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLastImport = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, endOfLastImport + 1) + importStmt + content.slice(endOfLastImport + 1);
    } else {
      content = importStmt + content;
    }
    
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
