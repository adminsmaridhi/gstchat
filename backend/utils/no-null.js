/**
 * Mongoose plugin: never persist `null` values.
 * Applies to new saves, findOneAndUpdate/updateOne/updateMany, and upserts.
 */
const VALID_HOOKS = ["save", "findOneAndUpdate", "updateOne", "updateMany"];

function stripNullUpdate(update) {
  if (!update || typeof update !== "object") return;
  for (const key of Object.keys(update)) {
    if (update[key] === null) delete update[key];
  }
}

module.exports = function noNullValues(schema) {
  schema.pre("save", function (next) {
    const paths = Object.keys(this.toObject({ versionKey: false, depopulate: true }));
    for (const path of paths) {
      if (this[path] === null) this[path] = undefined;
    }
    next();
  });

  for (const hook of VALID_HOOKS) {
    if (hook === "save") continue;
    schema.pre(hook, function (next) {
      const update = this.getUpdate ? this.getUpdate() : this._update;
      if (!update) return next();
      stripNullUpdate(update.$set);
      stripNullUpdate(update.$setOnInsert);
      stripNullUpdate(update);
      if (update.$set && Object.keys(update.$set).length === 0) delete update.$set;
      next();
    });
  }
};