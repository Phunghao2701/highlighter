declare const __HIGHLIGHTER_VERSION__: string;

// Tests and source-level consumers do not pass through webpack's DefinePlugin.
const version = typeof __HIGHLIGHTER_VERSION__ === 'string' ? __HIGHLIGHTER_VERSION__ : 'development';

export default version;
