const { RemovePK, objectToFilter, getType, empty, getPayloadValidator, validateInput, stringify } = require("./function");

module.exports = function model(db, table, modelStructure = {}, primary_key, unique, option = {}) {
  return {
    insert: async (data) => {
      if (data.hasOwnProperty("data")) {
        RemovePK(primary_key, data.data);
        await validateInput(data, getPayloadValidator("CREATE", modelStructure, primary_key, true));
        data = data.data;
      } else {
        delete data[primary_key];
        await validateInput(data, getPayloadValidator("CREATE", modelStructure, primary_key, false));
      }
      data = stringify(data);
      const insertResult = await db.upsert(table, data, unique);
      if (insertResult.hasOwnProperty("id")) {
        const getResult = await db.get(table, [[[primary_key, "=", insertResult.id]]]);
        return getResult.count > 0 ? getResult["data"][0] : null;
      }
      return insertResult;
    },
    update: async (data) => {
      let updateResult = null;
      if (data.hasOwnProperty("data")) {
        await validateInput(data, getPayloadValidator("UPDATE", modelStructure, primary_key, true));
        data = data.data;
        data = stringify(data);
        updateResult = await db.upsert(table, data, unique);
      } else {
        await validateInput(data, getPayloadValidator("UPDATE", modelStructure, primary_key, false));
        data = stringify(data);
        updateResult = await db.upsert(table, data, unique);
        if (updateResult.hasOwnProperty("id")) {
          const getResult = await db.get(table, [[[primary_key, "=", updateResult.id]]]);
          return getResult.count > 0 ? getResult["data"][0] : null;
        }
      }
      return updateResult;
    },
    upsert: async (data) => {
      let updateResult = null;
      if (data.hasOwnProperty("data")) {
        await validateInput(data, getPayloadValidator("CREATE", modelStructure, primary_key, true));
        data = data.data;
        data = stringify(data);
        updateResult = await db.upsert(table, data, unique);
      } else {
        await validateInput(data, getPayloadValidator("CREATE", modelStructure, primary_key, false));
        data = stringify(data);
        updateResult = await db.upsert(table, data, unique);
        if (updateResult.hasOwnProperty("id")) {
          const getResult = await db.get(table, [[[primary_key, "=", updateResult.id]]]);
          return getResult.count > 0 ? getResult["data"][0] : null;
        }
      }
      return updateResult;
    },
    remove: async (filter) => {
      switch (getType(filter)) {
        case "array":
          await db.remove(table, filter);
          return true;
        case "object":
          await db.remove(table, objectToFilter(filter));
          return true;
        case "number":
        case "string":
          await db.remove(table, [[[primary_key, "=", filter]]]);
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
    find: async (filter) => {
      switch (getType(filter)) {
        case "array":
          return await db.get(table, filter);
        case "object":
          return await db.get(table, objectToFilter(filter));
        case "number":
        case "string":
          return await db.get(table, [[[primary_key, "=", filter]]]);
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
