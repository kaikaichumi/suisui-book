// Launcher: ensures Vite runs from the frontend directory
const { spawn } = require('child_process');
const path = require('path');
const dir = __dirname;
const child = spawn(process.execPath, [path.join(dir, 'node_modules/vite/bin/vite.js')], {
  stdio: 'inherit',
  cwd: dir
});
child.on('exit', (code) => process.exit(code));
