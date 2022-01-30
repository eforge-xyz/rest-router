process.env.NODE_ENV = "TEST";
process.env.TEST_PORT = 30001;
let crypto = require("crypto");
let table = "test-" + crypto.randomUUID();
var assert = require("assert");
var faker = require("faker");
const app = require("./../src/serve.js");
const { db } = require("../src/index.js");
describe("Database Functions", function () {
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
  });
  after(function (done) {
    db.query("DROP TABLE `" + table + "`;").then(() => {
      done();
    });
    done();
  });
  describe("Single Entry", function () {
    let name = faker.name.findName();
    it("Add an Entry", function (done) {
      db.change(table, { test_name: name }).then((data) => {
        assert.ok(data.rows == 1);
        done();
      });
    });
    it("Get the entry by ID", function (done) {
      db.get(table, { test_id: 1 }).then((data) => {
        assert.ok(data[table].length == 1);
        assert.ok(data[table][0].test_id == 1);
        done();
      });
    });
    it("Get the entry by conditions", function (done) {
      db.get(table, { test_name: name }).then((data) => {
        assert.ok(data[table].length == 1);
        assert.ok(data[table][0].test_name == name);
        done();
      });
    });
    it("Remove Entry with ID", function (done) {
      db.remove(table, { test_id: 1 }).then((data) => {
        assert.ok(data.status === "removed");
        db.get(table, { test_id: 1 }).then((data) => {
          assert.ok(data[table].length == 0);
          done();
        });
      });
    });
    it("Remove Entry with filter", function (done) {
      db.change(table, [{ test_name: name }]).then((data) => {
        db.remove(table, { test_name: name }).then((data) => {
          assert.ok(data.status === "removed");
          db.get(table, { test_name: name }).then((data) => {
            assert.ok(data[table].length == 0);
            done();
          });
        });
      });
    });
    it("Add an Entry with incorrect data", function (done) {
      db.change(table, { my_name: name }).then((data) => {
        assert.ok(data.message == "Unknown column 'my_name' in 'field list'");
        done();
      });
    });
    it("Remove Entry with incorrect data", function (done) {
      db.change(table, { test_name: name }).then((data) => {
        assert.ok(data.rows == 1);
        db.change(table, { my_name: name }).then((data) => {
          assert.ok(data.message == "Unknown column 'my_name' in 'field list'");
          done();
        });
      });
    });
    it("Get Entries with incorrect data", function (done) {
      db.get(table, { my_name: name }).then((data) => {
        assert.ok(data.message == "Unknown column 'my_name' in 'where clause'");
        done();
      });
    });
    it("Get Entries with non existant data", function (done) {
      db.get(table, { test_name: name + "salt" }).then((data) => {
        assert.ok(data[table].length == 0);
        done();
      });
    });
  });

  describe("Bulk Entry", function () {
    let number = 1000000;
    it("Add a lot of Entries", function (done) {
      this.timeout(30000);
      let input = [];
      for (let i = 0; i < number; i++) {
        input.push({ test_name: faker.name.findName() });
      }
      db.change(table, input).then((data) => {
        assert.ok(data.rows == number);
        done();
      });
    });
    it("Remove a particular Entry", function (done) {
      db.remove(table, { test_id: 500 }).then((data) => {
        assert.ok(data.status == "removed");
        done();
      });
    });
    it("fails to delete when no filter attribute", function (done) {
      db.remove(table, {}).then((data) => {
        assert.ok(
          data.status == "unable to remove as there is not filter attributes"
        );
        done();
      });
    });
    it("Remove multiple entries", function (done) {
      db.remove(table, { test_id: [3, 4, 5, 6, 7] }).then((data) => {
        assert.ok(data.status == "removed");
        done();
      });
    });
    it("Get all entries ", function (done) {
      this.timeout(30000);
      db.get(table).then((data) => {
        assert.ok(data.count === number - 5);
        done();
      });
    });
    it("Get specific entries", function (done) {
      db.get(table, { test_id: [8, 9, 10, 11, 12] }).then((data) => {
        assert.ok(data.count == 5);
        done();
      });
    });
    it("List First page", function (done) {
      db.list(table).then((data) => {
        assert.ok(data[table].length == 30);
        done();
      });
    });
    it("List Second page", function (done) {
      db.list(table, {}, {}, 1).then((data) => {
        assert.ok(data[table].length == 30);
        done();
      });
    });
    it("List First page Seachable", function (done) {
      db.list(table, {}, { test_name: "Mr" }, 0).then((data) => {
        assert.ok(data[table].length <= 30 && data[table].length > 0);
        done();
      });
    });
    it("List Second page Seachable", function (done) {
      db.list(table, {}, { test_name: "Mr" }, 1).then((data) => {
        assert.ok(data[table].length <= 30);
        done();
      });
    });
    it("List with incorrect data", function (done) {
      db.list(table, {}, [{ test_name: "Mr" }], 1).then((data) => {
        assert.ok(data.message == "Unknown column '0' in 'where clause'");
        done();
      });
    });
    it("Get specific entries with incorrect entries", function (done) {
      db.get(table, { id: [8, 9, 10, 11, 12] }).then((data) => {
        assert.ok(data.message == "Unknown column 'id' in 'where clause'");
        done();
      });
    });
    it("Remove all entries", function (done) {
      db.remove(table, {}, { test_id: "%" }).then((data) => {
        assert.ok(data.status == "removed");
        db.get(table).then((data) => {
          assert.ok(data.count == 0);
          done();
        });
        done();
      });
    });
  });
});
