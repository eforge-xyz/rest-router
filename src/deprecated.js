const express = require("express");
db = require("./db.js");
function route(table, override = {}, unique_keys = []) {
  return express
    .Router()
    .all("/list", (req, res) => {
      req.body = parameter_override(req.body, override);
      db.list(
        table,
        req.body.where,
        req.body.where_like,
        req.body.page,
        req.body.limit
      ).then((data) => {
        res.send(data);
      });
    })
    .post("/change", (req, res) => {
      req.body = parameter_override(req.body, override);
      db.change(table, req.body, unique_keys).then((data) => {
        res.send(data);
      });
    })
    .post("/remove", (req, res) => {
      req.body = parameter_override(req.body, override);
      if (req.body.where != undefined && req.body.where_like != undefined)
        res.send({ message: "where or where_like are required paramter" });
      db.remove(table, req.body.where, req.body.where_like).then((data) => {
        res.send(data);
      });
    });
}
function parameter_override(body, override) {
  for (let key in override) {
    body[key] = override.key;
  }
  return body;
}
module.exports = { db, route };
