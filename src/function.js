/*function jsonSafeParse(obj) {
  if (typeof obj === "string") {
    try {
      return JSON.parse(obj);
    } catch (err) {
      return obj;
    }
  } else if (typeof obj === "object") {
    for (const i in obj) {
      obj[i] = jsonSafeParse(obj[i]);
    }
    return obj;
  } else {
    return obj;
  }
}*/
function jsonSafeParse(obj) {
  if (typeof obj === "string") {
    try {
      const parsed = JSON.parse(obj, (key, value) => {
        // Convert numbers larger than MAX_SAFE_INTEGER to strings
        if (typeof value === "number" && value > Number.MAX_SAFE_INTEGER) {
          return obj[key].toString();
        }
        return value;
      });
      return parsed;
    } catch (err) {
      return obj;
    }
  } else if (typeof obj === "object" && obj !== null) {
    for (const i in obj) {
      obj[i] = jsonSafeParse(obj[i]);
    }
    return obj;
  } else {
    return obj;
  }
}
function jsonStringify(obj) {
  if (typeof obj === "object") {
    if (!Array.isArray(obj)) {
      for (const i in obj) {
        if (typeof obj[i] === "object") {
          if (obj[i] != null) obj[i] = JSON.stringify(obj[i]);
        }
      }
      return obj;
    } else {
      for (const i in obj) {
        if (obj[i] != null) obj[i] = jsonStringify(obj[i]);
      }
      return obj;
    }
  } else {
    return obj;
  }
}
function getType(obj) {
  if (Array.isArray(obj)) {
    return "array";
  } else if (obj === null || obj === undefined) {
    return "null";
  } else {
    return typeof obj;
  }
}
function empty(obj) {
  return obj === null || obj === undefined || obj === "";
}
function objectSelecter(obj, picker) {
  for (let i of picker) {
    if (obj.hasOwnProperty(i)) {
      obj = obj[i];
    } else {
      return null;
    }
  }
  return obj;
}
module.exports = {
  jsonSafeParse,
  jsonStringify,
  getType,
  empty,
  objectSelecter,
};
