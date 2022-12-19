const express = require("express");
module.exports = function route(model, override = {}) {
  return express
    .Router()
    .get("/:id", (req, res) => {
      model
        .get(req.params.id)
        .then((response) => {
          res.status(200).send(response);
        })
        .catch((err) => {
          errorResponse(res, err);
        });
    })
    .post("/:id", (req, res) => {
      req.body = payloadOverride(req.body, req, override);
      model
        .insert(req.body)
        .then((response) => {
          res.status(200).send(response);
        })
        .catch((err) => {
          errorResponse(res, err);
        });
    })
    .put("/:id", (req, res) => {
      req.body = payloadOverride(req.body, req, override);
      model
        .update(req.body)
        .then((response) => {
          res.status(200).send(response);
        })
        .catch((err) => {
          errorResponse(res, err);
        });
    })
    .delete("/:id", (req, res) => {
      req.body = payloadOverride(req.body, req, override);
      model
        .remove(req.params.id)
        .then((response) => {
          res.status(200).send(response);
        })
        .catch((err) => {
          errorResponse(res, err);
        });
    })
    .get("/", (req, res) => {
      model
        .list(req.params)
        .then((response) => {
          res.status(200).send(response);
        })
        .catch((err) => {
          errorResponse(res, err);
        });
    })
    .post("/", (req, res) => {
      req.body = payloadOverride(req.body, req, override);
      model
        .insert(req.data)
        .then((response) => {
          res.status(200).send(response);
        })
        .catch((err) => {
          errorResponse(res, err);
        });
    })
    .put("/", (req, res) => {
      req.body = payloadOverride(req.body, req, override);
      model
        .update(req.data)
        .then((response) => {
          res.status(200).send(response);
        })
        .catch((err) => {
          errorResponse(res, err);
        });
    })
    .delete("/", (req, res) => {
      req.body = payloadOverride(req.body, req, override);
      model
        .remove(req.data)
        .then((response) => {
          res.status(200).send(response);
        })
        .catch((err) => {
          errorResponse(res, err);
        });
    });
};
