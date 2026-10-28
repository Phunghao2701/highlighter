const $ = id => document.getElementById(id);
const $shareButton = $('share-all');
const $shareLabel = $('share-label');
const $status = $('status');

let statusTimer;

const showToast = (message, tone = 'info', duration = 2800) => {
    clearTimeout(statusTimer);
    $status.textContent = message;
    $status.dataset.tone = tone;
    $status.hidden = false;
    statusTimer = window.setTimeout(() => {
        $status.hidden = true;
    }, duration);
};

const runPageCommand = async command => {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

    if (!tab?.id) {
        throw new Error('No active tab is available.');
    }

    const target = { tabId: tab.id };

    await chrome.scripting.insertCSS({ target, files: ['content.css'] });
    await chrome.scripting.executeScript({ target, files: ['content.js'] });

    const [execution] = await chrome.scripting.executeScript({
        target,
        func: commandName => {
            const api = window.__webHighlighterExtension;
            return api && typeof api[commandName] === 'function'
                ? api[commandName]()
                : { ok: false, message: 'The highlighter could not start on this page.' };
        },
        args: [command],
    });

    return execution?.result;
};

const copyText = async text => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    }
    catch {
        const fallback = document.createElement('textarea');
        fallback.value = text;
        fallback.setAttribute('readonly', '');
        fallback.style.position = 'fixed';
        fallback.style.opacity = '0';
        document.body.append(fallback);
        fallback.select();

        let copied = false;
        try {
            copied = document.execCommand('copy');
        }
        catch {
            copied = false;
        }
        fallback.remove();
        return copied;
    }
};

$shareButton.addEventListener('click', async () => {
    $shareButton.disabled = true;
    $shareButton.setAttribute('aria-busy', 'true');
    $shareLabel.textContent = 'Creating link...';
    showToast('Creating a share link...', 'info', 10000);

    try {
        const result = await runPageCommand('createShareLink');

        if (!result?.ok) {
            showToast(result?.message || 'Could not create a share link.', 'error', 4200);
            return;
        }

        const copied = await copyText(result.url);
        showToast(
            copied ? 'Copied to clipboard.' : 'Could not copy the link. Please try again.',
            copied ? 'success' : 'error',
            copied ? 2400 : 4200,
        );
    }
    catch {
        showToast('This page does not allow extension scripts. Try a regular webpage.', 'error', 4200);
    }
    finally {
        $shareButton.disabled = false;
        $shareButton.removeAttribute('aria-busy');
        $shareLabel.textContent = 'Share all highlights';
    }
});

const restoreIfShared = async () => {
    try {
        const result = await runPageCommand('restoreSharedHighlights');
        if (result?.ok) {
            showToast(result.message, 'info');
        }
        else if (result?.reason !== 'no-share') {
            showToast(result?.message || 'Could not restore this shared highlight.', 'error', 4200);
        }
    }
    catch {
        showToast('Use a regular webpage, then right-click selected text to highlight it.', 'error', 4200);
    }
};

restoreIfShared();
