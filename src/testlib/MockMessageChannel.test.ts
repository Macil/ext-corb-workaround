import { MockMessageChannel } from './MockMessageChannel';

test('works', async () => {
  const { port1, port2 } = new MockMessageChannel();
  const port1Handler = jest.fn();
  const port2Handler = jest.fn();
  port1.onmessage = port1Handler;
  port2.addEventListener('message', port2Handler);

  port1.postMessage('hiiii to port 2');
  port1.postMessage('hiiii to port 2 again');
  port2.postMessage('hiiii to port 1');

  await new Promise(resolve => setTimeout(resolve, 1));

  expect(port1Handler.mock.calls).toEqual([
    [
      expect.objectContaining({
        type: 'message',
        data: 'hiiii to port 1'
      })
    ]
  ]);
  expect(port2Handler.mock.calls).toEqual([]);
  port2.start();
  expect(port2Handler.mock.calls).toEqual([]);
  await new Promise(resolve => setTimeout(resolve, 1));
  expect(port1Handler.mock.calls).toHaveLength(1);
  expect(port2Handler.mock.calls).toEqual([
    [
      expect.objectContaining({
        type: 'message',
        data: 'hiiii to port 2'
      })
    ],
    [
      expect.objectContaining({
        type: 'message',
        data: 'hiiii to port 2 again'
      })
    ]
  ]);

  port2.postMessage('hiiii to port 1 again');
  expect(port1Handler.mock.calls).toHaveLength(1);
  await new Promise(resolve => setTimeout(resolve, 1));
  expect(port1Handler.mock.calls[1]).toEqual([
    expect.objectContaining({
      type: 'message',
      data: 'hiiii to port 1 again'
    })
  ]);
});
