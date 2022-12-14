process.env.NODE_ENV = "TEST";
process.env.TEST_PORT = 30001;
let crypto = require("crypto");
let table = "test-" + crypto.randomUUID();
const assert = require("assert");
const faker = require("faker");
const { db, model } = require("../src/index.js");
const app = require("./../src/serve.js");
let test = model(db, table, ["test_id", "test_name"], "test_id", ["test_id"]);
describe("Model Function", function () {
  before(function (done) {
    db.query(
      "CREATE TABLE IF NOT EXISTS`" +
        table +
        "` (" +
        "`test_id` int(11) NOT NULL AUTO_INCREMENT," +
        "`test_name` varchar(63) NOT NULL DEFAULT ''," +
        "`created_at` datetime NOT NULL DEFAULT current_timestamp()," +
        "`modified_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()," +
        "PRIMARY KEY (`test_id`)" +
        ") ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8mb4"
    ).then((data) => {
      done();
    });
    done();
  });
  after(function (done) {
    /*db.query("DROP TABLE `" + table + "`;").then(() => {
      done();
    });*/
    done();
  });
  describe("Single Entry", function () {
    let name = faker.name.findName();
    let updName = faker.name.findName();
    let test_id = 0;
    it("Add an Entry", function (done) {
      test
        .insert({ test_id: 1, test_name: name })
        .then((data) => {
          test_id = data.test_id;
          assert.equal(data.test_id > 0, true);
          assert.equal(name, data.test_name);
          done();
        })
        .catch((err) => {
          console.log(err);
        });
    });
    it("Update an Entry", function (done) {
      test
        .update({ test_id, test_name: updName })
        .then((data) => {
          assert.equal(test_id, data.test_id);
          assert.equal(updName, data.test_name);
          done();
        })
        .catch((err) => {
          console.log(err);
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
    it("Delete an Entry by Filter Array" , function (done) {});.
    it("Delete an Entry by Filter Object", function (done) {});
    it("List with Page 0", function (done) {});
    it("List with Page 1", function (done) {});
    it("List with Filter Object", function (done) {});
    it("List with Filter Array", function (done) {});
    */
  });
});
