const {
  RemovePK,
  getPayloadValidator,
  validateInput,
  dataToFilter,
  RemoveUnknownData,
} = require("./validator");
const { getType, jsonStringify, jsonSafeParse } = require("./function");
module.exports = function model(
  db,
  table,
  modelStructure = {},
  primary_key = "id",
  unique = [],
  option = { safeDelete: null }
) {
  return {
    insert: async (data) => {
      if (data.hasOwnProperty("data")) {
        RemovePK(primary_key, data.data);
        await validateInput(
          data,
          getPayloadValidator("CREATE", modelStructure, primary_key, true)
        );
        data = data.data;
      } else {
        delete data[primary_key];
        await validateInput(
          data,
          getPayloadValidator("CREATE", modelStructure, primary_key, false)
        );
      }
      data = jsonStringify(data);
      const insertResult = await db.insert(table, data, unique);
      if (insertResult.hasOwnProperty("id")) {
        const getResult = await db.get(table, [
          [[primary_key, "=", insertResult.id]],
        ]);
        return getResult.count > 0 ? getResult["data"][0] : null;
      }
      //TODO: Bulk Insert -> Return inserted objects
      return insertResult;
    },
    update: async (data) => {
      let updateResult = null;
      if (data.hasOwnProperty("data")) {
        await validateInput(
          data,
          getPayloadValidator("UPDATE", modelStructure, primary_key, true)
        );
        data = data.data;
        data = RemoveUnknownData(modelStructure, data);
        data = jsonStringify(data);
        updateResult = await db.upsert(table, data, unique);
        //TODO: Bulk Update -> Return updated objects
      } else {
        await validateInput(
          data,
          getPayloadValidator("UPDATE", modelStructure, primary_key, false)
        );
        data = RemoveUnknownData(modelStructure, [data]);
        data = jsonStringify(data);
        updateResult = await db.upsert(table, data, unique);
        if (updateResult.hasOwnProperty("id") && updateResult.id > 0) {
          const getResult = await db.get(table, [
            [[primary_key, "=", updateResult.id]],
          ]);
          return getResult.count > 0 ? getResult["data"][0] : null;
        } else if (data[0].hasOwnProperty(primary_key)) {
          const result = await db.get(
            table,
            [[[primary_key, "=", data[0][primary_key]]]],
            [],
            option.safeDelete
          );
          if (result.count > 0) return result["data"][0];
          else return null;
        }
      }
      return updateResult;
    },
    upsert: async (data) => {
      //* Same as Update but primary key is optional */
      let updateResult = null;
      if (data.hasOwnProperty("data")) {
        await validateInput(
          data,
          getPayloadValidator("CREATE", modelStructure, primary_key, true)
        );
        data = data.data;
        data = RemoveUnknownData(modelStructure, data);
        data = jsonStringify(data);
        updateResult = await db.upsert(table, data, unique);
        //TODO: Bulk Upsert -> Return Inserted/Updated objects
      } else {
        await validateInput(
          data,
          getPayloadValidator("CREATE", modelStructure, primary_key, false)
        );
        data = RemoveUnknownData(modelStructure, [data]);
        data = jsonStringify(data);
        updateResult = await db.upsert(table, data, unique);
        if (updateResult.hasOwnProperty("id")) {
          const getResult = await db.get(table, [
            [[primary_key, "=", updateResult.id]],
          ]);
          return getResult.count > 0 ? getResult["data"][0] : null;
        } else if (data.hasOwnProperty(primary_key)) {
          const result = await db.get(
            table,
            [[[primary_key, "=", data[primary_key]]]],
            option.safeDelete
          );
          if (result.count > 0) return result["data"][0];
          else return null;
        }
      }
      return updateResult;
    },
    remove: async (data) => {
      let filter = dataToFilter(jsonSafeParse(data), primary_key);
      return await db.remove(table, filter, option.safeDelete);
    },
    byId: async (id) => {
      let type = getType(id);
      if (type === "string" || type === "number") {
        const result = await db.get(
          table,
          [[[primary_key, "=", id]]],
          [],
          option.safeDelete
        );
        if (result.count > 0) return result["data"][0];
        else return null;
      } else {
        throw new Error("Invalid id value", { cause: { status: 422 } });
      }
    },
    //TODO: Implement Sort Logic
    find: async (data) => {
      let sort = [];
      if (data.hasOwnProperty("sort")) {
        sort = data.sort;
        delete data.sort;
        sort = jsonSafeParse(sort);
      }
      let filter = dataToFilter(jsonSafeParse(data), primary_key);
      return await db.get(table, filter, sort, option.safeDelete);
    },
    findOne: async (data) => {
      let sort = [];
      if (data.hasOwnProperty("sort")) {
        sort = data.sort;
        delete data.sort;
        sort = jsonSafeParse(sort);
      }
      let filter = dataToFilter(jsonSafeParse(data), primary_key);
      let result = await db.get(table, filter, sort, option.safeDelete);
      if (result.count > 0) {
        return result["data"][0];
      } else {
        return false;
      }
    },
    list: async (data) => {
      let page = 0;
      let size = 30;
      let sort = [];
      if (data.hasOwnProperty("page")) {
        page = data.page;
        delete data.page;
      }
      if (data.hasOwnProperty("size")) {
        size = data.size;
        delete data.size;
      }
      if (data.hasOwnProperty("sort")) {
        sort = data.sort;
        delete data.sort;
      }
      let filter = dataToFilter(jsonSafeParse(data), primary_key);
      sort = jsonSafeParse(sort);
      return await db.list(table, filter, sort, option.safeDelete, page, size);
    },
    pk: primary_key,
    modelStructure,
    table,
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
