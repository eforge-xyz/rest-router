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
function stringify(obj) {
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
        obj[i] = stringify(obj[i]);
      }
      return obj;
    }
  } else {
    return obj;
  }
}
module.exports = { jsonSafeParse, stringify };
