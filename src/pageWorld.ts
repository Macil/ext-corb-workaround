// must be executed in page's world

import transferrables from './transferrables';
import { moduleId } from './moduleId';

export function init() {
  // save a reference to XHR so we use the original instead of any replacements that extensions may place.
  const XMLHttpRequest = window.XMLHttpRequest;

  function handler(event: MessageEvent) {
    if (
      !event.data ||
      event.data.type !== 'ext-corb-workaround_port' ||
      event.data.moduleId !== moduleId ||
      (event as any).__ext_claimed
    ) {
      return;
    }

    (event as any).__ext_claimed = true;
    window.removeEventListener('message', handler);

    const port = event.data.port;
    const instancesById: { [id: number]: XMLHttpRequest } = {};
    port.addEventListener('message', (event: MessageEvent) => {
      const { id } = event.data;
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
                responseText,
              },
              transferrables([xhr.response])
            );
          });
          break;
        }
        case 'SET': {
          const { prop, value } = event.data;
          (instancesById[id] as any)[prop] = value;
          break;
        }
        case 'CALL': {
          const { method, args } = event.data;
          // Let abort calls silently fail if the XHR isn't present.
          if (method === 'abort' && !instancesById[id]) {
            break;
          }
          (instancesById[id] as any)[method](...args);
          break;
        }
        default: {
          // eslint-disable-next-line no-console
          console.error(
            'ext-corb-workaround: Unknown event in page world:',
            event
          );
        }
      }
    });
    port.addEventListener('messageerror', (event: Event) => {
      // eslint-disable-next-line no-console
      console.error('ext-corb-workaround: Unknown error in page world:', event);
    });
    port.start();
  }
  window.addEventListener('message', handler);
}
