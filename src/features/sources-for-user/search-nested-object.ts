/** Search if at least one value in the object matches the regex */
export const searchNestedObject = (value: unknown, searchRegex: RegExp): boolean => {
  switch (typeof value) {
    case "string": {
      if (searchRegex.test(value)) {
        return true;
      }

      break;
    }

    case "object": {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (searchNestedObject(item, searchRegex)) {
            return true;
          }
        }
      } else if (value !== null) {
        for (const key in value) {
          const v = Reflect.get(value, key);

          if (searchNestedObject(v, searchRegex)) {
            return true;
          }
        }
      }

      break;
    }

    default:
      break;
  }

  return false;
};
