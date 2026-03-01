const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    try {
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            file = path.resolve(dir, file);
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory() && !file.includes('node_modules')) {
                results = results.concat(walk(file));
            } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        });
    } catch (e) { }
    return results;
}

const files = [...walk('components'), ...walk('views'), 'App.tsx'];
let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // VERCEL AGGRESSIVE HEX MAP
    // Backgrounds:
    content = content.replace(/bg-gray-900/g, 'bg-[#0A0A0A]');
    content = content.replace(/bg-gray-800/g, 'bg-[#111111]');
    content = content.replace(/bg-gray-700/g, 'bg-[#222222]');
    content = content.replace(/hover:bg-gray-800/g, 'hover:bg-[#111111]');
    content = content.replace(/hover:bg-gray-900/g, 'hover:bg-[#0A0A0A]');

    // Custom Gray/Black variants lingering from older implementations:
    content = content.replace(/bg-\[#121212\]/ig, 'bg-[#000000]');
    content = content.replace(/bg-\[#111827\]/ig, 'bg-[#000000]'); // Tailwind gray-900 hex
    content = content.replace(/bg-\[#1f2937\]/ig, 'bg-[#0A0A0A]'); // Tailwind gray-800 hex

    // Borders:
    content = content.replace(/border-gray-800/g, 'border-[#1A1A1A]');
    content = content.replace(/border-gray-700/g, 'border-[#333333]');
    content = content.replace(/divide-gray-800/g, 'divide-[#1A1A1A]');
    content = content.replace(/hover:border-gray-700/g, 'hover:border-[#333333]');

    // Text:
    content = content.replace(/text-gray-400/g, 'text-[#a1a1aa]');
    content = content.replace(/text-gray-300/g, 'text-[#ededed]');
    content = content.replace(/text-gray-200/g, 'text-white');
    content = content.replace(/hover:text-gray-300/g, 'hover:text-[#ededed]');
    content = content.replace(/hover:text-gray-400/g, 'hover:text-[#a1a1aa]');

    // Final explicit Github mappings just in case newer files sneaked them in:
    content = content.replace(/bg-\[#010409\]/ig, 'bg-[#000000]');
    content = content.replace(/bg-\[#161b22\]/ig, 'bg-[#0A0A0A]');
    content = content.replace(/bg-\[#0d1117\]/ig, 'bg-[#000000]');
    content = content.replace(/border-\[#30363d\]/ig, 'border-[#1A1A1A]');

    if (content !== original) {
        fs.writeFileSync(file, content);
        changedFiles++;
    }
});
console.log('Vercel CSS Enforcer updated ' + changedFiles + ' files');
