# ext-corb-workaround

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Macil/ext-corb-workaround/blob/master/LICENSE.txt) [![npm version](https://badge.fury.io/js/ext-corb-workaround.svg)](https://badge.fury.io/js/ext-corb-workaround) [![CI](https://github.com/Macil/ext-corb-workaround/workflows/CI/badge.svg)](https://github.com/Macil/ext-corb-workaround/actions?query=workflow%3ACI+branch%3Amaster)

This package is a work-around for a bug with Cross-Origin Request Blocking (CORB) as implemented in Chrome extensions.

According to https://www.chromium.org/Home/chromium-security/extension-content-script-fetches, "content scripts should be subject to the same request rules as the page they are running within", but currently Chrome blocks requests from content scripts if the extension has permissions to the requested domain, regardless of whether the page it's running within also has permissions to the requested domain because of CORS.

In order to work around this issue, this package allows creating a replacement `XMLHttpRequest` object for a content script to use which proxies its connections through the page's context, so the request is treated exactly as a request from the parent page instead of from the extension.

Because this proxies the connection through the web page's javascript context, it is possible for the web page to modify the content of the request. **This package should only be used by extensions that trust the web page the content script is running in.** This makes this package a good fit for an extension that adds features to one specific site. It is not recommended to use this package in a content script that executes inside all web pages.

**If possible, follow the recommendations inside the ["Recommended Developer Actions" section of Chrome's CORB/extension documentation](https://www.chromium.org/Home/chromium-security/extension-content-script-fetches#TOC-Recommended-Developer-Actions) instead of using this package.** This package should only be used where you specifically want the request to run as if it came from the content script's page rather than as the extension.

## API

This library exports two functions:

### getXMLHttpRequest(): typeof XMLHttpRequest

This function returns an XMLHttpRequest-like object which can be used like XMLHttpRequest, but with all of its requests proxied through the page's context.

Usage example:

```js
import { getXMLHttpRequest } from 'ext-corb-workaround';

function getWithCorbWorkaround(url) {
  return new Promise((resolve, reject) => {
    const XMLHttpRequest = getXMLHttpRequest();
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('loadend', () => {
      if (xhr.status !== 200) {
        reject(new Error(`Error fetching: ${xhr.statusText}`));
      } else {
        resolve(xhr.responseText);
      }
    });
    xhr.open('GET', url);
    xhr.send();
  });
}
```

### installGlobally(): void

This is a convenience function which replaces `window.XMLHttpRequest` with the value returned by `getXMLHttpRequest()`. This may be useful for an extension content script that wants to globally opt into proxying its connections through the page.

## Types

[TypeScript](https://www.typescriptlang.org/) type definitions for this module are included.
