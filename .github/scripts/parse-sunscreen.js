import yaml from "js-yaml";

export function extractYamlBlock(issueBody) {
  const match = issueBody.match(/```yaml([\s\S]*?)```/);
  if (!match) {
    throw new Error("No YAML block found in issue body.");
  }
  return match[1];
}

export function parseYamlBlock(yamlText) {
  return yaml.load(yamlText);
}

export function validateRequiredFields(data) {
  const required = ["brand", "product_name", "regions_sold"];
  const missing = required.filter(
    (field) => !data[field] || data[field].length === 0
  );
  if (missing.length) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }
}

export function normalizeRegions(regions) {
  const map = {
    us: "US",
    usa: "US",
    kr: "KR",
    korea: "KR",
    eu: "EU",
    jp: "JP",
    japan: "JP",
    au: "AU",
    australia: "AU"
  };

  return regions.map((r) => map[r.toLowerCase()] ?? r.toUpperCase());
}

export function calculateSunscreenType(filters = []) {
  const inorganic = ["zinc oxide", "titanium dioxide"];

  const hasInorganic = filters.some(f =>
    inorganic.some(i => f.toLowerCase().includes(i))
  );
  const hasOrganic = filters.length > 0 && !hasInorganic;

  if (hasInorganic && hasOrganic) return "hybrid";
  if (hasInorganic) return "mineral";
  if (hasOrganic) return "chemical";
  return null;
}

export function detectFragrance(ingredientsText = "") {
  const fragranceKeywords = [
    "fragrance",
    "parfum",
    "aroma",
    "essential oil"
  ];
  return fragranceKeywords.some(k =>
    ingredientsText.toLowerCase().includes(k)
  )
    ? "present"
    : "none stated";
}

export function buildCanonicalObject(raw) {
  return {
    brand: raw.brand,
    product_name: raw.product_name,
    spf: raw.spf ? Number(String(raw.spf).replace(/\D/g, "")) : null,
    pa_rating: raw.pa_rating ?? null,
    sunscreen_type: calculateSunscreenType(raw.uv_filters || []),
    uv_filters: raw.uv_filters || [],
    regions_sold: normalizeRegions(raw.regions_sold || []),
    fragrance: detectFragrance(raw.notes || ""),
    source_url: raw.source_url ?? null,
    notes: raw.notes ?? ""
  };
}
