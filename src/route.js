const express = require("express");
const { errorResponse } = require("./validator");
const _ = require("lodash");
const router = express.Router();
router.upsert = function (path, callback) {
  this.all(path, callback);
};
module.exports = function route(model, override = {}) {
  return router
    .get("/:id", (req, res) => {
      let payload = payloadOverride(req.query, req, override);
      payload[model.pk] = req.params.id;
      model
        .find(payload)
        .then((response) => {
          if (response.count > 0) res.status(200).send(response.data[0]);
          else res.status(404).send({ message: "Not Found", type: "danger" });
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
      let payload = payloadOverride(req.query, req, override);
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
        .insert({ data: payload })
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
        .update({ data: payload })
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
  //Custom Verbs
  /*.all("/:id", (req, res) => {
        console.log(req.method);
        if (req.method === "UPSERT") {
          let payload = payloadOverride(req.body, req, override);
          payload[model.pk] = req.params.id;
          model
            .upsert(payload)
            .then((response) => {
              res.status(200).send(response);
            })
            .catch((err) => {
              errorResponse(res, err);
            });
        } else {
          res
            .status(400)
            .send({ message: "Invalid Http Verb", type: "danger" });
        }
      })
      .all("/", (req, res) => {
        console.log(req.method);
        if (req.method === "UPSERT") {
          let payload = payloadOverride(req.body.data, req, override);
          model
            .upsert({ data: payload })
            .then((response) => {
              res.status(200).send(response);
            })
            .catch((err) => {
              errorResponse(res, err);
            });
        } else {
          res
            .status(400)
            .send({ message: "Invalid Http Verb", type: "danger" });
        }
      })*/
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
  for (const key in override) {
    payload[key] = _.get(req, override[key], "");
  }
  return payload;
}
