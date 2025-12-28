// scripts/generateSunscreenEntry.js

function generateId(brand, product) {
  if (!brand || !product) {
    throw new Error("Brand and product are required to generate ID");
  }

  const normalize = (str) => {
    return str
      .toLowerCase()

      // remove SPF patterns (SPF 30, SPF50+, etc.)
      .replace(/\bspf\s*\d+\+?\b/gi, "")

      // remove PA ratings (PA+, PA++++)
      .replace(/\bpa\+{1,4}\b/gi, "")

      // remove trademark symbols
      .replace(/[™®©]/g, "")

      // replace spaces, slashes, underscores with hyphens
      .replace(/[\s/_]+/g, "-")

      // remove anything not alphanumeric or hyphen
      .replace(/[^a-z0-9-]/g, "")

      // collapse multiple hyphens
      .replace(/-+/g, "-")

      // trim leading/trailing hyphens
      .replace(/^-|-$/g, "");
  };

  const brandSlug = normalize(brand);
  const productSlug = normalize(product);

  return `${brandSlug}-${productSlug}`;
}

// ----------------------------
// INPUT HANDLING
// ----------------------------

// Read from environment variables (GitHub Actions style)
const brandFromEnv = process.env.SUNSCREEN_BRAND;
const productFromEnv = process.env.SUNSCREEN_PRODUCT;

// Local fallback for testing
const brand = brandFromEnv || "AHC";
const product = productFromEnv || "AHC Masters Aqua Rich Sun Cream SPF 50+ PA++++";

if (!brand || !product) {
  throw new Error(
    "Missing required input. Provide SUNSCREEN_BRAND and SUNSCREEN_PRODUCT."
  );
}

// ----------------------------
// PROCESS
// ----------------------------

const id = generateId(brand, product);

const sunscreenEntry = {
  brand,
  product,
  id
};

// ----------------------------
// OUTPUT
// ----------------------------

console.log("Generated sunscreen entry:");
console.log(JSON.stringify(sunscreenEntry, null, 2));
