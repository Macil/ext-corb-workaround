import remove from 'lodash/remove';

type EventHandler = (event: any) => void;

export class MockMessagePort implements MessagePort {
  private eventListeners = new Map<string, EventHandler[]>();
  private startEventBuffer: Array<any> | null = [];
  private closed = false;
  private getOther: () => MockMessagePort;

  constructor(getOther: () => MockMessagePort) {
    this.getOther = getOther;
  }

  private _onmessage:
    | ((this: MessagePort, ev: MessageEvent) => any)
    | null = null;
  set onmessage(value: ((this: MessagePort, ev: MessageEvent) => any) | null) {
    this._onmessage = value;
    this.start();
  }
  get onmessage() {
    return this._onmessage;
  }
  onmessageerror: ((this: MessagePort, ev: MessageEvent) => any) | null = null;
  close(): void {
    this.closed = true;
    this.startEventBuffer = null;
  }
  postMessage(message: any, _options?: any) {
    Promise.resolve().then(() => {
      const other = this.getOther();
      if (!other.closed) {
        const event: any = {
          type: 'message',
          data: message,
          defaultPrevented: false,
          preventDefault() {
            this.defaultPrevented = true;
          },
        };
        if (other.startEventBuffer) {
          other.startEventBuffer.push(event);
        } else {
          other.dispatchEvent(event);
        }
      }
    });
  }
  start(): void {
    Promise.resolve().then(() => {
      const existingStartEventBuffer = this.startEventBuffer;
      this.startEventBuffer = null;
      if (existingStartEventBuffer) {
        existingStartEventBuffer.forEach(event => this.dispatchEvent(event));
      }
    });
  }
  addEventListener(type: any, listener: EventHandler, _options?: any) {
    const existingList = this.eventListeners.get(type);
    if (existingList) {
      existingList.push(listener);
    } else {
      this.eventListeners.set(type, [listener]);
    }
  }
  removeEventListener(type: any, listener: EventHandler, _options?: any) {
    const existingList = this.eventListeners.get(type);
    if (existingList) {
      remove(existingList, listener);
    }
  }
  dispatchEvent(event: Event): boolean {
    const existingList = this.eventListeners.get(event.type);
    if (existingList) {
      existingList.forEach(listener => listener.call(this, event));
    }
    switch (event.type) {
      case 'message':
        this._onmessage?.call(this, event as MessageEvent);
        break;
      case 'messageerror':
        this.onmessageerror?.call(this, event as MessageEvent);
        break;
    }
    return !event.defaultPrevented;
  }
}

export class MockMessageChannel implements MessageChannel {
  port1: MockMessagePort;
  port2: MockMessagePort;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const port1: MockMessagePort = new MockMessagePort(() => port2);
    const port2: MockMessagePort = new MockMessagePort(() => port1);
    this.port1 = port1;
    this.port2 = port2;
  }
}
