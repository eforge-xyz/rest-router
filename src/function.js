const { Validator } = require("node-input-validator");

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
function getPayloadValidator(type, structure, pk, bulk = false) {
  const CONSTANTS = {
    ARRAY: "required|array",
    INTEGER: "required|integer",
    STRING: "required|string",
    NUMERIC: "required|numeric",
    JSON: "required|object",
    DATETIME: "required|datetime",
  };
  if (bulk) {
    const body = {};
    switch (type) {
      case "CREATE":
        body["data"] = CONSTANTS["ARRAY"];
        for (const i in structure) {
          if (i !== pk) body[`data.*.${i}`] = CONSTANTS[structure[i]];
        }
        break;
      case "UPDATE":
        body["data"] = CONSTANTS["ARRAY"];
        for (const i in structure) {
          body[`data.*.${i}`] = CONSTANTS[structure[i]];
        }
        break;
      case "DELETE":
        body["filter"] = CONSTANTS["ARRAY"];
        break;
      default:
        break;
    }
    return body;
  } else {
    const validator = { body: {} };
    switch (type) {
      case "CREATE":
        for (const i in structure) {
          if (i !== pk) validator.body[i] = CONSTANTS[structure[i]];
        }
        break;
      case "UPDATE":
        for (const i in structure) {
          validator.body[i] = CONSTANTS[structure[i]];
        }
        break;
      case "DELETE":
      case "GET":
        validator.body[i] = CONSTANTS[structure[pk]];
        break;
      default:
        break;
    }
    return validator.body;
  }
}
/*async function validateInput(req, required) {
  console.log(req, required);
  for (const key in required) {
    if (req.hasOwnProperty(key)) {
      if (Array.isArray(req[key])) {
        throw Error({ message: "This service supports does not support array", status: 422 });
      }
      let validator = new Validator(req[key], required[key]);
      const matched = await validator.check();
      if (!matched) {
        console.log(getErrorMessage(key, validator.errors));
        //throw Error({ message: getErrorMessage(key, validator.errors), status: 422 });
      }
    }
  }
  return true;
}*/
async function validateInput(req, required) {
  let validator = new Validator(req, required);
  const matched = await validator.check();
  if (!matched) {
    throw new Error(getErrorMessage(validator.errors), { cause: { status: 422 } });
  }
  return true;
}
function getErrorMessage(errors) {
  let message = "";
  for (const i in errors) {
    if (errors.hasOwnProperty(i)) {
      message = message + (message !== "" ? " " : "");
      message = message + errors[i].message;
    }
  }
  return message;
}
module.exports = {
  jsonSafeParse,
  stringify,
  getType,
  empty,
  RemovePK,
  RemoveUnknownData,
  objectToFilter,
  getPayloadValidator,
  validateInput,
};
