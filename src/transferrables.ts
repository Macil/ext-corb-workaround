// should match transferrables function in pageWorldScript.ts
export default function transferrables(list: any[]): any[] {
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
