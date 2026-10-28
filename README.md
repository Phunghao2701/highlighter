<h1 align="center">Highlighter</h1>
<p align="center">A Chrome and Edge extension for highlighting and sharing passages from any webpage.</p>

## Features

- Highlight selected text from the right-click menu.
- Add multiple highlights to the same page.
- Share all highlights with one click. The link is copied to the clipboard and a brief confirmation appears.
- Recipients can open a shared link in Chrome or Edge without installing the extension.

## Install for local testing

Requirements: Node.js 22.15.1 and npm.

From the repository root, build the extension:

~~~bash
npm ci
npm run build:extension
~~~

Then load it in Chrome or Edge:

1. Open chrome://extensions or edge://extensions.
2. Turn on **Developer mode**.
3. Select **Load unpacked** and choose dist/extension.

## Use

1. Select text on a webpage, right-click, and choose **Highlight selection**.
2. Repeat for each passage you want to share.
3. Select the Highlighter toolbar button and click **Share all highlights**.
4. Send the copied link. Recipients can open it without the extension.

The page must still contain the selected text. A site that changes or blocks URL text fragments may not show the highlights.

## Package and install a CRX

To create a single-file package, open the browser's extensions page, turn on **Developer mode**, select **Pack extension**, and choose dist/extension. The browser creates a CRX package and a PEM key. Keep the PEM private and safe; use the same key when creating future updates. Share only the CRX file.

To install a CRX in Edge, open edge://extensions, turn on **Developer mode**, and drag the CRX file onto the page. Browser or organization policy may restrict manual CRX installation; **Load unpacked** is available for local testing.

## License

[MIT](LICENSE)