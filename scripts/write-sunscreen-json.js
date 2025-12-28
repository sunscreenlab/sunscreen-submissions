import fs from "fs";
import path from "path";

// ----------------------------
// INPUT (from GitHub Actions)
// ----------------------------

const {
  SUNSCREEN_ID,
  SUNSCREEN_CANONICAL_JSON
} = process.env;

if (!SUNSCREEN_ID || !SUNSCREEN_CANONICAL_JSON) {
  console.error(
    "❌ Missing required environment variables.\n" +
    "Expected SUNSCREEN_ID and SUNSCREEN_CANONICAL_JSON."
  );
  process.exit(1);
}

let canonical;
try {
  canonical = JSON.parse(SUNSCREEN_CANONICAL_JSON);
} catch (err) {
  console.error("❌ Failed to parse SUNSCREEN_CANONICAL_JSON.");
  process.exit(1);
}

// ----------------------------
// FILE PATH
// ----------------------------

const DATA_FILE = path.resolve("sunscreens.json");

// ----------------------------
// READ EXISTING DATA
// ----------------------------

let data = [];

if (fs.existsSync(DATA_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));

    if (!Array.isArray(data)) {
      throw new Error("sunscreens.json is not an array");
    }
  } catch (err) {
    console.error(
      "❌ Failed to read sunscreens.json:",
      err.message
    );
    process.exit(1);
  }
}

// ----------------------------
// DUPLICATE CHECK (REJECT)
// ----------------------------

const index = data.findIndex(item => item.id === SUNSCREEN_ID);

if (index >= 0) {
  console.error(
    "❌ Duplicate sunscreen detected.\n\n" +
    `An entry with id "${SUNSCREEN_ID}" already exists in sunscreens.json.\n\n` +
    "No data was written. This submission requires manual review."
  );
  process.exit(1);
}

// ----------------------------
// APPEND NEW ENTRY
// ----------------------------

console.log(`➕ Adding new sunscreen: ${SUNSCREEN_ID}`);
data.push(canonical);

// ----------------------------
// WRITE BACK TO FILE
// ----------------------------

try {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(data, null, 2) + "\n",
    "utf-8"
  );
  console.log("✅ sunscreens.json updated successfully.");
} catch (err) {
  console.error(
    "❌ Failed to write sunscreens.json:",
    err.message
  );
  process.exit(1);
}
