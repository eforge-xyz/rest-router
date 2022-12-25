function jsonSafeParse(obj) {
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
}
function jsonStringify(obj) {
  if (typeof obj === "object") {
    if (!Array.isArray(obj)) {
      for (const i in obj) {
        if (typeof obj[i] === "object") {
          obj[i] = JSON.stringify(obj[i]);
        }
      }
      return obj;
    } else {
      for (const i in obj) {
        obj[i] = jsonStringify(obj[i]);
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

module.exports = {
  jsonSafeParse,
  jsonStringify,
  getType,
  empty,
};
