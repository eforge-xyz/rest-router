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
function getType(obj) {
  if (Array.isArray(obj)) {
    return "array";
  } else if (obj === null || obj === undefined) {
    return "null";
  } else {
    return typeof obj;
  }
}
function RemovePK(modelPK, data) {
  for (const item of data) {
    if (item.hasOwnProperty(modelPK)) {
      delete item[modelPK];
    }
  }
}
function RemoveUnknownData(ModelStructure, data) {
  const modelStructure = Object.keys(ModelStructure);
  for (const item of data) {
    for (const i in item) {
      if (!modelStructure.includes(i)) {
        delete item[i];
      }
    }
  }
  return data;
}
function empty(obj) {
  return obj === null || obj === undefined || obj === "";
}
function objectToFilter(obj) {
  let filterArray = [];
  for (let key in obj) {
    filterArray.push([key, "=", obj[key]]);
  }
  return [filterArray];
}
module.exports = {
  jsonSafeParse,
  stringify,
  getType,
  empty,
  RemovePK,
  RemoveUnknownData,
  objectToFilter,
};
