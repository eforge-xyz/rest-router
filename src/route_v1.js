const express = require("express");
const { Validator } = require("node-input-validator");
const CONSTANTS = {
  ARRAY: "required|array",
  INTEGER: "required|integer",
  STRING: "required|string",
  NUMERIC: "required|numeric",
  JSON: "required|object",
  DATETIME: "required|datetime",
};
const {
  jsonSafeParse,
  jsonStringify,
  RemoveUnknownData,
} = require("./function");
module.exports = function route(
  db,
  model,
  modelStructure = {},
  modelPk = "",
  unique = [],
  modelSearch = "",
  override = {}
) {
  /* 
  1) Override -> structure {body:[],params:[],header:[],session:[],set:[{key:value}]}
  TODO:
  1) Bulk Validate unique should not be present in the data of post request (User Insert instead of Change)
  2) Use Filter object for creating where condition instead of whereEq and WhereLike
  */
  const modelNotFound = `${
    model.charAt(0).toUpperCase() + model.slice(1)
  } not found`;
  const modelAlreadyFound = `${
    model.charAt(0).toUpperCase() + model.slice(1)
  } is already present`;
  return express
    .Router()
    .get("/:" + modelPk, (req, res) => {
      let filter = [[]];
      try {
        if (req.query.hasOwnProperty("filter")) {
          filter = jsonSafeParse(req.query.filter);
          for (const i in filter) {
            filter[i] = filter[i];
            filter[i].push([modelPk, "=", req.params[modelPk]]);
          }
        } else {
          filter[0].push([modelPk, "=", req.params[modelPk]]);
        }
      } catch (err) {
        res.status(422).send({ message: "Invalid filter", type: "danger" });
      }
      db.get(model, filter)
        .then((data) => {
          if (data.count === 1) {
            res.send(data["data"][0]);
          } else {
            res.status(404).send({ message: modelNotFound, type: "error" });
          }
        })
        .catch((err) => {
          res.status(422).send(err);
        });
    })
    .post("/:" + modelPk, (req, res) => {
      const payload = {};
      if (unique.length === 0) {
        if (req.body.hasOwnProperty(modelPk))
          payload[modelPk] = req.body[modelPk];
      } else {
        for (const column of unique) {
          payload[column] = req.body[column];
        }
      }
      if (req.body[modelPk] === "add") {
        res.status(422).send({
          message: "add is reserved key and cannot be used for the key ",
          type: "error",
        });
      } else if (req.params[modelPk] !== "add") {
        res.status(422).send({
          message: "Post method is reserved for adding only",
          type: "error",
        });
      } else {
        validateInput(
          req,
          getPayloadValidator("CREATE", modelStructure, modelPk)
        ).then((valid) => {
          req.body = jsonStringify(req.body);
          if (valid === true) {
            req.body = payloadOverride(req.body, req, override);
            req.body = RemoveUnknownData(modelStructure, [req.body]);
            db.upsert(model, req.body)
              .then((data) => {
                res.send(data);
              })
              .catch((error) => {
                res.status(422).send(error);
              });
          } else {
            res.status(422).send(valid);
          }
        });
        /*} else {
            res.status(404).send({ message: modelAlreadyFound, type: "error" });
          }
        });*/
      }
    })
    .put("/:" + modelPk, (req, res) => {
      db.get(model, [[[modelPk, "=", req.params[modelPk]]]]).then((result) => {
        req.body[modelPk] = req.params[modelPk];
        validateInput(
          req,
          getPayloadValidator("UPDATE", modelStructure, modelPk)
        ).then((valid) => {
          if (valid) {
            req.body = jsonStringify(req.body);
            if (result.count === 1) {
              req.body = payloadOverride(req.body, req, override);
              req.body = RemoveUnknownData(modelStructure, [req.body]);
              db.upsert(model, req.body).then((data) => {
                res.send(data);
              });
            } else {
              res.status(404).send({ message: modelNotFound, type: "error" });
            }
          } else {
            res.status(422).send(valid);
          }
        });
      });
    })
    .delete("/:" + modelPk, (req, res) => {
      let filter = [[]];
      try {
        if (req.query.hasOwnProperty("filter")) {
          filter = jsonSafeParse(req.query.filter);
          for (const i in filter) {
            filter[i] = filter[i];
            filter[i].push([modelPk, "=", req.params[modelPk]]);
          }
        } else {
          filter[0].push([modelPk, "=", req.params[modelPk]]);
        }
      } catch (err) {
        res.status(422).send({ message: "Invalid filter", type: "danger" });
      }
      db.get(model, filter).then((data) => {
        if (data.count === 1) {
          db.remove(model, filter).then((result) => {
            res.send(result);
          });
        } else {
          res.status(404).send({ message: modelNotFound, type: "error" });
        }
      });
    })
    .get("/", (req, res) => {
      const search = req.params.search || "";
      const page = req.params.page || 0;
      const limit = req.params.limit || 30;
      let filter = [[]];
      try {
        if (req.query.hasOwnProperty("filter")) {
          filter = jsonSafeParse(req.query.filter);
          for (const i in filter) {
            filter[i] = filter[i];
            filter[i].push([modelSearch, "like", search]);
          }
        } else {
          filter[0].push([modelSearch, "like", search]);
        }
      } catch (err) {
        res.status(422).send({ message: "Invalid filter", type: "danger" });
      }
      db.list(model, filter, page, limit).then((data) => {
        res.send(data);
      });
    })
    .post("/", (req, res) => {
      //Add API
      validateInput(
        req,
        getPayloadValidatorBulk("CREATE", modelStructure, modelPk)
      ).then((valid) => {
        if (valid === true) {
          if (req.body.hasOwnProperty("data") && Array.isArray(req.body.data)) {
            req.body.data = jsonStringify(req.body.data);
          }
          req.body["data"] = payloadOverride(req.body["data"], req, override);
          //Array should not contain modelPk
          //RemovePK(modelPk, req.body["data"]);
          req.body["data"] = RemoveUnknownData(
            modelStructure,
            req.body["data"]
          );
          db.upsert(model, req.body["data"], [modelPk]).then((result) => {
            res.send(result);
          });
        } else {
          res.send(valid);
        }
      });
    })
    .put("/", (req, res) => {
      //Update API
      validateInput(
        req,
        getPayloadValidatorBulk("UPDATE", modelStructure, modelPk)
      ).then((valid) => {
        if (valid === true) {
          if (req.body.hasOwnProperty("data") && Array.isArray(req.body.data)) {
            req.body.data = jsonStringify(req.body.data);
          }
          req.body["data"] = payloadOverride(req.body["data"], req, override);
          req.body["data"] = RemoveUnknownData(
            modelStructure,
            req.body["data"]
          );
          db.upsert(model, req.body["data"]).then((result) => {
            res.send(result);
          });
        } else {
          res.send(valid);
        }
      });
    })
    .delete("/", (req, res) => {
      validateInput(
        req,
        getPayloadValidatorBulk("DELETE", model, modelStructure, modelPk)
      ).then((valid) => {
        if (valid === true) {
          db.remove(model, req.body.filter).then((result) => {
            res.send(result);
          });
        } else {
          res.send(valid);
        }
      });
    });
};
function payloadOverride(payload, req, override) {
  if (Array.isArray(payload)) {
    for (const i in payload) {
      payload[i] = dataOverride(payload[i], req, override);
    }
  } else {
    payload = dataOverride(payload, req, override);
  }
  return payload;
}
function dataOverride(payload, req, override) {
  for (const [type, values] in Object.entries(override)) {
    if (req.hasOwnProperty(type)) {
      for (const value of values) {
        payload[value] = req[type][value];
      }
    } else if (type === "set") {
      for (const value of values) {
        for (const [param, paramValue] of Object.entries(value)) {
          payload[param] = paramValue;
        }
      }
    }
  }
  return payload;
}
async function validateInput(req, required) {
  for (const key in required) {
    if (req.hasOwnProperty(key)) {
      if (Array.isArray(req[key])) {
        return {
          message: "This service supports does not support array",
          type: "error",
        };
      }
      let validator = new Validator(req[key], required[key]);
      const matched = await validator.check();
      if (!matched) {
        return {
          message: getErrorMessage(key, validator.errors),
          type: "error",
        };
      }
    }
  }
  return true;
}
function getErrorMessage(key, errors) {
  let message = `In ${key}: `;
  for (const i in errors) {
    if (errors.hasOwnProperty(i)) {
      message = message + (message !== "" ? " " : "");
      message = message + errors[i].message;
    }
  }
  return message;
}
function getPayloadValidatorBulk(type, structure, pk) {
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
  return { body };
}
function getPayloadValidator(type, structure, pk) {
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
      validator.params = {};
      validator.params[pk] = CONSTANTS[structure[pk]];
      break;
    default:
      break;
  }
  return validator;
}
