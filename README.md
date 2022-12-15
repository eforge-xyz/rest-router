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

/\*
filter=[[["column_name",condition","value],["column_name","condition","value"]],[["column_name",condition","value],["column_name","condition","value]]]
conditions to support
=,like,in,<,>,<=,>=,!=

1st Array is OR
2nd Array is AND
3rd Array is Conditional

\*/

## Usage

app.use(endpoint,route(table_name - name of the table ,overrides - object of multiple json key value pair ,unique_keys - array of string))

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

GET /resources/:id
POST /resources/add (Insert)
PUT /resources/:id (Update)
DELETE /resources/:id (Delete)

GET /resources
[where {},page 0,limit 30]
POST /resources (Insert)
[{},{}]
PUT /resources (Update)
[{},{}]
DELETE /resources (Delete)
[{},{}]

```
/module/test.js
const {route,model} = require("./index.js");
const testModel = model(db,
    "test",
    {
      test_id: "INTEGER",
      name: "STRING",
      description: "STRING",
      type: "INTEGER",
      info: "JSON",
    },
    "test_id",
    "name",
    [],
    {
      session: ["user"]["user_id"],
    });
    model["customFunction"] = async (a,b,c) =>{

    };
    const testRoute =route(db,
        "test",
        {
          test_id: "INTEGER",
          name: "STRING",
          description: "STRING",
          type: "INTEGER",
          info: "JSON",
        },
        "test_id",
        "name",
        [],
        {
          session: ["user"]["user_id"],
        });
        testRoute.post("/",(req,res)=>{

        })
module.exports = {route:testRoute,model:testModel };
```
