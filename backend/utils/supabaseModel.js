const { supabaseAdmin } = require("../config/supabase");

const snakeToCamel = key =>
  String(key).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

const camelToSnake = key =>
  String(key)
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase();

const mapRowToDoc = row => {
  if (!row) return null;
  const mapped = {};
  Object.entries(row).forEach(([key, value]) => {
    if (key === "id") {
      mapped._id = value;
      return;
    }
    mapped[snakeToCamel(key)] = value;
  });

  if (!mapped._id && row.id) {
    mapped._id = row.id;
  }

  return mapped;
};

const mapDocToRow = doc => {
  if (!doc) return {};
  const mapped = {};
  Object.entries(doc).forEach(([key, value]) => {
    if (key === "_id") {
      mapped.id = value;
      return;
    }
    if (key === "__model") return;
    mapped[camelToSnake(key)] = value;
  });
  return mapped;
};

const normalizeError = error => {
  if (!error) return error;
  if (error.code === "23505") {
    const duplicate = new Error(error.message || "Duplicate value");
    duplicate.code = 11000;
    return duplicate;
  }
  const generic = new Error(error.message || "Database error");
  generic.code = error.code;
  return generic;
};

const matchFilter = (row, filter) => {
  if (!filter || typeof filter !== "object") return true;

  if (Array.isArray(filter.$or)) {
    return filter.$or.some(part => matchFilter(row, part));
  }

  return Object.entries(filter).every(([key, value]) => {
    if (key === "$or") return true;

    const rowValue = row[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (Array.isArray(value.$in)) {
        return value.$in.map(String).includes(String(rowValue));
      }
      if (value.$ne !== undefined) {
        return String(rowValue) !== String(value.$ne);
      }
      if (value.$regex !== undefined) {
        const flags = String(value.$options || "");
        const regex = new RegExp(String(value.$regex), flags);
        return regex.test(String(rowValue || ""));
      }
    }
    return String(rowValue) === String(value);
  });
};

const toDocument = (ModelClass, row) => {
  if (!row) return null;
  const data = mapRowToDoc(row);
  return new ModelClass(data);
};

class BaseDocument {
  constructor(data) {
    Object.assign(this, data);
  }

  async save() {
    return this.constructor.saveDocument(this);
  }
}

const createSupabaseModel = tableName => {
  return class SupabaseModel extends BaseDocument {
    static get tableName() {
      return tableName;
    }

    static async saveDocument(doc) {
      const payload = mapDocToRow(doc);
      payload.updated_at = new Date().toISOString();

      let data;
      let error;
      if (payload.id) {
        ({ data, error } = await supabaseAdmin
          .from(this.tableName)
          .update(payload)
          .eq("id", payload.id)
          .select()
          .single());
      } else {
        payload.created_at = payload.created_at || new Date().toISOString();
        ({ data, error } = await supabaseAdmin
          .from(this.tableName)
          .insert(payload)
          .select()
          .single());
      }

      if (error) throw normalizeError(error);
      Object.assign(doc, mapRowToDoc(data));
      return doc;
    }

    static async create(payload) {
      const doc = new this(payload);
      await doc.save();
      return doc;
    }

    static async find(filter = {}) {
      const { data, error } = await supabaseAdmin.from(this.tableName).select("*");
      if (error) throw normalizeError(error);
      return (data || [])
        .map(row => mapRowToDoc(row))
        .filter(doc => matchFilter(doc, filter))
        .map(doc => new this(doc));
    }

    static async findOne(filter = {}) {
      const list = await this.find(filter);
      return list[0] || null;
    }

    static async findById(id) {
      if (!id) return null;
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw normalizeError(error);
      return toDocument(this, data);
    }

    static async findByIdAndUpdate(id, payload) {
      const existing = await this.findById(id);
      if (!existing) return null;
      Object.assign(existing, payload || {});
      await existing.save();
      return existing;
    }

    static async findByIdAndDelete(id) {
      if (!id) return null;
      const existing = await this.findById(id);
      if (!existing) return null;
      const { error } = await supabaseAdmin.from(this.tableName).delete().eq("id", id);
      if (error) throw normalizeError(error);
      return existing;
    }

    static async deleteMany(filter = {}) {
      const list = await this.find(filter);
      if (!list.length) return { deletedCount: 0 };
      const ids = list.map(item => item._id);
      const { error } = await supabaseAdmin.from(this.tableName).delete().in("id", ids);
      if (error) throw normalizeError(error);
      return { deletedCount: ids.length };
    }

    static async countDocuments(filter = {}) {
      const list = await this.find(filter);
      return list.length;
    }

    static async exists(filter = {}) {
      const item = await this.findOne(filter);
      return !!item;
    }
  };
};

module.exports = { createSupabaseModel };
