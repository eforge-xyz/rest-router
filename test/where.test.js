/**
GET REQUEST changes
page=0&limit=30q=text
-----------------------
filter=[[["column_1",">","123"],["column_2","=","abc"]],[["column_3","=","value"],["column_name",condition,value]]]
conditions to support
=,like,in,<,>,<=,>=,!=

1st Array is OR
2nd Array is AND
3rd Array is Conditional
 */

const { fi } = require("faker/lib/locales");

let filter = [
  [
    ["column_1", "=", "123"],
    ["column_2", "=", "abc"],
  ],
  [
    ["column_3", "like", "value"],
    ["column_name", "in", ["value1", "value2", "value3"]],
  ],
];
/*let filter = [
  [
    ["phone", "in", ["98444", "98444", "98444"]],
  ],
];*/
//let filter = [[[]]];
console.log(where(filter));
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
    return {
      query: "",
      value: [],
    };
  }
  const valid_conditionals = ["=", "like", "in", "<", ">", "<=", ">=", "!="];
  let conditionOr = [];
  let value = [];
  for (const i of filter) {
    let conditionAnd = [];
    for (const j of i) {
      if (!valid_conditionals.includes(j[1])) {
        return false;
      }
      if (j[1] === "in" && !Array.isArray(j[2])) {
        return false;
      }
      if (j[1] === "in") {
        conditionAnd.push("?? in (" + arrayParam(j[2].length) + ")");
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
  let query = "((" + conditionOr.join(") OR (") + "))";
  return {
    query,
    value,
  };
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
