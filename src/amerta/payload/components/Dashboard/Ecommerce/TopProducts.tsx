"use client";

import React from "react";
import { Package } from "lucide-react";
import styles from "./index.module.scss";
import { formatPrice } from "./Dashboard"; // Import helper from main file
import { Currency } from "@/payload-types";

type Props = {
  products: { name: string; revenue: number; quantity: number }[];
  currency: Currency | null;
};

export const TopProducts: React.FC<Props> = ({ products, currency }) => {
  return (
    <div className={styles.statCard}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>Top Selling Products</span>
        <Package className={styles.iconTiny} />
      </div>

      <div className={styles.productList}>
        {products.length === 0 ? (
          <div className={styles.emptyState}>No sales in this period</div>
        ) : (
          products.map((product, index) => (
            <div key={index} className={styles.productRow}>
              <div className={styles.productInfo}>
                <span className={styles.rank}>#{index + 1}</span>
                <span className={styles.productName}>{product.name}</span>
              </div>
              <div className={styles.productStats}>
                <span className={styles.productRevenue}>{formatPrice(product.revenue, currency)}</span>
                <span className={styles.productQty}>{product.quantity} sold</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
