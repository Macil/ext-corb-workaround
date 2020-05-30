// content only gets executed in injected script in page's world
export const pageWorldScript = (moduleId: string) =>
  '(' +
  `
function pageWorldScript(moduleId) {
  'use strict';

  // save a reference to XHR so we use the original instead of any replacements that extensions may place.
  const XMLHttpRequest = window.XMLHttpRequest;

  // should match transferrables.ts
  function transferrables(list) {
    return list
      .map(value => {
        if (value && typeof value === 'object' && value.__proto__) {
          if (value.__proto__.constructor.name === 'ArrayBuffer') {
            return value;
          }
          if (
            value.__proto__.__proto__ &&
            value.__proto__.__proto__.constructor.name === 'TypedArray'
          ) {
            return value.buffer;
          }
        }
      })
      .filter(Boolean);
  }

  function handler(event) {
    if (
      !event.data ||
      event.data.type !== 'ext-corb-workaround_port' ||
      event.data.moduleId !== moduleId
    ) {
      return;
    }

    window.removeEventListener('message', handler);
    const port = event.data.port;
    const instancesById = {};
    port.addEventListener('message', event => {
      const {id} = event.data;
      switch (event.data.type) {
        case 'NEW_XHR': {
          const xhr = (instancesById[id] = new XMLHttpRequest());
          xhr.addEventListener('readystatechange', () => {
            if (xhr.readyState !== 4) {
              return;
            }
            delete instancesById[id];
            let responseText;
            try {
              responseText = xhr.responseText;
            } catch (err) {
              // ignore
            }
            port.postMessage(
              {
                type: 'COMPLETE',
                id,
                headers: xhr.getAllResponseHeaders(),
                readyState: xhr.readyState,
                status: xhr.status,
                statusText: xhr.statusText,
                responseURL: xhr.responseURL,
                response: xhr.response,
                responseText
              },
              transferrables([xhr.response])
            );
          });
          break;
        }
        case 'SET': {
          const {prop, value} = event.data;
          instancesById[id][prop] = value;
          break;
        }
        case 'CALL': {
          const {method, args} = event.data;
          // Let abort calls silently fail if the XHR isn't present.
          if (method === 'abort' && !instancesById[id]) {
            break;
          }
          instancesById[id][method](...args);
          break;
        }
        default: {
          // eslint-disable-next-line no-console
          console.error('ext-corb-workaround: Unknown event in page world:', event);
        }
      }
    });
    port.addEventListener('messageerror', event => {
      // eslint-disable-next-line no-console
      console.error('ext-corb-workaround: Unknown error in page world:', event);
    });
    port.start();
  }
  window.addEventListener('message', handler);
}
` +
  `)(${JSON.stringify(
    moduleId
  )}); //# sourceURL=npm://ext-corb-workaround/pageWorldScript.js`;
