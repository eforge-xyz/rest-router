process.env.NODE_ENV = "TEST";
process.env.TEST_PORT = 30001;
let crypto = require("crypto");
let table = "test-" + crypto.randomUUID();
const assert = require("assert");
const faker = require("faker");
const { db, model } = require("../src/index.js");
const app = require("./../src/serve.js");
const { isError } = require("util");
let test = model(
  db,
  table,
  {
    test_id: "INTEGER",
    name: "STRING",
    description: "STRING",
    type: "INTEGER",
    info: "JSON",
  },
  "test_id",
  ["test_id"]
);
describe("Model Function", function () {
  before(function (done) {
    db.query(
      "CREATE TABLE IF NOT EXISTS`" +
        table +
        "` (" +
        "`test_id` int(11) NOT NULL AUTO_INCREMENT," +
        "`name` varchar(63) NOT NULL DEFAULT ''," +
        "`description` varchar(255) NOT NULL DEFAULT ''," +
        "`type` int(11) NOT NULL NOT NULL DEFAULT 0," +
        "`info` json NOT NULL," +
        "`created_at` datetime NOT NULL DEFAULT current_timestamp()," +
        "`modified_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()," +
        "PRIMARY KEY (`test_id`)" +
        ") ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8mb4"
    ).then((data) => {
      done();
    });
  });
  after(function (done) {
    db.query("DROP TABLE `" + table + "`;").then(() => {
      done();
    });
    done();
  });
  describe("Single Entry", function () {
    let payload = { name: faker.name.findName(), description: "123ABC", type: 1, info: { message: "test message" } };
    let payloadUpd = { name: faker.name.findName(), description: "123ABC Upd", type: 2, info: { message: "test message Upd" } };
    let test_id = 0;
    it("Add an Entry", function (done) {
      test
        .insert({ ...payload })
        .then((data) => {
          test_id = data.test_id;
          assert.equal(data.test_id > 0, true);
          assert.equal(payload.name, data.name);
          assert.equal(payload.description, data.description);
          assert.equal(payload.type, data.type);
          assert.equal(JSON.stringify(payload.info), JSON.stringify(data.info));
          done();
        })
        .catch((err) => {
          console.log(err);
          done();
        });
    });
    it("Update an Entry", function (done) {
      test
        .update({ ...payloadUpd, test_id })
        .then((data) => {
          assert.equal(test_id, data.test_id);
          assert.equal(payloadUpd.name, data.name);
          assert.equal(payloadUpd.description, data.description);
          assert.equal(payloadUpd.type, data.type);
          assert.equal(JSON.stringify(payloadUpd.info), JSON.stringify(data.info));
          done();
        })
        .catch((err) => {
          console.log("Error", err);
          done();
        });
    });
    it("Get an Entry byId", function (done) {
      test
        .byId(test_id)
        .then((data) => {
          assert.equal(test_id, data.test_id);
          done();
        })
        .catch((err) => {
          console.log(err);
        });
    });
    it("Delete an Entry byId", function (done) {
      test
        .remove(test_id)
        .then((data) => {
          assert(data, true);
          test.byId(test_id).then((data) => {
            assert.equal(data, null);
            done();
          });
        })
        .catch((err) => {
          console.log(err);
        });
    });
    /*
    it("find Entries by Object", function (done) {});
    it("find Entries by Filter", function (done) {});
    it("Delete an Entry by Filter Array", function (done) {});
    it("Delete an Entry by Filter Object", function (done) {});
    it("List with Page 0", function (done) {});
    it("List with Page 1", function (done) {});
    it("List with Filter Object", function (done) {});
    it("List with Filter Array", function (done) {});
    */
  });
  describe("Multiple Entry", function () {
    let payload = {
      data: [
        { name: faker.name.findName(), description: "123ABC", type: 1, info: { message: "test message" } },
        { name: faker.name.findName(), description: "123ABC", type: 1, info: { message: "test message" } },
        { name: faker.name.findName(), description: "123ABC", type: 1, info: { message: "test message" } },
        { name: faker.name.findName(), description: "123ABC", type: 1, info: { message: "test message" } },
        { name: faker.name.findName(), description: "123ABC", type: 1, info: { message: "test message" } },
      ],
    };
    let payloadUpd = {
      data: [
        { test_id: 2, name: faker.name.findName(), description: "123ABC", type: 1, info: { message: "test message" } },
        { test_id: 3, name: faker.name.findName(), description: "123ABC", type: 1, info: { message: "test message" } },
        { test_id: 4, name: faker.name.findName(), description: "123ABC", type: 1, info: { message: "test message" } },
        { test_id: 5, name: faker.name.findName(), description: "123ABC", type: 1, info: { message: "test message" } },
        { test_id: 6, name: faker.name.findName(), description: "123ABC", type: 1, info: { message: "test message" } },
      ],
    };
    it("Add multiple", function (done) {
      test
        .insert({ ...payload })
        .then((data) => {
          assert.equal(data.rows, payload.data.length);
          done();
        })
        .catch((err) => {
          console.log(err);
          done();
        });
    });
    it("Update multiple", function (done) {
      test
        .update({ ...payloadUpd })
        .then((data) => {
          assert.equal(data.rows, payload.data.length);
          done();
        })
        .catch((err) => {
          console.log(err);
          done();
        });
    });
  });
});
