# Local URL Cleaner

A small browser tool that removes a documented set of common tracking parameters before you share a link. It processes the URL in your browser and does not send or save it.

## Use

Open `index.html` in a recent desktop or mobile browser, paste one complete HTTP or HTTPS URL, and choose **Clean URL**. Review the cleaned link and removed parameter names, then use **Copy cleaned URL**. If clipboard access is unavailable, the cleaned URL is selected so you can copy it with your keyboard shortcut.

## What it removes

- Any decoded query parameter name beginning with `utm_` and at least one character after the underscore, such as `utm_source`, `utm_medium`, and `utm_campaign`.
- The exact, case-insensitive names `gclid`, `dclid`, `gbraid`, `wbraid`, `fbclid`, `msclkid`, `mc_cid`, and `mc_eid`.

Repeated instances of supported tracking parameters are all removed and counted. Unknown parameter names and values are retained in their original order and encoding. URL fragments are retained. A key is decoded only to decide whether it matches a listed rule; kept query text is not decoded or re-serialized.

## Privacy and limits

All processing happens in the page. The app has no server, analytics, telemetry, external API, or runtime network dependency. The page uses local scripts and does not submit the form. It supports one absolute HTTP or HTTPS URL at a time. It does not follow redirects, inspect destination pages, shorten links, or remove unknown or site-specific parameters. Some parameters that resemble tracking keys may be meaningful on a particular site; review the result before sharing. Clipboard access depends on browser permissions; the app provides a manual copy fallback.

## Development

Run the tests with Node.js; there are no package dependencies:

```text
node --test tests/core.test.cjs
```

## License

[MIT License](LICENSE).
