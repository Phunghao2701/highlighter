const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const { extensionPath, extensionDistPath } = require('../config/paths');
const config = require('../config/webpack.config.extension');

const staticFiles = ['manifest.json', 'background.js', 'popup.html', 'popup.css', 'content.css', 'THIRD_PARTY_LICENSES.txt'];

webpack(config, (error, stats) => {
    if (error || stats.hasErrors()) {
        console.error(error || stats.toJson({ colors: true }).errors);
        process.exitCode = 1;
        return;
    }

    fs.mkdirSync(extensionDistPath, { recursive: true });
    staticFiles.forEach(file => {
        fs.copyFileSync(path.resolve(extensionPath, file), path.resolve(extensionDistPath, file));
    });

    const iconDistPath = path.resolve(extensionDistPath, 'icons');
    fs.mkdirSync(iconDistPath, { recursive: true });
    [16, 32, 48, 128].forEach(size => {
        const icon = `icon-${size}.png`;
        fs.copyFileSync(path.resolve(__dirname, '../assets/brand', icon), path.resolve(iconDistPath, icon));
    });

    console.log(stats.toString({ colors: true }));
});
