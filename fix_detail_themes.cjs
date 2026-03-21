const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'frontend/views/ProjectDetailView.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

// Replace Inline Styles Hexes
code = code.replace(/background: "(#000|#111|#0a0a0a|#0A0A0A|#050505|#0D1117|#11141A)"/g, 'background: V.bg');
code = code.replace(/background: '(#000|#111|#0a0a0a|#0A0A0A|#050505|#0D1117|#11141A)'/g, 'background: V.bg');

code = code.replace(/borderColor = "(#333|#444|#222|#1A1A1A)"/g, 'borderColor = "var(--gh-border)"');
code = code.replace(/border: "1px solid #333"/g, 'border: `1px solid ${V.border}`');
code = code.replace(/border: `1px solid #333`/g, 'border: `1px solid ${V.border}`');
code = code.replace(/borderTop: `1px solid #333`/g, 'borderTop: `1px solid ${V.border}`');
code = code.replace(/borderLeft: `1px solid #333`/g, 'borderLeft: `1px solid ${V.border}`');

code = code.replace(/color: "#fff"/g, 'color: V.text');
code = code.replace(/color: "#000"/g, 'color: V.bg');

code = code.replace(/#111/g, 'var(--gh-bg-secondary)');
code = code.replace(/#0a0a0a/g, 'var(--gh-bg)');
code = code.replace(/#333/g, 'var(--gh-border)');

// Replace Tailwind Arbitrary Dark Hexes
code = code.replace(/bg-\[#11141A\]/g, 'bg-gh-bg-secondary');
code = code.replace(/bg-\[#0A0D14\]/g, 'bg-gh-bg');
code = code.replace(/bg-\[#0D1117\]/g, 'bg-gh-bg');
code = code.replace(/bg-\[#1f242c\]/g, 'bg-gh-bg-tertiary');
code = code.replace(/hover:bg-\[#1f242c\]/g, 'hover:bg-gh-bg-tertiary');
code = code.replace(/hover:bg-\[#30363d\]/g, 'hover:bg-gh-bg-tertiary');
code = code.replace(/border-\[#1E232E\]/g, 'border-gh-border');
code = code.replace(/border-\[#30363d\]/g, 'border-gh-border');
code = code.replace(/text-\[#7d8590\]/g, 'text-gh-text-secondary');
code = code.replace(/text-\[#c9d1d9\]/g, 'text-gh-text');
code = code.replace(/placeholder-\[#7d8590\]/g, 'placeholder-gh-text-secondary');

fs.writeFileSync(targetFile, code);
console.log('✅ Replaced inline dark colors in ProjectDetailView.tsx');
