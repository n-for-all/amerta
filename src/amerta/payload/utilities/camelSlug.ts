export const camelSlug = (slug) => slug.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
