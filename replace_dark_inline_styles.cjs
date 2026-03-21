const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'frontend/components/modals/CreateProjectModal.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

// The `V` object already has `bg`, `card`, `border`, `text` etc.
// Replace background hexes
code = code.replace(/background: "(#0D0D0D|#050505|#0A0A0A|#080808|#111|#1A1A1A)"/g, 'background: V.bg');
code = code.replace(/background: '(#0D0D0D|#050505|#0A0A0A|#080808|#111|#1A1A1A)'/g, 'background: V.bg');

// Handle borders
code = code.replace(/border: `1px solid #1A1A1A`/g, 'border: `1px solid ${V.border}`');
code = code.replace(/border: "1px solid #1A1A1A"/g, 'border: `1px solid ${V.border}`');
code = code.replace(/border: "1px solid #333"/g, 'border: `1px solid ${V.border}`');
code = code.replace(/border: "1px solid #222"/g, 'border: `1px solid ${V.border}`');
code = code.replace(/border: `1px solid \$\{projectName \? "#333" : "#222"\}`/g, 'border: `1px solid ${projectName ? V.textTertiary : V.border}`');
code = code.replace(/borderBottom: "1px solid #1A1A1A"/g, 'borderBottom: `1px solid ${V.border}`');
code = code.replace(/borderTop: "1px solid #1A1A1A"/g, 'borderTop: `1px solid ${V.border}`');
code = code.replace(/borderTop: `1px solid #1A1A1A`/g, 'borderTop: `1px solid ${V.border}`');
code = code.replace(/border: `1px solid \$\{selectedIcon === icon.id \? V.accent : "#222"\}`/g, 'border: `1px solid ${selectedIcon === icon.id ? V.accent : V.border}`');

// Handle text colors exactly
// "color: '#fff'" or "color: '#000'"
code = code.replace(/color: "#fff"/g, 'color: V.text');
code = code.replace(/color: "#000"/g, 'color: V.bg');

// For specific the next button condition
// background: (mode === 'goal' && step === 2) ? "#fff" : (step === 3) ? "#fff" : (step === 1 && !isNextEnabled) ? "#0A1A3A" : "#112B5B"
// color: (mode === 'goal' && step === 2) ? "#000" : (step === 3) ? "#000" : (step === 1 && !isNextEnabled) ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,1)"
// Wait, for Next button, keeping those primary button colors is actually fine, but the disabled state `#0A1A3A` might be dark. 
// Let's replace only the generic hardcoded ones. `#FF5555` is error red, which is fine.

fs.writeFileSync(targetFile, code);
console.log('✅ Replaced inline dark colors in CreateProjectModal.tsx');
