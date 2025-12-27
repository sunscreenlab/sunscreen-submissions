import yaml from "js-yaml";
import { UV_FILTERS } from "./uv-filters.js";

/**
 * Extract the fenced ```yaml block from the issue body
 */
function extractYamlBlock(body) {
  const match = body.match(/```yaml([\s\S]*?)```/i);
  if (!match) {
    throw new Error("No fenced YAML block found in issue body.");
  }
  return match[1];
}

/**
 * Normalize yes/no values to boolean or null
 */
function normalizeYesNo(value) {
  if (!value) return null;
  const v = String(value).trim().toLowerCase();
  if (v === "yes" || v === "true") return true;
  if (v === "no" || v === "false") return false;
  return null;
}

/**
 * Detect UV filters from the INCI ingredient list
 */
function detectUvFilters(ingredients) {
  if (!ingredients) return [];

  const text = ingredients.toLowerCase();
  const detected = [];

  for (const filter of UV_FILTERS) {
    const names = [
      filter.inci,
      ...(filter.aka || [])
    ];

    for (const name of names) {
      if (text.includes(name.toLowerCase())) {
        detected.push({
          inci: filter.inci,
          type: filter.type
        });
        break;
      }
    }
  }

  return detected;
}

/**
 * Validate required fields
 */
function validateRequired(data) {
  const required = ["brand", "product_name"];
  const missing = required.filter(
    (f) =>
      !data[f] ||
      (Array.isArray(data[f]) && data[f].length === 0)
  );

  if (missing.length) {
    throw new Error(
      `Missing required fields: ${missing.join(", ")}`
    );
  }
}

/**
 * Build canonical sunscreen object (dry run)
 */
function buildCanonical(data) {
  const detectedUvFilters = detectUvFilters(data.ingredients_inci);

  return {
    brand: data.brand ?? null,
    product_name: data.product_name ?? null,

    korean: normalizeYesNo(data.korean),

    spf: data.spf
      ? Number(String(data.spf).replace(/\D/g, "")) || null
      : null,

    pa_rating: data.pa_rating ?? null,
    uvas_rating: data.uvas_rating ?? null,

    uv_filters: detectedUvFilters,

    ingredients_inci: data.ingredients_inci ?? null,
    source_url: data.source_url ?? null,
    notes: data.notes ?? null,
  };
}

/**
 * Entry point when run by GitHub Actions
 */
if (process.env.ISSUE_BODY) {
  try {
    const yamlText = extractYamlBlock(process.env.ISSUE_BODY);
    const parsed = yaml.load(yamlText);

    validateRequired(parsed);

    const canonical = buildCanonical(parsed);

    console.log("✅ Parsed sunscreen (dry run):");
    console.log(JSON.stringify(canonical, null, 2));
  } catch (err) {
    console.error("❌ Parsing failed:", err.message);
    process.exit(1);
  }
}
