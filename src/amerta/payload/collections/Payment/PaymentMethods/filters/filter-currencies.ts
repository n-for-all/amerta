import { FilterOptions } from "payload";

export const filterCurrencies: FilterOptions = async ({ data, req }) => {
  const selectedChannelIds = data?.salesChannels;

  if (!selectedChannelIds || (Array.isArray(selectedChannelIds) && selectedChannelIds.length === 0)) {
    return {
      id: {
        in: [],
      },
    };
  }

  try {
    const channels = await req.payload.find({
      collection: "sales-channel",
      where: {
        id: { in: selectedChannelIds },
      },
      depth: 1,
      limit: 100,
    });

    const allowedCurrencyIds = channels.docs.flatMap((doc) => {
      return doc.currencies.map((c) => (typeof c.currency === "string" ? c.currency : c.currency!.id));
    });

    return {
      id: {
        in: allowedCurrencyIds,
      },
    };
  } catch (error) {
    console.error("Error filtering currencies:", error);
    return {
      id: { in: [] },
    };
  }
};
