const express = require("express");
const { Validator } = require("node-input-validator");
const ARRAY_REQUIRED = "required|array";
const STRING_REQUIRED = "required|string";
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
  4) Bulk Validate unique should not be present in the data of post request (User Insert instead of Change)
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
      let filter = [];
      if (req.params.hasOwnProperty("filter")) {
        filter = req.params.filter;
      }
      filter.push([modelPk, "=", req.params[modelPk]]);

      //payload = payloadOverride(payload, req, override);
      //payload[modelPk] = req.params[modelPk];
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
        //db.get(model, []).then((result) => {
        //console.log(result);
        //if (result.count === 0) {
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
      const payload = {};
      payload[modelPk] = req.params[modelPk];
      db.get(model, payload).then((data) => {
        if (data.count === 1) {
          db.remove(model, payload).then((result) => {
            res.send(result);
          });
        } else {
          res.status(404).send({ message: modelNotFound, type: "error" });
        }
      });
    })
    .get("/", (req, res) => {
      //List API (Supports = condition only)
      //search,page,limit + filter based on params values in url + extra params after url
      /*
      To support <,>,=,~(like)
      filter=[{column,condition,value},...]
      filter=[[column,condition,value],...]
      test_name=Test Name&date<2021-01-01*/
      const search = req.params.search || "";
      const page = req.params.page || 0;
      const limit = req.params.limit || 30;
      let where = {};
      for (const [key, value] of Object.entries(req.params)) {
        if (!["search", "page", "limit", "filter"].includes(key)) {
          where[key] = value;
        }
      }
      where = payloadOverride(where, req, override);
      const payload = {};
      payload[modelSearch] = search;
      db.list(model, where, payload, page, limit).then((data) => {
        res.send(data);
      });
    })
    .post("/", (req, res) => {
      //Add API
      validateInput(
        req,
        getPayloadValidatorBulk("CREATE", model, modelStructure, modelPk)
      ).then((valid) => {
        if (valid === true) {
          req.body[model + "s"] = payloadOverride(
            req.body[model + "s"],
            req,
            override
          );
          //Array should not contain modelPk
          //RemovePK(modelPk, req.body[model + "s"]);
          req.body[model + "s"] = RemoveUnknownData(
            modelStructure,
            req.body[model + "s"]
          );
          db.change(model, req.body[model + "s"], [modelPk]).then((result) => {
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
        getPayloadValidatorBulk("UPDATE", model, modelStructure, modelPk)
      ).then((valid) => {
        if (valid === true) {
          req.body[model + "s"] = payloadOverride(
            req.body[model + "s"],
            req,
            override
          );
          req.body[model + "s"] = RemoveUnknownData(
            [modelPk, ...modelStructure],
            req.body[model + "s"]
          );
          db.change(model, req.body[model + "s"]).then((result) => {
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
          db.remove(model, req.body).then((result) => {
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
      body[model + "s"] = ARRAY_REQUIRED;
      for (const i in structure) {
        body[`${model}s.*.${structure[i]}`] = STRING_REQUIRED;
      }
      break;
    case "UPDATE":
      body[model + "s"] = ARRAY_REQUIRED;
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
