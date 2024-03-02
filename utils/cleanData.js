const { getChunks } = require('./getChunks');

const createBaseObject = (start, end) => {
  return Array.from({ length: end - start + 1 }, (_, i) => i + start).reduce(
    (acc, cur) => {
      acc[cur] = {};
      return acc;
    },
    {}
  );
};

exports.cleanData = (arr, backNine) => {
  const chunks = getChunks(arr, 10);
  const baseObj = backNine ? createBaseObject(10, 18) : createBaseObject(1, 9);

  return chunks.reduce((acc, row) => {
    row.forEach((el, i) => {
      if (i === 0) {
        Object.keys(acc).forEach((key) => {
          acc[key][el] = {};
        });
      } else {
        const key = backNine ? i + 9 : i;
        acc[key][row[0]] = el;
      }
    });
    return acc;
  }, baseObj);
};

// const cleanData = (arr, backNine) => {
//   const chunks = getChunks(arr, 10);
//   const baseObj = {};

//   // Use a for-of loop instead of a traditional for loop
//   for (const [i, row] of chunks.entries()) {
//     if (i === 0) {
//       // Use a for-of loop instead of Object.keys()
//       for (const key of Object.keys(baseObj)) {
//         baseObj[key] = { ...baseObj[key], [row[0]]: {} };
//       }
//     } else {
//       // Use a ternary operator instead of an if-else statement
//       const index = backNine ? i + 9 : i;
//       baseObj[index][row[0]] = row[1];
//     }
//   }

//   return baseObj;
// };
