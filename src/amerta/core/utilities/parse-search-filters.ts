import { ProductOption } from "@/payload-types";

export const parseSearchFilters = (query: { [key: string]: string | string[] | undefined }, options: ProductOption[], allowCollectionFilter: boolean = true) => {
  const { sort, brand, collection, minPrice, maxPrice, ...rest } = query;

  const whereQuery: any = {
    and: [],
  };

  if (brand) {
    const brandIds = Array.isArray(brand) ? brand : [brand];
    whereQuery.and.push({
      brand: {
        in: brandIds,
      },
    });
  }

  if (collection && allowCollectionFilter) {
    const collectionIds = Array.isArray(collection) ? collection : [collection];
    whereQuery.and.push({
      collections: {
        in: collectionIds,
      },
    });
  }

  if (minPrice) {
    const val = parseFloat(minPrice as string);
    whereQuery.and.push({
      or: [
        { type: { equals: "simple" }, price: { greater_than_equal: val } },
        { type: { equals: "variant" }, "variants.price": { greater_than_equal: val } },
      ],
    });
  }

  if (maxPrice) {
    const val = parseFloat(maxPrice as string);
    whereQuery.and.push({
      or: [
        { type: { equals: "simple" }, price: { less_than_equal: val } },
        { type: { equals: "variant" }, "variants.price": { less_than_equal: val } },
      ],
    });
  }

  options.forEach((option) => {
    const paramValue = rest[`opt_${option.id}`];
    if (paramValue) {
      const selectedValues = Array.isArray(paramValue) ? paramValue : [paramValue];
      const orCondition: any[] = [];
      selectedValues.forEach((value) => {
        orCondition.push({
          [`variants.variant.${option.id}.value`]: {
            equals: value,
          },
        });
      });
      whereQuery.and.push({ or: orCondition });
    }
  });

  let sortQuery: any = "-createdAt";
  if (sort) {
    switch (sort) {
      case "price-asc":
        sortQuery = "price";
        break;
      case "price-desc":
        sortQuery = "-price";
        break;
      case "name-asc":
        sortQuery = "title";
        break;
      case "name-desc":
        sortQuery = "-title";
        break;
      case "newest":
        sortQuery = "-createdAt";
        break;
      case "oldest":
        sortQuery = "createdAt";
        break;
      default:
        sortQuery = "-createdAt";
    }
  }

  return { whereQuery, sortQuery };
};
