const express = require("express");
const { Validator } = require("node-input-validator");
const ARRAY_REQUIRED = "required|array";
const STRING_REQUIRED = "required|string";
const { jsonSafeParse, stringify } = require("./function");
db = require("./db.js");
function route(
  model,
  modelStructure = [],
  modelPk = "",
  modelSearch = "",
  unique = [],
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
      if (req.query.hasOwnProperty("filter")) {
        filter = jsonSafeParse(req.query.filter);
        for (const i in filter) {
          filter[i] = filter[i];
          filter[i].push([modelPk, "=", req.params[modelPk]]);
        }
      } else {
        filter[0].push([modelPk, "=", req.params[modelPk]]);
      }
      db.get(model, filter).then((data) => {
        if (data.count === 1) {
          res.send(data[model][0]);
        } else {
          res.status(404).send({ message: modelNotFound, type: "error" });
        }
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
        req.body = stringify(req.body);
        validateInput(
          req,
          getPayloadValidator("CREATE", modelStructure, modelPk)
        ).then((valid) => {
          if (valid === true) {
            req.body = payloadOverride(req.body, req, override);
            req.body = RemoveUnknownData(
              [modelPk, ...modelStructure],
              [req.body]
            );
            db.change(model, req.body)
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
      const payload = {};
      payload[modelPk] = req.params[modelPk];
      db.get(model, payload).then((result) => {
        req.body[modelPk] = req.params[modelPk];
        req.body = stringify(req.body);
        if (result.count === 1) {
          req.body = payloadOverride(req.body, req, override);
          req.body = RemoveUnknownData(
            [modelPk, ...modelStructure],
            [req.body]
          );
          db.change(model, req.body).then((data) => {
            res.send(data);
          });
        } else {
          res.status(404).send({ message: modelNotFound, type: "error" });
        }
      });
    })
    .delete("/:" + modelPk, (req, res) => {
      let filter = [[]];
      if (req.query.hasOwnProperty("filter")) {
        filter = jsonSafeParse(req.query.filter);
        for (const i in filter) {
          filter[i] = filter[i];
          filter[i].push([modelPk, "=", req.params[modelPk]]);
        }
      } else {
        filter[0].push([modelPk, "=", req.params[modelPk]]);
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
      if (req.query.hasOwnProperty("filter")) {
        filter = jsonSafeParse(req.query.filter);
        for (const i in filter) {
          filter[i] = filter[i];
          filter[i].push([modelSearch, "like", search]);
        }
      } else {
        filter[0].push([modelSearch, "like", search]);
      }
      db.list(model, filter, page, limit).then((data) => {
        res.send(data);
      });
    })
    .post("/", (req, res) => {
      //Add API
      if (req.body.hasOwnProperty("data") && Array.isArray(req.body.data)) {
        req.body.data = stringify(req.body.data);
      }
      validateInput(
        req,
        getPayloadValidatorBulk("CREATE", model, modelStructure, modelPk)
      ).then((valid) => {
        if (valid === true) {
          req.body["data"] = payloadOverride(req.body["data"], req, override);
          //Array should not contain modelPk
          //RemovePK(modelPk, req.body["data"]);
          req.body["data"] = RemoveUnknownData(
            modelStructure,
            req.body["data"]
          );
          db.change(model, req.body["data"], [modelPk]).then((result) => {
            res.send(result);
          });
        } else {
          res.send(valid);
        }
      });
    })
    .put("/", (req, res) => {
      //Update API
      if (req.body.hasOwnProperty("data") && Array.isArray(req.body.data)) {
        req.body.data = stringify(req.body.data);
      }
      validateInput(
        req,
        getPayloadValidatorBulk("UPDATE", model, modelStructure, modelPk)
      ).then((valid) => {
        if (valid === true) {
          req.body["data"] = payloadOverride(req.body["data"], req, override);
          req.body["data"] = RemoveUnknownData(
            [modelPk, ...modelStructure],
            req.body["data"]
          );
          db.change(model, req.body["data"]).then((result) => {
            res.send(result);
          });
        } else {
          res.send(valid);
        }
      });
    })
    .delete("/", (req, res) => {
      validateInput(req, { body: { filter: ARRAY_REQUIRED } }).then((valid) => {
        if (valid === true) {
          db.remove(model, req.body.filter).then((result) => {
            res.send(result);
          });
        } else {
          res.send(valid);
        }
      });
    });
}
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
function getPayloadValidatorBulk(type, model, structure, pk) {
  const body = {};
  switch (type) {
    case "CREATE":
      body["data"] = ARRAY_REQUIRED;
      for (const i in structure) {
        body[`${model}s.*.${structure[i]}`] = STRING_REQUIRED;
      }
      break;
    case "UPDATE":
      body["data"] = ARRAY_REQUIRED;
      for (const i in structure) {
        body[`${model}s.*.${structure[i]}`] = STRING_REQUIRED;
      }
      body[`${model}s.*.${pk}`] = STRING_REQUIRED;
      break;
    case "DELETE":
      body[pk] = ARRAY_REQUIRED;
      body[`${pk}.*`] = STRING_REQUIRED;
      break;
    default:
      break;
  }
  return { body };
}
function getPayloadValidator(type, structure, pk) {
  const body = {};
  switch (type) {
    case "CREATE":
      for (const i in structure) {
        body[structure[i]] = STRING_REQUIRED;
      }
      break;
    case "UPDATE":
      for (const i in structure) {
        body[structure[i]] = STRING_REQUIRED;
      }
      body[pk] = STRING_REQUIRED;
      break;
    case "DELETE":
      body[pk] = STRING_REQUIRED;
      break;
    default:
      break;
  }
  return { body };
}
function RemovePK(modelPK, data) {
  for (const item of data) {
    if (item.hasOwnProperty(modelPK)) {
      delete item[modelPK];
    }
  }
}
function RemoveUnknownData(ModelStructure, data) {
  for (const item of data) {
    for (const i in item) {
      if (!ModelStructure.includes(i)) {
        delete item[i];
      }
    }
  }
  return data;
}
module.exports = { db, route };
