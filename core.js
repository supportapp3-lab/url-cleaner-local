(function (root) {
  "use strict";

  const KNOWN_TRACKING_KEYS = new Set([
    "gclid", "dclid", "gbraid", "wbraid", "fbclid", "msclkid", "mc_cid", "mc_eid"
  ]);

  function isTrackingKey(key) {
    const normalized = key.toLowerCase();
    return (normalized.startsWith("utm_") && normalized.length > 4) || KNOWN_TRACKING_KEYS.has(normalized);
  }

  function decodedParameterName(segment) {
    const equalsAt = segment.indexOf("=");
    const rawName = equalsAt === -1 ? segment : segment.slice(0, equalsAt);
    try {
      return decodeURIComponent(rawName.replace(/\+/g, " "));
    } catch {
      return null;
    }
  }

  function cleanUrl(input) {
    if (typeof input !== "string" || input.trim() === "") {
      throw new TypeError("Enter an HTTP or HTTPS URL.");
    }

    const source = input.trim();
    if (/[\u0000-\u0020\u007f]/.test(source)) {
      throw new TypeError("The URL contains whitespace or control characters. Remove them or encode spaces first.");
    }

    let parsed;
    try {
      parsed = new URL(source);
    } catch {
      throw new TypeError("Enter a complete, valid HTTP or HTTPS URL.");
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new TypeError("Only HTTP and HTTPS URLs are supported.");
    }

    const fragmentAt = source.indexOf("#");
    const beforeFragment = fragmentAt === -1 ? source : source.slice(0, fragmentAt);
    const fragment = fragmentAt === -1 ? "" : source.slice(fragmentAt);
    const queryAt = beforeFragment.indexOf("?");
    if (queryAt === -1) {
      return { cleanedUrl: source, removedParameters: [] };
    }

    const prefix = beforeFragment.slice(0, queryAt);
    const segments = beforeFragment.slice(queryAt + 1).split("&");
    const kept = [];
    const removedParameters = [];

    for (const segment of segments) {
      const name = decodedParameterName(segment);
      if (name !== null && isTrackingKey(name)) {
        removedParameters.push(name);
      } else {
        kept.push(segment);
      }
    }

    const query = removedParameters.length === 0 || kept.length > 0 ? `?${kept.join("&")}` : "";
    return { cleanedUrl: `${prefix}${query}${fragment}`, removedParameters };
  }

  const api = Object.freeze({ cleanUrl });
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.UrlCleanerCore = api;
})(globalThis);
