const { supabaseAdmin } = require("../config/supabase");

class Setting {
  constructor(data = {}, rowId = null) {
    Object.assign(this, data || {});
    this._id = rowId;
  }

  async save() {
    const payload = { ...this };
    delete payload._id;

    if (this._id) {
      const { data, error } = await supabaseAdmin
        .from("settings")
        .update({ data: payload, updated_at: new Date().toISOString() })
        .eq("id", this._id)
        .select()
        .single();
      if (error) throw new Error(error.message || "Failed to save settings");
      this._id = data.id;
      return this;
    }

    const { data, error } = await supabaseAdmin
      .from("settings")
      .insert({ data: payload })
      .select()
      .single();
    if (error) throw new Error(error.message || "Failed to create settings");
    this._id = data.id;
    return this;
  }

  static async findOne() {
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message || "Failed to fetch settings");
    if (!data) return null;
    return new Setting(data.data || {}, data.id);
  }

  static async create(payload = {}) {
    const doc = new Setting(payload);
    await doc.save();
    return doc;
  }
}

module.exports = Setting;
