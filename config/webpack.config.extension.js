const path = require('path');
const baseConfig = require('./base.config');
const { extensionPath, extensionDistPath } = require('./paths');

module.exports = {
    ...baseConfig,
    mode: 'production',
    module: {
        ...baseConfig.module,
        rules: baseConfig.module.rules.map(rule => ({
            ...rule,
            options: {
                ...rule.options,
                compilerOptions: {
                    ...rule.options?.compilerOptions,
                    declaration: false,
                },
            },
        })),
    },
    entry: {
        popup: path.resolve(extensionPath, 'popup.js'),
        content: path.resolve(extensionPath, 'content.js'),
    },
    output: {
        path: extensionDistPath,
        filename: '[name].js',
        globalObject: 'self',
        clean: true,
    },
};
