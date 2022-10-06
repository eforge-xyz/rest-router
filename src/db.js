const mysql = require("mysql2");
const { jsonSafeParse } = require("./function");
let pool = null;
const WHERE_INVALID = "Invalid filter object";

function connect(credentails) {
  pool = mysql.createPool(credentails);
  return pool;
}
function query(sql, parameter = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, parameter, function (error, results) {
      if (error) {
        reject(error);
      }
      resolve(results);
    });
  });
}
function where(filter) {
  try {
    if (
      filter === null ||
      filter === "" ||
      filter.length === 0 ||
      filter[0].length == [[]] ||
      filter[0][0].length == [[[]]]
    ) {
      return {
        query: "",
        value: [],
      };
    }
  } catch (err) {
    //console.log(err);
    return null;
  }
  const valid_conditionals = ["=", "like", "in", "<", ">", "<=", ">=", "!="];
  let conditionOr = [];
  let value = [];
  for (const i of filter) {
    let conditionAnd = [];
    for (const j of i) {
      if (!valid_conditionals.includes(j[1])) {
        return null;
      }
      if (j[1] === "in" && !Array.isArray(j[2])) {
        return null;
      }
      if (j[1] === "in") {
        conditionAnd.push("?? in " + arrayParam(j[2].length) + "");
        value.push(j[0], ...j[2]);
      } else if (j[1] === "like") {
        conditionAnd.push("?? like ?");
        value.push(j[0], "%" + j[2] + "%");
      } else {
        conditionAnd.push("?? " + j[1] + " ?");
        value.push(j[0], j[2]);
      }
    }
    conditionOr.push(conditionAnd.join(" AND "));
  }
  let query = "WHERE ((" + conditionOr.join(") OR (") + "))";
  //console.log(filter, query, value);
  return {
    query,
    value,
  };
}
/*
function where(whereEq = [], whereLike = []) {
  if (Object.keys(whereEq).length + Object.keys(whereLike).length < 1) {
    return { query: " ", value: [] };
  }
  const whereKey = [];
  const whereValue = [];
  for (const [i, v] of Object.entries(whereEq)) {
    if (typeof v === "object") {
      whereKey.push("?? in " + arrayParam(v.length));
      whereValue.push(i);
      whereValue.push(...v);
    } else {
      whereKey.push("?? = ?");
      whereValue.push(i);
      whereValue.push(v);
    }
  }
  for (const [i, v] of Object.entries(whereLike)) {
    whereKey.push("?? like ?");
    whereValue.push(i);
    whereValue.push(`%${v}%`);
  }
  return {
    query: ` WHERE ${whereKey.join(" AND ")} `,
    value: whereValue,
  };
}
*/

function get(table, filter = []) {
  const response = {};
  return new Promise((resolve) => {
    const whereData = where(filter);
    if (whereData === null) {
      resolve({ message: WHERE_INVALID });
    }
    const statement = `SELECT * FROM ?? ${whereData["query"]};`;
    pool.query(
      statement,
      [table, ...whereData["value"]],
      function (error, results) {
        if (error) {
          resolve({ message: error.sqlMessage });
        }
        response["data"] = jsonSafeParse(results);
        response["count"] = qcount(table, filter).then((count) => {
          response["count"] = count;
          resolve(response);
        });
      }
    );
  });
}

function list(table, filter = [], page = 0, limit = 30) {
  const response = {};
  return new Promise((resolve) => {
    const whereData = where(filter);
    if (whereData == null) {
      resolve({ message: WHERE_INVALID });
    }
    const statement = `SELECT * FROM ?? ${whereData["query"]} LIMIT ? OFFSET ?;`;
    pool.query(
      statement,
      [table, ...whereData["value"], limit, page * limit],
      function (error, results) {
        if (error) {
          resolve({ message: error.sqlMessage });
        }
        response["data"] = jsonSafeParse(results);
        response["count"] = qcount(table, filter).then((count) => {
          response["count"] = count;
          resolve(response);
        });
      }
    );
  });
}

function qcount(table, filter) {
  return new Promise((resolve) => {
    const whereData = where(filter);
    if (whereData == null) {
      resolve({ message: WHERE_INVALID });
    }
    const statement = `SELECT count(*) AS number FROM ?? ${whereData["query"]};`;
    pool.query(
      statement,
      [table, ...whereData["value"]],
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

function remove(table, filter) {
  return new Promise((resolve) => {
    const whereData = where(filter);
    if (whereData == null) {
      resolve({ message: WHERE_INVALID });
    }
    if (whereData.value.length < 1) {
      resolve({ status: "unable to remove as there is not filter attributes" });
    } else {
      const statement = `DELETE FROM ?? ${whereData["query"]};`;
      pool.query(statement, [table, ...whereData["value"]], function (error) {
        if (error) {
          resolve({ message: error.sqlMessage });
        }
        resolve({ status: "removed" });
      });
    }
  });
}

function change(table, data, uniqueKeys = []) {
  return new Promise((resolve, reject) => {
    let array = [];
    const promise = [];
    let count = 0;
    let total = 0;
    if (!isset(data[0])) {
      array.push(data);
    } else {
      array = data;
    }
    const [statement, insertColumn, updateColumn] = getChangeParameter(
      array[0],
      uniqueKeys
    );
    let value = [];
    for (const [i, v] of Object.entries(array)) {
      if (array.hasOwnProperty(i)) {
        const entry = [];
        for (const col of insertColumn) {
          entry.push(v[col]);
        }
        value.push(entry);
        count++;
        total++;
        if (count > 999) {
          promise.push(
            pool
              .promise()
              .query(
                statement,
                [table, ...insertColumn, value, ...updateColumn],
                function (_error, results) {
                  if (error) {
                    reject(error);
                  }
                  resolve(results);
                }
              )
          );
          value = [];
          count = 0;
        }
      }
    }
    if (count > 0) {
      promise.push(
        pool
          .promise()
          .query(
            statement,
            [table, ...insertColumn, value, ...updateColumn],
            function (error, results) {
              if (error) {
                reject(error);
              }
              resolve(results);
            }
          )
      );
    }

    const response = {
      rows: total,
      message:
        (total === 1
          ? `1 ${namify(table)} is `
          : `${total} ${namify(table)}s are `) + "saved",
      type: "success",
    };
    Promise.all(promise)
      .then((results) => {
        try {
          if (total === 1) {
            response["id"] = results[0][0].insertId;
          }
          resolve(response);
        } catch (err) {
          reject(err);
        }
      })
      .catch((error) => {
        console.log(error);
        reject({ message: error.sqlMessage, type: "danger" });
      });
  });
}
function insert(table, data, uniqueKeys = []) {
  return new Promise((resolve) => {
    let array = [];
    const promise = [];
    let count = 0;
    let total = 0;
    if (!isset(data[0])) {
      array.push(data);
    } else {
      array = data;
    }
    const [statement, insertColumn, updateColumn] = getChangeParameter(
      array[0],
      uniqueKeys
    );
    let value = [];
    for (const [i, v] of Object.entries(array)) {
      if (array.hasOwnProperty(i)) {
        const entry = [];
        for (const col of insertColumn) {
          entry.push(v[col]);
        }
        value.push(entry);
        count++;
        total++;
        if (count > 999) {
          promise.push(
            pool
              .promise()
              .query(
                statement,
                [table, ...insertColumn, value, ...updateColumn],
                function (_error, results) {
                  resolve(results);
                }
              )
          );
          value = [];
          count = 0;
        }
      }
    }
    if (count > 0) {
      promise.push(
        pool
          .promise()
          .query(
            statement,
            [table, ...insertColumn, value, ...updateColumn],
            function (_error, results) {
              resolve(results);
            }
          )
      );
    }

    const response = {
      rows: total,
      message:
        (total === 1
          ? `1 ${namify(table)} is `
          : `${total} ${namify(table)}s are `) + "saved",
      type: "success",
    };
    Promise.all(promise)
      .then((results) => {
        try {
          if (total === 1) {
            response["id"] = results[0][0].insertId;
          }
        } catch (err) {}
        resolve(response);
      })
      .catch((error) => {
        resolve({ message: error.sqlMessage, type: "danger" });
      });
  });
}

function getChangeParameter(row, uniqueKeys) {
  const insertColumn = Object.keys(row);
  const updateColumn = [];
  const queryStart = "INSERT INTO ?? " + insertParam(insertColumn.length);
  let queryEnd = " ON DUPLICATE KEY UPDATE ";
  for (const column of insertColumn) {
    if (!uniqueKeys.includes(column)) {
      if (queryEnd !== " ON DUPLICATE KEY UPDATE ") {
        queryEnd += ",";
      }
      queryEnd += "??=VALUES(??)";
      updateColumn.push(column);
      updateColumn.push(column);
    }
  }
  queryEnd += ";";
  return [`${queryStart} VALUES ? ${queryEnd}`, insertColumn, updateColumn];
}
function insertParam(number) {
  let str = "";
  for (let i = 0; i < number; i++) {
    if (i === 0) {
      str = "??";
    } else {
      str = str + ",??";
    }
  }
  return `(${str})`;
}
function arrayParam(number) {
  let str = "";
  for (let i = 0; i < number; i++) {
    if (i === 0) {
      str = "?";
    } else {
      str = str + ",?";
    }
  }
  return `(${str})`;
}
function isset(obj) {
  return typeof obj !== "undefined";
}
function namify(text) {
  return text
    .replace("_", " ")
    .replace(/(^\w{1})|(\s+\w{1})/g, (letter) => letter.toUpperCase());
}
module.exports = {
  connect,
  get,
  list,
  where,
  query,
  qcount,
  remove,
  change,
  pool,
};
