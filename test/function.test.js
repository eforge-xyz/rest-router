//const {  } = require("../src/function");
const assert = require("assert");
function objectSelecter(obj, picker) {
  for (let i of picker) {
    if (obj.hasOwnProperty(i)) {
      obj = obj[i];
    } else {
      return null;
    }
  }
  return obj;
}
describe("Common Function", function () {
  it("objectSelecter ", function () {
    let obj = { body: { user: { user_id: 123 } } };
    let value = objectSelecter(obj, ["body", "user", "user_id"]);
    assert.equal(value, 123);
  });
  it("override ", function () {
    let input = {
      user_id: 1,
      type: "Admin",
      description: "Details about the user",
    };
    let replacer = { user: { user_id: 2, type: "User" } };
    let mapper = { user_id: ["user", "id"] };
    let objUpd = override(input, replacer, mapper);
    assert.equal(objUpd.user_id, 123);
  });
});
