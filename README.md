# mysql2-express-crud

Generative API Creation using mysql2 and express libraries in node js

```
const { db, route } = require("mysql2-express-crud");
db.connect({
  connectionLimit: 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  charset: "utf8mb4",
});
app.use("/test", route("test", {}, ["test_id"]));
```

## Usage

app.use(endpoint,route(table_name - name of the table ,overrides - object of multiple json key value pair ,unique_keys - array od string))

Will create 3 endpoints

### /change

jsonbody ->
[{"test_id":1,"test_name":"test12"}]

### /list

jsonbody ->
{"where":{},where_like:{},"limit":30,"offset":0}

### /remove

jsonbody ->
{"where":{"test_id":[1,2,3]},where_like:{},"limit":30,"offset":0}
