const MENU_ID = 'web-highlighter-highlight-selection';

const ensureHighlightMenu = () => {
    chrome.contextMenus.update(
        MENU_ID,
        { title: 'Highlight selection', contexts: ['selection'] },
        () => {
            if (!chrome.runtime.lastError) {
                return;
            }

        chrome.contextMenus.create({
            id: MENU_ID,
            title: 'Highlight selection',
            contexts: ['selection'],
        });
        },
    );
};

// Recreate a missing menu whenever MV3 starts the service worker, including
// after a manual extension reload.
ensureHighlightMenu();

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== MENU_ID || !tab?.id) {
        return;
    }

    const target = { tabId: tab.id };

    try {
        await chrome.scripting.insertCSS({ target, files: ['content.css'] });
        await chrome.scripting.executeScript({ target, files: ['content.js'] });
        const [execution] = await chrome.scripting.executeScript({
            target,
            func: expectedText => {
                const api = window.__webHighlighterExtension;
                return api && typeof api.highlightSelection === 'function'
                    ? api.highlightSelection(expectedText)
                    : { ok: false, message: 'The highlighter could not start on this page.' };
            },
            args: [info.selectionText || ''],
        });

        if (!execution?.result?.ok) {
            console.warn('[web-highlighter]', execution?.result?.message || 'Unable to highlight the selected text.');
        }
    }
    catch (error) {
        console.warn('[web-highlighter] The active page does not allow extension scripts.', error);
    }
});
