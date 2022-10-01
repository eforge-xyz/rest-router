process.env.NODE_ENV = "TEST";
process.env.TEST_PORT = 30001;
let crypto = require("crypto");
let table = "test-" + crypto.randomUUID();
const request = require("supertest");
var assert = require("assert");
var faker = require("faker");
const { app } = require("./../src/serve.js");
const { db } = require("../src/index.js");
describe("Rest APIs", function () {
  /*before(function (done) {
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
  });*/
  describe("Single Entry", function () {
    //let name = faker.name.findName();
    it("post an entry", function (done) {
      request(app)
        .post("/test/add")
        .send({ test_name: "Test Name Value" })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect((res) => {
          console.log(res.text);
          //t.equal(res.text, "Ok");
        })
        .expect(200, done);
    });
  });
});
