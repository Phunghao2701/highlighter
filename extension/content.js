import Highlighter from '../src/index';
const { generateFragmentFromRange, GenerateFragmentStatus } = require('./fragment-generation-utils');

const SHARE_KEY = 'web-highlighter-share';
const SHARE_VERSION = 2;
const API_KEY = '__webHighlighterExtension';
const API_VERSION = 6;
const QUOTE_CONTEXT_LENGTH = 48;

if (window[API_KEY]?.version !== API_VERSION) {
    const highlighter = new Highlighter({
        exceptSelectors: ['script', 'style', 'noscript', 'textarea', 'input', 'button', 'select', 'option'],
        style: {
            className: 'web-highlighter-extension-mark',
        },
    });

    const isDomMeta = meta =>
        meta &&
        typeof meta.parentTagName === 'string' &&
        Number.isFinite(meta.parentIndex) &&
        Number.isFinite(meta.textOffset);

    const isSharedSource = source =>
        source &&
        typeof source.id === 'string' &&
        typeof source.text === 'string' &&
        isDomMeta(source.startMeta) &&
        isDomMeta(source.endMeta);

    const quoteContextById = new Map();
    const textFragmentById = new Map();
    const restoredShareIds = new Set();

    const getSelectionContext = range => {
        try {
            const before = document.createRange();
            before.selectNodeContents(document.body);
            before.setEnd(range.startContainer, range.startOffset);

            const after = document.createRange();
            after.selectNodeContents(document.body);
            after.setStart(range.endContainer, range.endOffset);

            const fullPrefix = before.toString();
            const fullSuffix = after.toString();
            const prefixText = fullPrefix.slice(-QUOTE_CONTEXT_LENGTH);
            const suffixText = fullSuffix.slice(0, QUOTE_CONTEXT_LENGTH);
            const prefixBoundary = prefixText.search(/\s/);
            const suffixBoundary = suffixText.search(/\s[^\s]*$/);

            return {
                prefix: (
                    prefixBoundary < 0
                        ? fullPrefix.length > QUOTE_CONTEXT_LENGTH ? '' : prefixText
                        : prefixText.slice(prefixBoundary)
                ).trim(),
                suffix: (
                    suffixBoundary < 0
                        ? fullSuffix.length > QUOTE_CONTEXT_LENGTH ? '' : suffixText
                        : suffixText.slice(0, suffixBoundary)
                ).trim(),
            };
        }
        catch {
            return { prefix: '', suffix: '' };
        }
    };

    const getTextIndex = () => {
        const entries = [];
        const parts = [];
        let offset = 0;
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: node => {
                const parent = node.parentElement;
                return parent && !parent.closest('script, style, noscript, template, textarea, input, button, select, option, [hidden], [aria-hidden="true"]')
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_REJECT;
            },
        });

        let node;
        while ((node = walker.nextNode())) {
            const text = node.nodeValue || '';
            if (!text) {
                continue;
            }

            entries.push({ node, start: offset, end: offset + text.length });
            parts.push(text);
            offset += text.length;
        }

        return { text: parts.join(''), entries };
    };

    const commonPrefixLength = (first, second) => {
        let length = 0;
        while (length < first.length && length < second.length && first[length] === second[length]) {
            length += 1;
        }
        return length;
    };

    const commonSuffixLength = (first, second) => {
        let length = 0;
        while (
            length < first.length &&
            length < second.length &&
            first[first.length - length - 1] === second[second.length - length - 1]
        ) {
            length += 1;
        }
        return length;
    };

    // The text fragment grammar uses hyphens to separate prefix/suffix from
    // the matched text. encodeURIComponent leaves hyphens untouched, so
    // escape them explicitly to keep page text from changing the grammar.
    const encodeTextFragmentPart = text => encodeURIComponent(text)
        .replace(/-/g, '%2D')
        .replace(/'/g, '%27');

    const isTextFragment = fragment =>
        fragment &&
        typeof fragment.textStart === 'string' &&
        fragment.textStart.length > 0 &&
        ['textEnd', 'prefix', 'suffix'].every(key =>
            fragment[key] == null || typeof fragment[key] === 'string',
        );

    const generateTextFragment = range => {
        if (!range) {
            return null;
        }

        const result = generateFragmentFromRange(range.cloneRange());
        return result?.status === GenerateFragmentStatus.SUCCESS && isTextFragment(result.fragment)
            ? result.fragment
            : null;
    };

    const formatTextDirective = fragment => {
        const prefix = fragment.prefix ? `${encodeTextFragmentPart(fragment.prefix)}-,` : '';
        const end = fragment.textEnd ? `,${encodeTextFragmentPart(fragment.textEnd)}` : '';
        const suffix = fragment.suffix ? `,-${encodeTextFragmentPart(fragment.suffix)}` : '';

        return `text=${prefix}${encodeTextFragmentPart(fragment.textStart)}${end}${suffix}`;
    };

    const findTextPoint = (index, offset, preferPrevious) => {
        const entry = preferPrevious
            ? index.entries.find(item => offset > item.start && offset <= item.end)
            : index.entries.find(item => offset >= item.start && offset < item.end);

        if (entry) {
            return { node: entry.node, offset: offset - entry.start };
        }

        if (offset === 0 && index.entries.length) {
            return { node: index.entries[0].node, offset: 0 };
        }

        if (offset === index.text.length && index.entries.length) {
            const last = index.entries[index.entries.length - 1];
            return { node: last.node, offset: last.end - last.start };
        }

        return null;
    };

    const findQuoteRange = (text, quote = {}) => {
        if (!text) {
            return null;
        }

        const index = getTextIndex();
        const prefix = typeof quote.prefix === 'string' ? quote.prefix : '';
        const suffix = typeof quote.suffix === 'string' ? quote.suffix : '';
        let candidate = -1;
        let bestScore = -1;
        let tied = false;
        let offset = index.text.indexOf(text);

        while (offset !== -1) {
            const before = index.text.slice(Math.max(0, offset - prefix.length), offset);
            const after = index.text.slice(offset + text.length, offset + text.length + suffix.length);
            const score = commonSuffixLength(prefix, before) + commonPrefixLength(suffix, after);

            if (score > bestScore) {
                candidate = offset;
                bestScore = score;
                tied = false;
            }
            else if (score === bestScore) {
                tied = true;
            }

            offset = index.text.indexOf(text, offset + 1);
        }

        if (candidate < 0 || tied) {
            return null;
        }

        const start = findTextPoint(index, candidate, false);
        const end = findTextPoint(index, candidate + text.length, true);
        if (!start || !end) {
            return null;
        }

        const range = document.createRange();
        range.setStart(start.node, start.offset);
        range.setEnd(end.node, end.offset);

        return range;
    };

    const serializeSource = source => ({
        startMeta: source.startMeta,
        endMeta: source.endMeta,
        text: source.text,
        id: source.id,
        ...(typeof source.extra === 'undefined' ? {} : { extra: source.extra }),
    });

    const renderedTextFor = id => highlighter.getDoms(id).map(node => node.textContent || '').join('');

    const restoreFromMetadata = source => {
        const restored = highlighter.fromStore(source.startMeta, source.endMeta, source.text, source.id, source.extra);
        if (!restored) {
            return false;
        }

        if (renderedTextFor(source.id) === source.text) {
            return true;
        }

        highlighter.remove(source.id);
        return false;
    };

    const rememberRestoredContext = (id, source, quote, textFragment, range = null) => {
        const safeQuote = quote || { prefix: '', suffix: '' };
        quoteContextById.set(id, safeQuote);

        const resolvedFragment = isTextFragment(textFragment)
            ? textFragment
            : generateTextFragment(range || findQuoteRange(source.text, safeQuote));

        if (resolvedFragment) {
            textFragmentById.set(id, resolvedFragment);
        }
        else {
            textFragmentById.delete(id);
        }
    };

    const readSharedPayload = () => {
        // Chromium removes text-fragment directives from most script-visible
        // URL APIs. Strip it explicitly as well so the payload remains
        // readable in browsers that expose the complete hash.
        const fragment = window.location.hash.slice(1).split(':~:')[0];
        const encoded = new URLSearchParams(fragment).get(SHARE_KEY);

        if (!encoded) {
            return null;
        }

        try {
            const payload = JSON.parse(encoded);

            if (payload?.version === 1 && isSharedSource(payload.source)) {
                return {
                    version: 1,
                    highlights: [{
                        source: payload.source,
                        quote: payload.quote || {},
                        textFragment: isTextFragment(payload.textFragment) ? payload.textFragment : null,
                    }],
                    originalFragment: payload.originalFragment,
                };
            }

            if (
                payload?.version === SHARE_VERSION &&
                Array.isArray(payload.highlights) &&
                payload.highlights.length > 0 &&
                payload.highlights.every(item =>
                    item &&
                    isSharedSource(item.source) &&
                    (item.textFragment == null || isTextFragment(item.textFragment)),
                )
            ) {
                return payload;
            }

            return null;
        }
        catch {
            return null;
        }
    };

    const scrollToOriginalFragment = fragment => {
        if (!fragment) {
            return;
        }

        let anchor = fragment;
        try {
            anchor = decodeURIComponent(fragment.replace(/^#/, ''));
        }
        catch {
            anchor = fragment.replace(/^#/, '');
        }

        const target = document.getElementById(anchor) || document.getElementsByName(anchor)[0];
        target?.scrollIntoView();
    };

    const highlightSelection = expectedText => {
        const selection = window.getSelection();
        const range = selection && !selection.isCollapsed && selection.rangeCount > 0
            ? selection.getRangeAt(0)
            : expectedText
              ? findQuoteRange(expectedText)
              : null;

        if (!range) {
            return { ok: false, message: 'Select text on the webpage, then right-click and choose Highlight selection.' };
        }

        const fallbackQuote = getSelectionContext(range);
        const textFragment = generateTextFragment(range);
        const quote = textFragment
            ? { prefix: textFragment.prefix || '', suffix: textFragment.suffix || '' }
            : fallbackQuote;
        const source = highlighter.fromRange(range, { selection: 'clear' });

        if (!source) {
            return { ok: false, message: 'The selected text could not be highlighted on this page.' };
        }

        quoteContextById.set(source.id, quote);
        if (textFragment) {
            textFragmentById.set(source.id, textFragment);
        }
        else {
            textFragmentById.delete(source.id);
        }
        return { ok: true, message: 'Text highlighted.' };
    };

    const createShareLink = () => {
        const sources = highlighter.cache.getAll();
        if (sources.length === 0) {
            return { ok: false, message: 'Right-click selected text and choose Highlight selection first.' };
        }

        const url = new URL(window.location.href);
        const existingFragment = url.hash.slice(1).split(':~:')[0];
        const existingFragmentParams = new URLSearchParams(existingFragment);
        const originalFragment = existingFragmentParams.has(SHARE_KEY) ? '' : existingFragment;

        const textFragments = sources.map(source => textFragmentById.get(source.id));
        if (textFragments.some(fragment => !isTextFragment(fragment))) {
            return {
                ok: false,
                message: 'A unique browser highlight could not be created for one or more selections. Select a longer phrase and highlight it again.',
            };
        }

        const textDirectives = textFragments.map(formatTextDirective);
        const payload = {
            version: SHARE_VERSION,
            originalFragment,
            highlights: sources.map((source, index) => ({
                source: serializeSource(source),
                quote: quoteContextById.get(source.id) || { prefix: '', suffix: '' },
                textFragment: textFragments[index],
            })),
        };
        const payloadFragment = new URLSearchParams({ [SHARE_KEY]: JSON.stringify(payload) }).toString();

        // Keep extension restore data in the regular fragment, where the
        // extension can read it, and native text directives after :~:.
        url.hash = `${payloadFragment}:~:${textDirectives.join('&')}`;

        return { ok: true, url: url.toString() };
    };

    const restoreSharedHighlights = () => {
        const payload = readSharedPayload();

        if (!payload) {
            return { ok: false, reason: 'no-share', message: 'No shared highlight data found in this link.' };
        }

        let restoredCount = 0;
        let failureCount = 0;

        payload.highlights.forEach(({ source, quote, textFragment }) => {
            if (restoredShareIds.has(source.id)) {
                restoredCount += 1;
                return;
            }

            if (highlighter.cache.get(source.id) && renderedTextFor(source.id) === source.text) {
                rememberRestoredContext(source.id, source, quote, textFragment);
                restoredShareIds.add(source.id);
                restoredCount += 1;
                return;
            }

            if (restoreFromMetadata(source)) {
                rememberRestoredContext(source.id, source, quote, textFragment);
                restoredShareIds.add(source.id);
                restoredCount += 1;
                return;
            }

            const range = findQuoteRange(source.text, quote);
            const fallback = range && highlighter.fromRange(range, { selection: 'keep' });
            if (!fallback) {
                failureCount += 1;
                return;
            }

            rememberRestoredContext(fallback.id, source, quote, textFragment, range);
            restoredShareIds.add(source.id);
            restoredCount += 1;
        });

        if (restoredCount > 0) {
            scrollToOriginalFragment(payload.originalFragment);
        }

        if (failureCount > 0) {
            return {
                ok: restoredCount > 0,
                reason: 'partial-restore',
                message: `Restored ${restoredCount} of ${payload.highlights.length} highlights; ${failureCount} could not be found.`,
            };
        }

        return { ok: restoredCount > 0, message: `Restored ${restoredCount} highlight(s) on this page.` };
    };

    window[API_KEY] = {
        version: API_VERSION,
        highlightSelection,
        createShareLink,
        restoreSharedHighlights,
    };
}
