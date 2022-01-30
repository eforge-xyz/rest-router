var mysql = require("mysql2");
var pool = null;
function connect(credentails) {
  pool = mysql.createPool(credentails);
  return pool;
}

function query(sql, parameter = []) {
  return new Promise((resolve) => {
    pool.query(sql, parameter, function (error, results, fields) {
      if (error) throw error;
      resolve(results);
    });
  });
}

function where(where_eq = [], where_like = []) {
  if (Object.keys(where_eq).length + Object.keys(where_like).length < 1)
    return { query: " ", value: [] };
  var where_key = [];
  var where_value = [];
  for (var i in where_eq) {
    if (typeof where_eq[i] === "object") {
      where_key.push("?? in " + array_param(where_eq[i].length));
      where_value.push(i);
      where_value.push(...where_eq[i]);
    } else {
      where_key.push("?? = ?");
      where_value.push(i);
      where_value.push(where_eq[i]);
    }
  }
  for (i in where_like) {
    where_key.push("?? like ?");
    where_value.push(i);
    where_value.push("%" + where_like[i] + "%");
  }
  return {
    query: " WHERE " + where_key.join(" AND ") + " ",
    value: where_value,
  };
}

function get(table, where_arr = [], where_like_arr = []) {
  var response = {};
  return new Promise((resolve) => {
    const where_data = where(where_arr, where_like_arr);
    const statement = "SELECT * FROM ?? " + where_data["query"] + ";";
    pool.query(
      statement,
      [table, ...where_data["value"]],
      function (error, results) {
        if (error) {
          resolve({ message: error.sqlMessage });
        }
        response[table] = results;
        response["count"] = count(table, where_arr, where_like_arr).then(
          (value) => {
            response["count"] = value;
            resolve(response);
          }
        );
      }
    );
  });
}

function list(
  table,
  where_arr = [],
  where_like_arr = [],
  page = 0,
  limit = 30
) {
  var response = {};
  return new Promise((resolve) => {
    const where_data = where(where_arr, where_like_arr);
    const statement =
      "SELECT * FROM ?? " + where_data["query"] + " LIMIT ? OFFSET ?;";
    pool.query(
      statement,
      [table, ...where_data["value"], limit, page * limit],
      function (error, results) {
        if (error) {
          resolve({ message: error.sqlMessage });
        }
        response[table] = results;
        response["count"] = count(table, where_arr, where_like_arr).then(
          (value) => {
            response["count"] = value;
            resolve(response);
          }
        );
      }
    );
  });
}

function count(table, where_arr = [], where_like_arr = []) {
  return new Promise((resolve) => {
    const where_data = where(where_arr, where_like_arr);
    const statement =
      "SELECT count(*) AS number FROM ?? " + where_data["query"] + ";";
    pool.query(
      statement,
      [table, ...where_data["value"]],
      function (error, results) {
        if (error || results === "undefined") {
          resolve(0);
        } else {
          resolve(results[0].number);
        }
      }
    );
  });
}

function remove(table, where_arr = [], where_like_arr = []) {
  return new Promise((resolve) => {
    const where_data = where(where_arr, where_like_arr);
    if (where_data.value.length < 1)
      resolve({ status: "unable to remove as there is not filter attributes" });
    else {
      const statement = "DELETE FROM ?? " + where_data["query"] + ";";
      pool.query(
        statement,
        [table, ...where_data["value"]],
        function (error, results, fields) {
          if (error) {
            resolve({ message: error.sqlMessage });
          }
          resolve({ status: "removed" });
        }
      );
    }
  });
}

function change(table, data, unique_keys = []) {
  return new Promise((resolve) => {
    var array = [];
    var promise = [];
    var counter = 0;
    var total = 0;
    if (!isset(data[0])) {
      array.push(data);
    } else {
      array = data;
    }
    const [statement, insert_column, update_column] = get_change_parameter(
      array[0],
      unique_keys
    );
    var value = [];
    for (var i in array) {
      var entry = [];
      for (var j in insert_column) {
        entry.push(array[i][insert_column[j]]);
      }
      value.push(entry);
      counter++;
      total++;
      if (counter > 999) {
        promise.push(
          pool
            .promise()
            .query(
              statement,
              [table, ...insert_column, value, ...update_column],
              function (error, results, fields) {
                resolve(results);
              }
            )
        );
        value = [];
        counter = 0;
      }
    }
    if (counter > 0) {
      promise.push(
        pool
          .promise()
          .query(
            statement,
            [table, ...insert_column, value, ...update_column],
            function (error, results, fields) {
              resolve(results);
            }
          )
      );
    }
    var response = {};
    response.rows = total;
    Promise.all(promise)
      .then((results) => {
        if (total === 1) {
          response["id"] = results[0][0].insertId;
        }
        resolve(response);
      })
      .catch((error) => {
        resolve({ message: error.sqlMessage });
      });
  });
}

function get_change_parameter(row, unique_keys) {
  var query_start = "INSERT INTO ?? ";
  var insert_column = Object.keys(row);
  var update_column = [];
  query_start += insert_param(insert_column.length);
  var query_end = " ON DUPLICATE KEY UPDATE ";
  for (var i in insert_column) {
    if (!unique_keys.includes(insert_column[i])) {
      if (query_end != " ON DUPLICATE KEY UPDATE ") {
        query_end += ",";
      }
      query_end += "??=VALUES(??)";
      update_column.push(insert_column[i]);
      update_column.push(insert_column[i]);
    }
  }
  query_end += ";";
  return [query_start + " VALUES ? " + query_end, insert_column, update_column];
}

function insert_param(number) {
  var str = "";
  for (var i = 0; i < number; i++) {
    if (i == 0) str = "??";
    else str = str + ",??";
  }
  return "(" + str + ")";
}
function array_param(number) {
  var str = "";
  for (var i = 0; i < number; i++) {
    if (i == 0) str = "?";
    else str = str + ",?";
  }
  return "(" + str + ")";
}
function isset(obj) {
  return typeof obj !== "undefined";
}

module.exports = {
  connect,
  get,
  list,
  where,
  query,
  count,
  remove,
  change,
  pool,
};
