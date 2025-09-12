const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'server', 'migrations');
const out = path.join(__dirname, '..', 'schema_full.sql');
const files = fs.readdirSync(dir).sort();
let text = '-- Composed schema\n';
for (const f of files) {
  text += '\n-- ' + f + '\n';
  text += fs.readFileSync(path.join(dir, f), 'utf8') + '\n';
}
fs.writeFileSync(out, text);
console.log('Wrote', out);
