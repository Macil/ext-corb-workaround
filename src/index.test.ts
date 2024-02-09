import { MockMessageChannel } from './testlib/MockMessageChannel';

const originalXMLHttpRequest = window.XMLHttpRequest;
window.MessageChannel = MockMessageChannel;

import { init } from './pageWorld';
import * as extCorbWorkaroundType from './';
function loadNewInstance(): typeof extCorbWorkaroundType {
  let result: any;
  jest.isolateModules(() => {
    result = require('./');
  });
  init();
  return result;
}

test('works', async () => {
  const extCorbWorkaround = loadNewInstance();
  const XMLHttpRequest = extCorbWorkaround.getXMLHttpRequest();
  expect(XMLHttpRequest).not.toBe(originalXMLHttpRequest);
  const xhr = new XMLHttpRequest();
  await new Promise((resolve, reject) => {
    xhr.onload = resolve;
    xhr.onerror = reject;
    xhr.open('GET', 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D');
    xhr.send();
  });
  expect(xhr.status).toBe(200);
  expect(xhr.response).toBe('Hello, World!');
});

test('works with two simultaneously', async () => {
  const extCorbWorkaround1 = loadNewInstance();
  const extCorbWorkaround2 = loadNewInstance();
  const XMLHttpRequest1 = extCorbWorkaround1.getXMLHttpRequest();
  const XMLHttpRequest2 = extCorbWorkaround2.getXMLHttpRequest();
  expect(XMLHttpRequest1).not.toBe(originalXMLHttpRequest);
  expect(XMLHttpRequest2).not.toBe(originalXMLHttpRequest);
  expect(XMLHttpRequest2).not.toBe(XMLHttpRequest1);

  {
    const xhr = new XMLHttpRequest1();
    await new Promise((resolve, reject) => {
      xhr.onload = resolve;
      xhr.onerror = reject;
      xhr.open('GET', 'data:,Hello%2C%20World%201');
      xhr.send();
    });
    expect(xhr.status).toBe(200);
    expect(xhr.response).toBe('Hello, World 1');
  }

  {
    const xhr = new XMLHttpRequest2();
    await new Promise((resolve, reject) => {
      xhr.onload = resolve;
      xhr.onerror = reject;
      xhr.open('GET', 'data:,Hello%2C%20World%202');
      xhr.send();
    });
    expect(xhr.status).toBe(200);
    expect(xhr.response).toBe('Hello, World 2');
  }
});
