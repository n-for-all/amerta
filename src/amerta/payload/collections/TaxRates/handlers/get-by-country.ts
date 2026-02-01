import { PayloadRequest } from "payload";

export const getByCountry = async (req: PayloadRequest) => {
  const { payload } = req;
  const country = req.query.country as string;

  if (!country) {
    return Response.json(
      {
        success: false,
        error: "Country ID or code is required",
      },
      { status: 400 },
    );
  }

  try {
    // First, try to find specific country tax rates
    const specificTaxes = await payload.find({
      collection: "tax-rate",
      where: {
        and: [
          {
            taxType: {
              equals: "specific",
            },
          },
          {
            countries: {
              in: [country],
            },
          },
        ],
      },
    });

    // If specific taxes found, return them
    if (specificTaxes.docs.length > 0) {
      return Response.json({
        success: true,
        data: specificTaxes.docs,
        type: "specific",
      });
    }

    // If no specific taxes, get the default tax rate
    const defaultTax = await payload.find({
      collection: "tax-rate",
      where: {
        taxType: {
          equals: "default",
        },
      },
      limit: 1,
    });

    if (defaultTax.docs.length > 0) {
      return Response.json({
        success: true,
        data: defaultTax.docs,
        type: "default",
      });
    }

    // No tax rates found
    return Response.json({
      success: true,
      data: [],
      type: "none",
      message: "No tax rates configured for this country",
    });
  } catch (error) {
    console.error("Error fetching tax rates:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch tax rates",
      },
      { status: 500 },
    );
  }
};
