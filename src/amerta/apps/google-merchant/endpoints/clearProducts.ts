import { Endpoint } from "payload";
import { ProductInputsServiceClient, ProductsServiceClient } from "@google-shopping/products";
import { getAppSettings } from "@/amerta/theme/utilities/get-app-settings";

export const clearProductsEndpoint: Endpoint = {
    path: "/google-merchant/clear",
    method: "post",
    handler: async (req) => {
        try {
            if (!req.user) {
                return Response.json({ error: "Unauthorized" }, { status: 401 });
            }

            const config = await getAppSettings("google-merchant");

            if (!config || !config.merchantId || !config.serviceAccountJson) {
                return Response.json({ error: "Google Merchant is not configured." }, { status: 400 });
            }

            let credentials;
            try {
                credentials = JSON.parse(config.serviceAccountJson);
            } catch (e) {
                return Response.json({ error: "Invalid Service Account JSON." }, { status: 400 });
            }

            const productsClient = new ProductsServiceClient({ credentials });
            const inputsClient = new ProductInputsServiceClient({ credentials });

            const parent = `accounts/${config.merchantId}`;
            
            let deletedCount = 0;
            const errors:any[] = [];

            try {
                const iterable = productsClient.listProductsAsync({ parent });
                for await (const product of iterable) {
                    if (product.name) {
                        // product.name is formatted as "accounts/{account}/products/{product}"
                        // we need "accounts/{account}/productInputs/{productinput}"
                        // {product} and {productinput} have the exact same format (channel~language~feedLabel~offerId)
                        const parts = product.name.split('/');
                        const productId = parts[parts.length - 1];
                        
                        const inputName = `accounts/${config.merchantId}/productInputs/${productId}`;
                        
                        try {
                            // We don't specify dataSource here; deleting productInput by its ID deletes it from its primary data source
                            // Wait, deleteProductInput requires the dataSource parameter to be specified in the request
                            // "dataSource: accounts/{account}/dataSources/{datasource}"
                            // Actually, it deletes the input from the specified data source.
                            // If we don't know the data source, we can use the one from config.
                            await inputsClient.deleteProductInput({
                                name: inputName,
                                dataSource: (product as any).dataSource || `accounts/${config.merchantId}/dataSources/${config.dataSourceId}`
                            });
                            deletedCount++;
                        } catch (err: any) {
                            console.error(`Failed to delete ${inputName}:`, err);
                            errors.push(err.message);
                        }
                    }
                }
            } catch (err: any) {
                console.error("Failed to list products:", err);
                return Response.json({ error: `Failed to list products: ${err.message}` }, { status: 500 });
            }

            return Response.json({ count: deletedCount, errors: errors.length > 0 ? errors : undefined, message: "Clear successful" });
        } catch (error: any) {
            console.error("Error clearing Google Merchant products:", error);
            return Response.json({ error: error.message || "Failed to clear products" }, { status: 500 });
        }
    },
};
