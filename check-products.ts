import { getPayload } from "payload";
import configPromise from "./src/payload.config";

async function checkProducts() {
  const payload = await getPayload({ config: configPromise });
  const result = await payload.find({
    collection: "products",
    limit: 1000,
  });
  console.log(`Found ${result.docs.length} total products in database.`);
  const statuses = result.docs.map(d => d._status);
  const statusCounts = statuses.reduce((acc, status) => {
    acc[status || 'undefined'] = (acc[status || 'undefined'] || 0) + 1;
    return acc;
  }, {});
  console.log(`Status breakdown:`, statusCounts);
}

checkProducts().catch(console.error);
