const { RemovePK, objectToFilter, getType, empty } = require("./function");

module.exports = function model(
  db,
  table,
  modelStructure = {},
  primary_key,
  unique,
  option = {}
) {
  return {
    insert: async (data) => {
      switch (getType(data)) {
        case "array":
          data = RemovePK(primary_key, data);
          break;
        case "object":
          delete data[primary_key];
          break;
      }
      const insertResult = await db.upsert(table, data, unique);
      const getResult = await db.get(table, [
        [[primary_key, "=", insertResult.id]],
      ]);
      return getResult.count > 0 ? getResult["data"][0] : null;
    },
    update: async (data) => {
      let updateResult = null;
      switch (getType(data)) {
        case "array":
          data = RemovePK(primary_key, data);
          updateResult = await db.upsert(table, data, unique);
          break;
        case "object":
          if (!empty(data[primary_key]));
          updateResult = await db.upsert(table, data, unique);
          break;
        default:
          throw new Error("Invalid object", data);
      }
      const getResult = await db.get(table, [
        [[primary_key, "=", updateResult.id]],
      ]);
      return getResult.count > 0 ? getResult["data"][0] : null;
    },
    upsert: async (data) => {
      return await db.upsert(table, data, unique);
    },
    remove: async (data) => {
      switch (getType(data)) {
        case "array":
          await db.remove(table, data);
          return true;
        case "object":
          await db.remove(table, objectToFilter(data));
          return true;
        case "number":
        case "string":
          await db.remove(table, [[[primary_key, "=", data]]]);
          return true;
        default:
          return false;
      }
    },
    byId: async (id) => {
      const result = await db.get(table, [[[primary_key, "=", id]]]);
      if (result.count > 0) return result["data"][0];
      else return null;
    },
    find: async (data) => {
      switch (getType(data)) {
        case "array":
          return await db.get(table, data);
        case "object":
          return await db.get(table, objectToFilter(data));
        case "number":
        case "string":
          return await db.get(table, [[[primary_key, "=", data]]]);
        default:
          return [];
      }
    },
    list: async (filter, page = 0, size = 30) => {
      //list(table, filter = [], page = 0, limit = 30)
      switch (getType(data)) {
        case "array":
          return await db.list(table, filter, page, size);
        case "object":
          return await db.list(table, objectToFilter(data), page, size);
        case "number":
        case "string":
          return await db.list(table, [[[primary_key, "=", data]]], page, size);
        default:
          return [];
      }
    },
  };
};
/*
insert 	({...},[{...},...])
update 	({...},[{...},...])
upsert 	({...},[{...},...])
remove	(id,[ids]) -> soft
byId (id)
find		(AND params {})
list		(AND params {},limit=30,page=0)
*/
