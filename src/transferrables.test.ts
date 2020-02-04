import transferrables from './transferrables';

test('primitives', () => {
  expect(transferrables([5, 'a', null, undefined])).toHaveLength(0);
});

test('transferrables', () => {
  const ab = new ArrayBuffer(47);
  const ta = new Uint16Array(13);

  {
    const r = transferrables([ab]);
    expect(r).toHaveLength(1);
    expect(r[0]).toBe(ab);
  }

  {
    const r = transferrables([ab, 5, ta]);
    expect(r).toHaveLength(2);
    expect(r[0]).toBe(ab);
    expect(r[1]).toBe(ta.buffer);
  }
});
