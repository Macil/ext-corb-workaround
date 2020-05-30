import once from 'lodash/once';
import { pageWorldScript } from './pageWorldScript';
import transferrables from './transferrables';

export const getXMLHttpRequest: () => typeof XMLHttpRequest = once(() => {
  // Make sure we communicate to the injected script that's paired with
  // this instance of this module. This is necessary in case there are
  // multiple javascript bundles with this package executing at once in the
  // same page.
  const moduleId = Math.random() + '-' + Date.now();

  const scr = document.createElement('script');
  scr.textContent = pageWorldScript(moduleId);
  document.documentElement.appendChild(scr).remove();

  const instancesById: { [id: number]: CORBWorkaroundXMLHttpRequest } = {};

  const channel = new MessageChannel();
  const port = channel.port1;
  port.addEventListener('message', event => {
    const { id, type } = event.data;
    const xhr = instancesById[id];
    switch (type) {
      case 'COMPLETE': {
        const {
          headers,
          readyState,
          status,
          statusText,
          response,
          responseText,
          responseURL
        } = event.data;
        const headersObj: { [header: string]: string } = {};
        headers.split('\r\n').forEach((line: string) => {
          const [name, value] = line.split(':');
          if (name && value) {
            headersObj[name.toLowerCase().trim()] = value.trim();
          }
        });
        xhr._headers = headers;
        xhr._headersObj = headersObj;
        xhr.status = status;
        xhr.statusText = statusText;
        xhr.readyState = readyState;
        xhr.response = response;
        xhr.responseText = responseText;
        xhr.responseURL = responseURL;
        delete instancesById[id];

        for (const event of ['load', 'loadend', 'readystatechange']) {
          const eventObj = { name: event, target: xhr };
          const handlers = Object.prototype.hasOwnProperty.call(
            xhr._eventListeners,
            event
          )
            ? xhr._eventListeners[event]
            : [];
          handlers.forEach(handler => handler(eventObj));
          if ((xhr as any)['on' + event]) {
            (xhr as any)['on' + event](eventObj);
          }
        }
        break;
      }
      default: {
        // eslint-disable-next-line no-console
        console.error(
          'ext-corb-workaround: Unknown event in content script:',
          event
        );
      }
    }
  });
  port.addEventListener('messageerror', event => {
    // eslint-disable-next-line no-console
    console.error(
      'ext-corb-workaround: Unknown error in content script:',
      event
    );
  });
  port.start();
  window.postMessage(
    { type: 'ext-corb-workaround_port', moduleId, port: channel.port2 },
    document.location.origin,
    [channel.port2]
  );

  let nextFreeId = 0;
  class CORBWorkaroundXMLHttpRequest {
    public static UNSENT = 0;
    public static OPENED = 1;
    public static HEADERS_RECEIVED = 2;
    public static LOADING = 3;
    public static DONE = 4;

    public UNSENT = 0;
    public OPENED = 1;
    public HEADERS_RECEIVED = 2;
    public LOADING = 3;
    public DONE = 4;

    private _id = nextFreeId++;
    public _eventListeners: { [name: string]: Function[] } = {};
    public _headersObj: { [name: string]: string } = {};

    public status = 0;
    public statusText = '';
    public readyState = 0;
    public response = '';
    public responseText = '';
    public responseURL = '';
    public _headers = '';

    public responseType: any;
    public withCredentials: any;

    public setRequestHeader: any;
    public open: any;
    public send: any;
    public abort: any;

    public constructor() {
      const id = this._id;
      instancesById[id] = this;
      port.postMessage({ type: 'NEW_XHR', id });
      for (const prop of ['responseType', 'withCredentials'] as const) {
        let value: any = undefined;
        Object.defineProperty(this, prop, {
          get() {
            return value;
          },
          set(newValue) {
            value = newValue;
            port.postMessage({ type: 'SET', id, prop, value: newValue });
          }
        });
      }
      for (const method of [
        'setRequestHeader',
        'open',
        'send',
        'abort'
      ] as const) {
        this[method] = (...args: any[]) => {
          port.postMessage(
            { type: 'CALL', id, method, args },
            transferrables(args)
          );
        };
      }
    }
    public getAllResponseHeaders(): string {
      return this._headers;
    }
    public getResponseHeader(header: string): string | void {
      header = header.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(this._headersObj, header)) {
        return this._headersObj[header];
      }
    }
    public addEventListener(event: string, handler: Function) {
      if (!Object.prototype.hasOwnProperty.call(this._eventListeners, event)) {
        this._eventListeners[event] = [];
      }
      this._eventListeners[event].push(handler);
    }
    public removeEventListener(event: string, handler: Function) {
      if (Object.prototype.hasOwnProperty.call(this._eventListeners, event)) {
        this._eventListeners[event] = this._eventListeners[event].filter(
          _handler => handler !== _handler
        );
      }
    }
  }
  return (CORBWorkaroundXMLHttpRequest as any) as typeof XMLHttpRequest;
});

// TODO add replacement fetch too?

export const installGlobally = once((): void => {
  window.XMLHttpRequest = getXMLHttpRequest();
});
