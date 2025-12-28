import { UV_FILTERS } from "./uv-filters.js";

/**
 * Extract the text that follows a given markdown section heading
 * Example:
 * ### Brand name
 * Abib
 */
function extractSection(body, heading) {
  const regex = new RegExp(
    `### ${heading}\\n([\\s\\S]*?)(?=\\n### |$)`,
    "i"
  );
  const match = body.match(regex);
  if (!match) return null;

  return match[1]
    .replace(/```[a-z]*?/gi, "") // remove code fences if present
    .trim();
}

/**
 * Normalize yes/no values to boolean or null
 */
function normalizeYesNo(value) {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (v === "yes") return true;
  if (v === "no") return false;
  return null;
}

/**
 * Detect UV filters from ingredient list
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
  const required = ["brand", "product_name", "ingredients_inci"];
  const missing = required.filter((f) => !data[f]);

  if (missing.length) {
    throw new Error(
      `Missing required fields: ${missing.join(", ")}`
    );
  }
}

/**
 * Derive sunscreen type from UV filters
 */
function deriveSunscreenType(uvFilters) {
  if (!uvFilters || uvFilters.length === 0) return null;

  const hasMineral = uvFilters.some(f => f.type === "mineral");
  const hasChemical = uvFilters.some(f => f.type === "chemical");

  if (hasMineral && hasChemical) return "hybrid";
  if (hasMineral) return "mineral";
  if (hasChemical) return "chemical";

  return null;
}

/**
 * Build canonical sunscreen object (dry run)
 */
function buildCanonical(data) {
  const uvFilters = detectUvFilters(data.ingredients_inci);
  const sunscreenType = deriveSunscreenType(uvFilters);

  return {
    brand: data.brand,
    product_name: data.product_name,

    sunscreen_type: sunscreenType, // mineral | chemical | hybrid | null

    spf: data.spf
      ? Number(data.spf.replace(/\D/g, "")) || null
      : null,

    pa_rating: data.pa_rating || null,

    korean: normalizeYesNo(data.korean),

    uv_filters: uvFilters,

    ingredients_inci: data.ingredients_inci,
    source_url: data.source_url || null,
    notes: data.notes || null
  };
}


/**
 * Entry point (GitHub Actions)
 */
if (process.env.ISSUE_BODY) {
  try {
    const body = process.env.ISSUE_BODY;

    const parsed = {
      brand: extractSection(body, "Brand name"),
      product_name: extractSection(body, "Product name"),
      spf: extractSection(body, "SPF \\(if known\\)"),
      pa_rating: extractSection(body, "PA / UVA rating \\(if known\\)"),
      ingredients_inci: extractSection(body, "Ingredients \\(INCI\\)"),
      korean: extractSection(body, "Is this a Korean product\\?"),
      source_url: extractSection(body, "Source URL"),
      notes: extractSection(body, "Notes \\(optional\\)")
    };

    validateRequired(parsed);

    const canonical = buildCanonical(parsed);

    console.log("✅ Parsed sunscreen (dry run):");
    console.log(JSON.stringify(canonical, null, 2));
  } catch (err) {
    console.error("❌ Parsing failed:", err.message);
    process.exit(1);
  }
}
