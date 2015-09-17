// A data structure provides:
// O(1) get(key), put(key, item), del(key), count()
// O(N) forEach((item, key) => {})
export default function indexedList() {
  const itemsByKey = {};
  let count = 0;
  return {
    get: (key) => itemsByKey[key],
    put: (key, item) => {
      if (typeof itemsByKey[key] === 'undefined') {
        count = count + 1;
      }
      itemsByKey[key] = item;
    },
    del: (key) => {
      if (typeof itemsByKey[key] !== 'undefined') {
        count = count - 1;
      }
      delete itemsByKey[key];
    },
    count: () => count,
    forEach: (iterator) => {
      Object.keys(itemsByKey).forEach((key) => {
        const item = itemsByKey[key];
        iterator(item, key);
      });
    }
  };
}
