const { RemovePK, getType, empty, getPayloadValidator, validateInput, stringify, dataToFilter } = require("./function");

module.exports = function model(db, table, modelStructure = {}, primary_key, unique, option = { safeDelete: null }) {
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
      //* Same as Update but primary key is optional */
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
    remove: async (data) => {
      let filter = dataToFilter(data, primary_key);
      return await db.remove(table, filter);
    },
    byId: async (id) => {
      let type = getType(id);
      if (type === "string" || type === "number") {
        const result = await db.get(table, [[[primary_key, "=", id]]]);
        if (result.count > 0) return result["data"][0];
        else return null;
      } else {
        throw new Error("Invalid id value", { cause: { status: 422 } });
      }
    },
    find: async (data) => {
      let filter = dataToFilter(data, primary_key);
      return await db.get(table, filter);
    },
    list: async (data) => {
      let page = 0;
      let size = 30;
      if (data.hasOwnProperty("page")) {
        page = data.page;
        delete data.page;
      }
      if (data.hasOwnProperty("size")) {
        size = data.size;
        delete data.size;
      }
      let filter = dataToFilter(data, primary_key);
      return await db.list(table, filter, page, size);
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
