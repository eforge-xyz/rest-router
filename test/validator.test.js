const { Validator } = require("node-input-validator");
const v = new Validator([{ test_nam: "Test Name 1", unknown: "123" }], {
  tests: "required|array",
  "tests.*.test_name": "required|string",
});
const payload = [{ test_nam: "Test Name 1", unknown: "123" }];
console.log(Array.isArray(payload));
console.log(Array.isArray(payload[0]));
v.check().then((matched) => {
  if (!matched) {
    console.log(v.errors);
  } else {
    console.log("No Error");
  }
});
