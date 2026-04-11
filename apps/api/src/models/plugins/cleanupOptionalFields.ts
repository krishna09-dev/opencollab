import { Query, Schema } from "mongoose";

type PlainObject = Record<string, unknown>;

const UPDATE_OPERATORS = ["$set", "$setOnInsert"] as const;

function isPlainObject(value: unknown): value is PlainObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function pruneNullishFromObject(input: PlainObject): PlainObject {
  const output: PlainObject = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      const cleanedArray = value
        .map((entry) => {
          if (entry === null || entry === undefined) {
            return undefined;
          }

          if (isPlainObject(entry)) {
            const cleanedEntry = pruneNullishFromObject(entry);
            return Object.keys(cleanedEntry).length > 0 ? cleanedEntry : undefined;
          }

          return entry;
        })
        .filter((entry): entry is unknown => entry !== undefined);

      output[key] = cleanedArray;
      continue;
    }

    if (isPlainObject(value)) {
      const cleanedValue = pruneNullishFromObject(value);
      if (Object.keys(cleanedValue).length > 0) {
        output[key] = cleanedValue;
      }
      continue;
    }

    output[key] = value;
  }

  return output;
}

function moveNullishToUnset(source: PlainObject, unsetPayload: PlainObject): PlainObject {
  const cleaned: PlainObject = {};

  for (const [path, value] of Object.entries(source)) {
    if (value === null || value === undefined) {
      unsetPayload[path] = "";
      continue;
    }

    if (isPlainObject(value)) {
      const cleanedNested = pruneNullishFromObject(value);
      if (Object.keys(cleanedNested).length === 0) {
        unsetPayload[path] = "";
        continue;
      }
      cleaned[path] = cleanedNested;
      continue;
    }

    cleaned[path] = value;
  }

  return cleaned;
}

function cleanUpdatePayload(update: unknown): unknown {
  if (!update || typeof update !== "object" || Array.isArray(update)) {
    return update;
  }

  const nextUpdate: PlainObject = { ...(update as PlainObject) };
  const unsetPayload: PlainObject = isPlainObject(nextUpdate.$unset)
    ? { ...(nextUpdate.$unset as PlainObject) }
    : {};

  const hasOperator = Object.keys(nextUpdate).some((key) => key.startsWith("$"));

  if (hasOperator) {
    for (const operator of UPDATE_OPERATORS) {
      if (!isPlainObject(nextUpdate[operator])) {
        continue;
      }

      const cleanedOperatorPayload = moveNullishToUnset(
        nextUpdate[operator] as PlainObject,
        unsetPayload
      );

      if (Object.keys(cleanedOperatorPayload).length > 0) {
        nextUpdate[operator] = cleanedOperatorPayload;
      } else {
        delete nextUpdate[operator];
      }
    }
  } else {
    const cleanedTopLevel = moveNullishToUnset(nextUpdate, unsetPayload);
    for (const key of Object.keys(nextUpdate)) {
      delete nextUpdate[key];
    }
    Object.assign(nextUpdate, cleanedTopLevel);
  }

  if (Object.keys(unsetPayload).length > 0) {
    nextUpdate.$unset = unsetPayload;
  }

  return nextUpdate;
}

export function cleanupOptionalFieldsPlugin(schema: Schema) {
  schema.pre("save", function cleanNullishBeforeSave(next) {
    const doc = this as any;

    if (!doc || !isPlainObject(doc._doc)) {
      next();
      return;
    }

    doc._doc = pruneNullishFromObject(doc._doc);
    next();
  });

  const queryHooks = ["updateOne", "updateMany", "findOneAndUpdate"] as const;

  for (const hook of queryHooks) {
    schema.pre(hook, function cleanNullishBeforeUpdate(next) {
      const query = this as Query<any, any>;
      const update = query.getUpdate();

      if (!update) {
        next();
        return;
      }

      query.setUpdate(cleanUpdatePayload(update) as any);
      next();
    });
  }
}
