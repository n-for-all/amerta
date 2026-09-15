/**
 * Complete set of valid W3C standard named colors supported natively by all web browsers.
 */
const W3C_CSS_COLORS = new Set([
  "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige", "bisque",
  "black", "blanchedalmond", "blue", "blueviolet", "brown", "burlywood", "cadetblue",
  "chartreuse", "chocolate", "coral", "cornflowerblue", "cornsilk", "crimson", "cyan",
  "darkblue", "darkcyan", "darkgoldenrod", "darkgray", "darkgreen", "darkgrey", "darkkhaki",
  "darkmagenta", "darkolivegreen", "darkorange", "darkorchid", "darkred", "darksalmon",
  "darkseagreen", "darkslateblue", "darkslategray", "darkslategrey", "darkturquoise",
  "darkviolet", "deeppink", "deepskyblue", "dimgray", "dimgrey", "dodgerblue", "firebrick",
  "floralwhite", "forestgreen", "fuchsia", "gainsboro", "ghostwhite", "gold", "goldenrod",
  "gray", "green", "greenyellow", "grey", "honeydew", "hotpink", "indianred", "indigo",
  "ivory", "khaki", "lavender", "lavenderblush", "lawngreen", "lemonchiffon", "lightblue",
  "lightcoral", "lightcyan", "lightgoldenrodyellow", "lightgray", "lightgreen", "lightgrey",
  "lightpink", "lightsalmon", "lightseagreen", "lightskyblue", "lightslategray", "lightslategrey",
  "lightsteelblue", "lightyellow", "lime", "limegreen", "linen", "magenta", "maroon",
  "mediumaquamarine", "mediumblue", "mediumorchid", "mediumpurple", "mediumseagreen",
  "mediumslateblue", "mediumspringgreen", "mediumturquoise", "mediumvioletred", "midnightblue",
  "mintcream", "mistyrose", "moccasin", "navajowhite", "navy", "oldlace", "olive",
  "olivedrab", "orange", "orangered", "orchid", "palegoldenrod", "palegreen", "paleturquoise",
  "palevioletred", "papayawhip", "peachpuff", "peru", "pink", "plum", "powderblue",
  "purple", "rebeccapurple", "red", "rosybrown", "royalblue", "saddlebrown", "salmon",
  "sandybrown", "seagreen", "seashell", "sienna", "silver", "skyblue", "slateblue",
  "slategray", "slategrey", "snow", "springgreen", "steelblue", "tan", "teal", "thistle",
  "tomato", "turquoise", "violet", "wheat", "white", "whitesmoke", "yellow", "yellowgreen",
]);

/**
 * Comprehensive mapping of e-commerce, fashion, apparel, and dropshipping color names to CSS hex codes.
 */
const COLOR_DICTIONARY: Record<string, string> = {
  // --- CJ / Dropshipping Specifics & Chinese Translation Terms ---
  "wine red": "#722f37",
  "winered": "#722f37",
  "rose red": "#c21e56",
  "rosered": "#c21e56",
  "brick red": "#cb4154",
  "brickred": "#cb4154",
  "watermelon red": "#fc6c85",
  "watermelonred": "#fc6c85",
  "rust red": "#8d2b0e",
  "rustred": "#8d2b0e",
  "dark red": "#8b0000",
  "darkred": "#8b0000",
  "bean paste": "#a8656d",
  "beanpaste": "#a8656d",
  "bean red": "#a8656d",
  "beanred": "#a8656d",
  "jujube red": "#7c1c24",
  "jujubered": "#7c1c24",

  // Blues
  "tiffany blue": "#0abab5",
  "tiffanyblue": "#0abab5",
  "tiffany": "#0abab5",
  "sky blue": "#87ceeb",
  "skyblue": "#87ceeb",
  "sapphire blue": "#0f52ba",
  "sapphireblue": "#0f52ba",
  "sapphire": "#0f52ba",
  "navy blue": "#000080",
  "navyblue": "#000080",
  "navy": "#000080",
  "royal blue": "#4169e1",
  "royalblue": "#4169e1",
  "light blue": "#add8e6",
  "lightblue": "#add8e6",
  "baby blue": "#89cff0",
  "babyblue": "#89cff0",
  "lake blue": "#2a52be",
  "lakeblue": "#2a52be",
  "peacock blue": "#005f69",
  "peacockblue": "#005f69",
  "haze blue": "#8da399",
  "hazeblue": "#8da399",
  "fog blue": "#869da8",
  "fogblue": "#869da8",
  "mist blue": "#a2b4bc",
  "mistblue": "#a2b4bc",
  "ice blue": "#d0f0fd",
  "iceblue": "#d0f0fd",
  "klein blue": "#002fa7",
  "kleinblue": "#002fa7",
  "denim blue": "#1560bd",
  "denim": "#1560bd",

  // Greens
  "dark green": "#006400",
  "darkgreen": "#006400",
  "grass green": "#7cfc00",
  "grassgreen": "#7cfc00",
  "emerald green": "#50c878",
  "emeraldgreen": "#50c878",
  "emerald": "#50c878",
  "army green": "#4b5320",
  "armygreen": "#4b5320",
  "military green": "#4b5320",
  "militarygreen": "#4b5320",
  "forest green": "#228b22",
  "forestgreen": "#228b22",
  "olive green": "#556b2f",
  "olivegreen": "#556b2f",
  "mint green": "#98ff98",
  "mintgreen": "#98ff98",
  "mint": "#98ff98",
  "sage green": "#9caf88",
  "sagegreen": "#9caf88",
  "sage": "#9caf88",
  "matcha green": "#789262",
  "matchagreen": "#789262",
  "matcha": "#789262",
  "avocado green": "#568203",
  "avocadogreen": "#568203",
  "avocado": "#568203",
  "bean green": "#9bc995",
  "beangreen": "#9bc995",
  "fruit green": "#68b93c",
  "fruitgreen": "#68b93c",
  "pine green": "#01796f",
  "pinegreen": "#01796f",

  // Purples
  "light purple": "#b19cd9",
  "lightpurple": "#b19cd9",
  "taro purple": "#b497bd",
  "taropurple": "#b497bd",
  "taro": "#b497bd",
  "dark purple": "#4b0082",
  "darkpurple": "#4b0082",
  "deep purple": "#36013f",
  "deeppurple": "#36013f",
  "lilac purple": "#c8a2c8",
  "lilac": "#c8a2c8",
  "lavender": "#e6e6fa",
  "grape purple": "#6f2da8",
  "grape": "#6f2da8",
  "mauve": "#e0b0ff",
  "plum": "#dda0dd",
  "violet": "#ee82ee",

  // Yellows & Golds
  "golden yellow": "#ffd700",
  "goldenyellow": "#ffd700",
  "golden": "#ffd700",
  "gold": "#ffd700",
  "bright yellow": "#ffea00",
  "brightyellow": "#ffea00",
  "lemon yellow": "#fff44f",
  "lemonyellow": "#fff44f",
  "mustard yellow": "#ffdb58",
  "mustardyellow": "#ffdb58",
  "mustard": "#ffdb58",
  "ginger yellow": "#c99a3e",
  "gingeryellow": "#c99a3e",
  "ginger": "#c99a3e",
  "goose yellow": "#fff8a0",
  "gooseyellow": "#fff8a0",
  "champagne": "#f7e7ce",
  "amber": "#ffbf00",

  // Browns, Coffees & Earth Tones
  "light brown": "#b5651d",
  "lightbrown": "#b5651d",
  "dark brown": "#5c4033",
  "darkbrown": "#5c4033",
  "coffee": "#6f4e37",
  "dark coffee": "#3b2219",
  "darkcoffee": "#3b2219",
  "darkcoffeecolor": "#3b2219",
  "light coffee": "#a67b5b",
  "lightcoffee": "#a67b5b",
  "coffeecolor": "#6f4e37",
  "coffee brown": "#4a2c11",
  "coffeebrown": "#4a2c11",
  "chocolate": "#7b3f00",
  "camel": "#c19a6b",
  "light camel": "#d7b489",
  "lightcamel": "#d7b489",
  "dark camel": "#9a784e",
  "darkcamel": "#9a784e",
  "caramel": "#ffd59a",
  "cinnamon": "#d2691e",
  "khaki": "#c3b091",
  "light khaki": "#f0e68c",
  "lightkhaki": "#f0e68c",
  "dark khaki": "#bdb76b",
  "darkkhaki": "#bdb76b",
  "beige": "#f5f5dc",
  "apricot": "#fbceb1",
  "light apricot": "#fde6d2",
  "lightapricot": "#fde6d2",
  "nude": "#f3cfb3",
  "flesh": "#ffdfd3",
  "skin": "#ffdfd3",
  "tan": "#d2b48c",
  "rust": "#b7410e",

  // Whites, Blacks & Grays
  "pure white": "#ffffff",
  "purewhite": "#ffffff",
  "milk white": "#fbfbf0",
  "milkwhite": "#fbfbf0",
  "creamy white": "#fffdd0",
  "creamywhite": "#fffdd0",
  "snow white": "#fffafa",
  "snowwhite": "#fffafa",
  "off white": "#faf9f6",
  "offwhite": "#faf9f6",
  "cream": "#fffdd0",
  "ivory": "#fffff0",
  "pure black": "#000000",
  "pureblack": "#000000",
  "jet black": "#0a0a0a",
  "jetblack": "#0a0a0a",
  "silver gray": "#c0c0c0",
  "silvergray": "#c0c0c0",
  "silver grey": "#c0c0c0",
  "silvergrey": "#c0c0c0",
  "silver": "#c0c0c0",
  "light gray": "#d3d3d3",
  "lightgray": "#d3d3d3",
  "light grey": "#d3d3d3",
  "lightgrey": "#d3d3d3",
  "dark gray": "#a9a9a9",
  "darkgray": "#a9a9a9",
  "dark grey": "#a9a9a9",
  "darkgrey": "#a9a9a9",
  "smoke gray": "#708090",
  "smokegray": "#708090",
  "charcoal": "#36454f",
  "space gray": "#4a4a4a",
  "spacegray": "#4a4a4a",
  "gunmetal": "#2a3439",

  // Multi / Pattern
  "multicolor": "linear-gradient(135deg, #f87171, #fbbf24, #34d399, #60a5fa, #a78bfa)",
  "multi color": "linear-gradient(135deg, #f87171, #fbbf24, #34d399, #60a5fa, #a78bfa)",
  "multi": "linear-gradient(135deg, #f87171, #fbbf24, #34d399, #60a5fa, #a78bfa)",
  "rainbow": "linear-gradient(135deg, #ff0000, #ffa500, #ffff00, #008000, #0000ff, #800080)",
};

/**
 * Base color fallbacks for common color roots when a compound adjective isn't exact match.
 */
const BASE_COLOR_FALLBACKS: Record<string, string> = {
  purple: "#800080",
  violet: "#ee82ee",
  pink: "#ec4899",
  red: "#e11d48",
  blue: "#2563eb",
  green: "#16a34a",
  yellow: "#eab308",
  orange: "#ea580c",
  brown: "#8b5a2b",
  coffee: "#6f4e37",
  gray: "#808080",
  grey: "#808080",
  black: "#111111",
  white: "#ffffff",
  khaki: "#c3b091",
  beige: "#f5f5dc",
  silver: "#c0c0c0",
  gold: "#ffd700",
  apricot: "#fbceb1",
  camel: "#c19a6b",
  wine: "#722f37",
  rose: "#c21e56",
  teal: "#008080",
  cyan: "#00ffff",
};

/**
 * Resolves any color string, multi-word color name, or dropshipping label to a guaranteed valid CSS color/gradient.
 */
export function resolveColor(input: string | null | undefined): string {
  if (!input || typeof input !== "string") {
    return "#888888";
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return "#888888";
  }

  // 1. If already a valid hex, rgb, hsl, or gradient, return directly
  if (
    trimmed.startsWith("#") ||
    trimmed.startsWith("rgb") ||
    trimmed.startsWith("hsl") ||
    trimmed.startsWith("linear-gradient")
  ) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();

  // 2. Direct dictionary check
  if (COLOR_DICTIONARY[lower]) {
    return COLOR_DICTIONARY[lower];
  }

  // 3. Normalized stripped check (remove spaces, dashes, underscores)
  const stripped = lower.replace(/[\s\-_]+/g, "");
  if (COLOR_DICTIONARY[stripped]) {
    return COLOR_DICTIONARY[stripped];
  }

  // 4. Strip dropshipping translation suffixes like "color", "colour", "shade", "tone"
  // e.g. "darkcoffeecolor" -> "darkcoffee" -> "#3b2219"
  const withoutColorSuffix = stripped.replace(/(color|colour|shade|tone)$/, "");
  if (withoutColorSuffix && withoutColorSuffix !== stripped) {
    if (COLOR_DICTIONARY[withoutColorSuffix]) {
      return COLOR_DICTIONARY[withoutColorSuffix];
    }
  }

  // 5. Check if it is a standard native W3C CSS color (e.g. "darkgreen", "skyblue", "hotpink")
  if (W3C_CSS_COLORS.has(stripped)) {
    return stripped;
  }
  if (W3C_CSS_COLORS.has(withoutColorSuffix)) {
    return withoutColorSuffix;
  }

  // 6. Intelligent Base Color Fallback
  // Check if string ends with a known base color (e.g. "lightbrown" ends with "brown", "silvergray" ends with "gray")
  for (const [baseName, hex] of Object.entries(BASE_COLOR_FALLBACKS)) {
    if (stripped.endsWith(baseName) || withoutColorSuffix.endsWith(baseName)) {
      // If it starts with "light" or "pale", use a lighter variation or the base hex
      if (stripped.startsWith("light") || stripped.startsWith("pale")) {
        return COLOR_DICTIONARY[`light ${baseName}`] || hex;
      }
      // If it starts with "dark" or "deep", use a darker variation or the base hex
      if (stripped.startsWith("dark") || stripped.startsWith("deep")) {
        return COLOR_DICTIONARY[`dark ${baseName}`] || hex;
      }
      return hex;
    }
  }

  // 7. Last safety fallback: return a clean neutral gray rather than an unrenderable string
  return "#9ca3af";
}
