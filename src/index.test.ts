import { MockMessageChannel } from './testlib/MockMessageChannel';

const originalXMLHttpRequest = window.XMLHttpRequest;
window.MessageChannel = MockMessageChannel;

/* eslint-disable @typescript-eslint/no-var-requires */

test('works', async () => {
  const corbWorkaround = require('./');
  const XMLHttpRequest = corbWorkaround.getXMLHttpRequest();
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
