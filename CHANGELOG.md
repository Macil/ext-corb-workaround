## 2.0.0 (2021-12-30)

Breaking change: in order to support Chrome extension manifest version 3, this library no longer handles injecting a page world script itself. You must set up a page world script yourself and load the "ext-corb-workaround/pageWorld" module into it.

## 1.0.2 (2020-05-29)

- Added the `statusText` property to the wrapped XMLHttpRequest object.

## 1.0.1 (2020-02-07)

- Fixed error that happened when multiple javascript bundles using this library were executed on a page at once. The different library instances could attempt to talk to each other's injected code.

## 1.0.0 (2020-02-03)

Initial stable release.
