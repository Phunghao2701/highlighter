<div>
    <h1 align="center"><code>Highlighter</code>&nbsp;&nbsp;🖍️</h1>
    <p align="center">
        <strong>✨ A dependency-free library for highlighting and persisting text on any website ✨🖍️</strong>
    </p>
   
</div>

---

## Development

This project uses Node.js `22.15.1` and publishes ES5 output with IE11 support. With [nvm](https://github.com/nvm-sh/nvm) installed, run:

```bash
nvm use
npm ci
npm test
```

### Try the Chrome/Edge extension

Build the unpacked extension:

```bash
npm run build:extension
```

In Chrome, open `chrome://extensions`; in Edge, open `edge://extensions`. Turn on **Developer mode**, choose **Load unpacked**, and select the repository's `dist/extension` folder. After rebuilding an already loaded extension, click its **Reload** button and refresh the webpage. On a regular webpage, select a passage, right-click it, and choose **Highlight selection**. Repeat for each passage, then click the Highlighter toolbar button and **Share all highlights**. The link is copied to the clipboard and a brief toast confirms it. Recipients can open the link in Chrome or Edge to see every passage highlighted; they do not need to install the extension.

The extension requests access to the active tab only after you click its toolbar button. Shared links contain short start/end text ranges and surrounding quote context in Chromium text-fragment directives, so they can highlight passages that span inline elements without a share server or recipient extension. The destination page must contain the selected text; pages that block text fragments or change URL fragments may not show the highlights.


## Compatibility

> It depends on [Selection API](https://caniuse.com/#search=selection%20api).

- IE 11
- Edge
- Firefox 52+
- Chrome 15+
- Safari 5.1+
- Opera 15+

_**Mobile support:**_ Mobile devices are detected automatically and use touch events instead of mouse events.

### Runtime environment

Highlighter requires browser DOM APIs, including `document`, `Range`, and `Selection`. It supports browsers and WebViews that provide these APIs. Native mini-program renderers and non-DOM native application views are not supported.

## Advanced usage

For more ways to customize highlighting behavior, read the [advanced guide](https://github.com/alienzhou/web-highlighter/blob/master/docs/ADVANCE.md).

## License

[MIT](./LICENSE)
