import { getPayload } from "payload";
import configPromise from "@payload-config";
import { getAppSettings } from "@/amerta/core/utilities/get-app-settings";
import {
  CJCategory,
  CJProductDetail,
  CJProductListItem,
  CJSearchQuery,
  CJSettings,
  parseCJWeight,
  resolveEffectiveProductWeight,
} from "../types";

const CJ_API_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

export class CJClient {
  /**
   * Request an access token using email and apiKey
   */
  static async getAccessToken(email: string, apiKey: string): Promise<{
    accessToken: string;
    accessTokenExpiryDate: string;
    refreshToken?: string;
  }> {
    const res = await fetch(`${CJ_API_BASE}/authentication/getAccessToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, apiKey }),
    });

    const data = await res.json();
    if (!res.ok || data.code !== 200) {
      throw new Error(data.message || "Failed to authenticate with CJ Dropshipping.");
    }

    return {
      accessToken: data.data.accessToken,
      accessTokenExpiryDate: data.data.accessTokenExpiryDate,
      refreshToken: data.data.refreshToken,
    };
  }

  /**
   * Fetch a fresh access token with the stored apiKey and persist it.
   * Used when the stored token is expired or rejected (e.g. after API access was re-enabled on CJ).
   */
  private static async refreshAccessToken(settings: CJSettings): Promise<string> {
    if (!settings.apiKey) {
      throw new Error("CJ Dropshipping is not connected. Please enter your API credentials in Settings.");
    }
    const auth = await CJClient.getAccessToken(settings.email || "", settings.apiKey);

    const payload = await getPayload({ config: configPromise });
    const appsGlobal = await payload.findGlobal({ slug: "apps", depth: 0 });
    const appSettings = (appsGlobal?.appSettings as Record<string, any>) || {};
    await payload.updateGlobal({
      slug: "apps",
      data: {
        appSettings: {
          ...appSettings,
          "cj-dropshipping": {
            ...(appSettings["cj-dropshipping"] || {}),
            accessToken: auth.accessToken,
            tokenExpiryDate: auth.accessTokenExpiryDate,
          },
        },
      },
    });
    return auth.accessToken;
  }

  private static isTokenExpired(settings: CJSettings): boolean {
    if (!settings.tokenExpiryDate) return false;
    const expiry = new Date(settings.tokenExpiryDate).getTime();
    // Refresh a little early to avoid using a token that dies mid-request
    return Number.isFinite(expiry) && expiry - Date.now() < 60 * 60 * 1000;
  }

  private static isAuthError(data: any, status: number): boolean {
    const msg = String(data?.message || "").toLowerCase();
    return status === 401 || msg.includes("token") || msg.includes("api access") || msg.includes("disabled") || msg.includes("unauthori");
  }

  private static lastRequestTime = 0;
  private static queuePromise: Promise<any> = Promise.resolve();

  private static async throttle(): Promise<void> {
    const minInterval = 1100; // CJ strict QPS limit: 1 request per second
    const now = Date.now();
    const elapsed = now - CJClient.lastRequestTime;
    if (elapsed < minInterval) {
      await new Promise((resolve) => setTimeout(resolve, minInterval - elapsed));
    }
    CJClient.lastRequestTime = Date.now();
  }

  /**
   * Internal authenticated fetch helper with 1 QPS queue and auto-retry
   */
  private static async request<T = any>(endpoint: string, options: RequestInit = {}, retries = 3): Promise<T> {
    const settings = (await getAppSettings("cj-dropshipping")) as CJSettings | undefined;
    let token = settings?.accessToken;

    if (!settings || (!token && !settings.apiKey)) {
      throw new Error("CJ Dropshipping is not connected. Please enter your API credentials in Settings.");
    }

    if (!token || CJClient.isTokenExpired(settings)) {
      token = await CJClient.refreshAccessToken(settings);
    }

    const url = endpoint.startsWith("http") ? endpoint : `${CJ_API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    // Queue all requests sequentially to guarantee 1 QPS. Retries loop inside the same
    // queue slot (re-calling request() here would wait on itself and deadlock).
    const run = CJClient.queuePromise.then(async () => {
      let qpsRetries = retries;
      let authRetried = false;

      while (true) {
        await CJClient.throttle();

        const res = await fetch(url, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            "CJ-Access-Token": token as string,
            ...((options.headers as Record<string, string>) || {}),
          },
        });
        const data = await res.json();
        const failed = !res.ok || (data.code !== 200 && data.result !== true);
        const message = String(data.message || "").toLowerCase();

        // CJ QPS limit: back off and retry
        if (failed && (message.includes("qps") || message.includes("too many requests")) && qpsRetries > 0) {
          console.warn(`[CJ API Rate Limit] QPS hit on ${endpoint}. Waiting 1500ms before retry (${qpsRetries} retries left)...`);
          qpsRetries--;
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }

        // Stored token rejected (e.g. API access was disabled and re-enabled): get a fresh one once and retry
        if (failed && !authRetried && CJClient.isAuthError(data, res.status)) {
          console.warn(`[CJ API] Token rejected on ${endpoint} ("${data.message}"). Refreshing access token...`);
          authRetried = true;
          token = await CJClient.refreshAccessToken(settings);
          continue;
        }

        if (failed) {
          throw new Error(data.message || `CJ API Error (${res.status})`);
        }

        return (data.data !== undefined ? data.data : data) as T;
      }
    });

    // Keep the queue alive: a failed request must not reject every request after it
    CJClient.queuePromise = run.catch(() => undefined);
    return run;
  }

  /**
   * Search and list products from CJ catalog
   */
  static async searchProducts(query: CJSearchQuery = {}): Promise<{
    total: number;
    pageNum: number;
    pageSize: number;
    list: CJProductListItem[];
  }> {
    const pageNum = query.pageNum || 1;
    const pageSize = Math.min(query.pageSize || 24, 100); // listV2 max page size is 100

    // Uses Product List V2 (/product/listV2). The old /product/list is deprecated and its
    // countryCode filter misses warehouse stock (e.g. UAE). V2 does not return weight, so
    // items are flagged weightPending and weight rules run on preview/import.
    const params = new URLSearchParams();
    params.append("page", String(pageNum));
    params.append("size", String(pageSize));
    params.append("features", "enable_category");

    if (query.keyword && query.keyword.trim()) {
      params.append("keyWord", query.keyword.trim());
    }

    // Only append categoryId if it's a real CJ ID (not placeholder 1-2 digit IDs)
    if (query.categoryId && query.categoryId.trim().length > 2) {
      params.append("categoryId", query.categoryId.trim());
    }

    if (query.startPrice !== undefined && query.startPrice > 0) {
      params.append("startSellPrice", String(query.startPrice));
    }
    if (query.endPrice !== undefined && query.endPrice > 0) {
      params.append("endSellPrice", String(query.endPrice));
    }
    if (query.countryCode && query.countryCode.trim()) {
      params.append("countryCode", query.countryCode.trim());
    }
    if (query.productFlag !== undefined) {
      params.append("productFlag", String(query.productFlag));
    }
    if (query.addMarkStatus !== undefined) {
      params.append("addMarkStatus", String(query.addMarkStatus));
    }
    if (query.startWarehouseInventory !== undefined && query.startWarehouseInventory > 0) {
      params.append("startWarehouseInventory", String(query.startWarehouseInventory));
    }
    if (query.productType !== undefined) {
      params.append("productType", String(query.productType));
    }

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await this.request<any>(`/product/listV2${queryString}`);

    // V2 shape: { totalRecords, content: [{ productList: [...] }, ...] } (one content entry per keyword group)
    let items: any[] = [];
    let total = 0;

    if (response) {
      total = response.totalRecords || response.total || 0;
      if (Array.isArray(response.content)) {
        items = response.content.flatMap((group: any) =>
          Array.isArray(group?.productList) ? group.productList : group?.id || group?.pid ? [group] : [],
        );
      } else if (Array.isArray(response.list)) {
        items = response.list;
      }
    }

    const normalizedList: CJProductListItem[] = items.map((item: any) => {
      const pid = String(item.pid || item.id || "");
      const name = item.productNameEn || item.nameEn || item.productName || item.name || "";
      const sku = item.productSku || item.sku || "";
      const image = item.productImage || item.bigImage || item.image || (Array.isArray(item.productImageSet) ? item.productImageSet[0] : "") || "";
      const price = String(item.sellPrice ?? item.price ?? "0");
      const weight = resolveEffectiveProductWeight(item);

      return {
        pid,
        productNameEn: name,
        productSku: sku,
        productImage: image,
        sellPrice: price,
        productWeight: weight,
        weightPending: weight <= 0,
        categoryName:
          item.categoryName ||
          item.threeCategoryName ||
          item.twoCategoryName ||
          item.oneCategoryName ||
          item.entryNameEn ||
          "",
        categoryId: item.categoryId || "",
        variants: item.variants || item.variantList || item.skuList || undefined,
      };
    }).filter((p) => Boolean(p.pid));

    return {
      total: total || normalizedList.length,
      pageNum,
      pageSize,
      list: normalizedList,
    };
  }

  /**
   * Get full product details by PID
   */
  static async getProductDetails(pid: string): Promise<CJProductDetail> {
    if (!pid) {
      throw new Error("Product ID (pid) is required.");
    }

    const response = await this.request<CJProductDetail>(`/product/query?pid=${encodeURIComponent(pid)}`);
    if (response) {
      // Normalize productWeight resolving from parent fields and variants
      const effectiveWeight = resolveEffectiveProductWeight(response);
      response.productWeight = effectiveWeight;

      if (Array.isArray(response.variants)) {
        response.variants = response.variants.map((v: any) => ({
          ...v,
          variantWeight: parseCJWeight(v.variantWeight || v.weight || effectiveWeight),
        }));
      }
    }
    return response;
  }

  /**
   * Fetch category hierarchy
   */
  static async getCategories(): Promise<{ categoryId: string; categoryName: string }[]> {
    try {
      const rawData = await this.request<any>("/product/getCategory");
      if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        return [];
      }

      const flattened: { categoryId: string; categoryName: string }[] = [];

      const parseCategoryList = (list: any[], parentPrefix = "") => {
        for (const item of list) {
          const id =
            item.categoryId ||
            item.categoryFirstId ||
            item.categorySecondId ||
            item.categoryThirdId ||
            item.id ||
            "";

          const name =
            item.categoryName ||
            item.categoryFirstName ||
            item.categorySecondName ||
            item.categoryThirdName ||
            item.name ||
            "";

          if (id && name) {
            const displayName = parentPrefix ? `${parentPrefix} > ${name}` : name;
            flattened.push({ categoryId: String(id), categoryName: displayName });

            const children =
              item.categoryFirstList ||
              item.categorySecondList ||
              item.categoryList ||
              item.children ||
              item.subCategories;

            if (Array.isArray(children) && children.length > 0) {
              parseCategoryList(children, displayName);
            }
          }
        }
      };

      parseCategoryList(rawData);
      return flattened;
    } catch {
      return [];
    }
  }

  /**
   * Calculate shipping / freight estimates via CJ API
   */
  static async calculateFreight(options: {
    startCountryCode?: string;
    endCountryCode: string;
    vid?: string;
    pid?: string;
    quantity?: number;
  }): Promise<any[]> {
    const payload: any = {
      startCountryCode: options.startCountryCode || "CN",
      endCountryCode: options.endCountryCode,
      products: [
        {
          quantity: options.quantity || 1,
          ...(options.vid ? { vid: options.vid } : {}),
          ...(options.pid ? { pid: options.pid } : {}),
        },
      ],
    };

    const response = await this.request<any>("/logistic/freightCalculate", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.list)) return response.list;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  }
}
