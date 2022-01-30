require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json({ limit: "128mb" }));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).send(err); // Bad request
  }
  next();
});
let port = 3000;
if (process.env.NODE_ENV === "TEST") {
  port = process.env.TEST_PORT;
} else {
  port = process.env.port;
}

const { db, route } = require("./index");
db.connect({
  connectionLimit: 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  charset: "utf8mb4",
});
app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.use("/test", route("test", {}, ["test_id"]));
app.get("/test/test1", (req, res) => {
  res.send("Hello World!");
});
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
module.exports = { app };
