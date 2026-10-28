const { execFileSync } = require('child_process');
const { mkdtempSync, rmSync, writeFileSync } = require('fs');
const { tmpdir } = require('os');
const { join, resolve } = require('path');

const packageJson = require('../package.json');
const basePath = resolve(__dirname, '..');
const tempPath = mkdtempSync(join(tmpdir(), 'highlighter-package-'));

try {
    const packOutput = execFileSync('npm', ['pack', '--pack-destination', tempPath, '--json'], {
        cwd: basePath,
        encoding: 'utf8',
    });
    const [{ filename }] = JSON.parse(packOutput);
    const packagePath = join(tempPath, filename);
    writeFileSync(join(tempPath, 'package.json'), '{"private":true}');
    writeFileSync(join(tempPath, 'tsconfig.json'), '{"compilerOptions":{"esModuleInterop":true,"lib":["dom","es2015"],"strict":true,"noEmit":true}}');
    writeFileSync(join(tempPath, 'index.ts'), "import Highlighter from '@phunghao2701/highlighter';\nconst highlighter = new Highlighter({ wrapTag: 'mark' });\nhighlighter.run();\nhighlighter.removeAll();\nHighlighter.event.CREATE;\n");

    execFileSync('npm', ['install', '--ignore-scripts', '--no-package-lock', packagePath], { cwd: tempPath, stdio: 'inherit' });
    execFileSync(join(basePath, 'node_modules', '.bin', 'tsc'), ['--project', join(tempPath, 'tsconfig.json')], {
        cwd: tempPath,
        stdio: 'inherit',
    });
} finally {
    rmSync(tempPath, { recursive: true, force: true });
}
