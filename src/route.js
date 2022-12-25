const express = require("express");
const { errorResponse } = require("./validator");
module.exports = function route(model, override = {}) {
  return express
    .Router()
    .get("/:id", (req, res) => {
      let payload = payloadOverride(req.body, req, override);
      payload[model.pk] = req.params.id;
      model
        .get(payload)
        .then((response) => {
          res.status(200).send(response);
        })
        .catch((err) => {
          errorResponse(res, err);
        });
    })
    .post("/:id", (req, res) => {
      let payload = payloadOverride(req.body, req, override);
      payload[model.pk] = req.params.id;
      model
        .insert(payload)
        .then((response) => {
          res.status(200).send(response);
        })
        .catch((err) => {
          errorResponse(res, err);
        });
    })
    .put("/:id", (req, res) => {
      let payload = payloadOverride(req.body, req, override);
      payload[model.pk] = req.params.id;
      model
        .update(payload)
        .then((response) => {
          res.status(200).send(response);
        })
        .catch((err) => {
          errorResponse(res, err);
        });
    })
    .delete("/:id", (req, res) => {
      let payload = payloadOverride(req.body, req, override);
      payload[model.pk] = req.params.id;
      model
        .remove(payload)
        .then((response) => {
          res.status(200).send(response);
        })
        .catch((err) => {
          errorResponse(res, err);
        });
    })
    .get("/", (req, res) => {
      let payload = payloadOverride(req.params, req, override);
      model
        .list(payload)
        .then((response) => {
          res.status(200).send(response);
        })
        .catch((err) => {
          errorResponse(res, err);
        });
    })
    .post("/", (req, res) => {
      let payload = payloadOverride(req.body.data, req, override);
      model
        .insert(payload)
        .then((response) => {
          res.status(200).send(response);
        })
        .catch((err) => {
          errorResponse(res, err);
        });
    })
    .put("/", (req, res) => {
      let payload = payloadOverride(req.body.data, req, override);
      model
        .update(payload)
        .then((response) => {
          res.status(200).send(response);
        })
        .catch((err) => {
          errorResponse(res, err);
        });
    })
    .delete("/", (req, res) => {
      let payload = payloadOverride(req.body.data, req, override);
      model
        .remove(payload)
        .then((response) => {
          res.status(200).send(response);
        })
        .catch((err) => {
          errorResponse(res, err);
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
  for (const [key, path] in override) {
    if (Array.isArray(path)) payload[key] = objectSelecter(req, path);
    else if (typeof path === "string") payload[key] = path;
  }
  return payload;
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
