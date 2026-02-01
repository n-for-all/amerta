import React from "react";
import { Store } from "lucide-react";
import styles from "./skeleton.module.scss";
import Link from "next/link";
import { getAdminURL } from "@/amerta/utilities/getAdminURL";

export const DashboardSkeleton = () => {
  return (
    <div className={`${styles.skeletonContainer} ${styles.pulse}`}>
      {/* Header Skeleton */}
      <div className={styles.header}>
        <div className={styles.titlePlaceholder} />
        <div className={styles.actions}>
          <div className={styles.btnPlaceholder} />
          <div className={styles.btnPlaceholder} />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className={styles.grid}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={styles.card}>
            <div className={styles.cardTitle} />
            <div className={styles.cardValue} />
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className={styles.chartPlaceholder}>
        {[...Array(12)].map((_, i) => (
          <div key={i} className={styles.bar} />
        ))}
      </div>
    </div>
  );
};

export const DashboardEmptyState = () => {
  return (
    <div style={{ position: "relative", minHeight: "600px" }}>
      {/* Blurred Background */}
      <div className={`${styles.skeletonContainer} ${styles.faded}`}>
        <div className={styles.header}>
          <div className={styles.titlePlaceholder} />
          <div className={styles.actions}>
            <div className={styles.btnPlaceholder} />
          </div>
        </div>
        <div className={styles.grid}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.cardTitle} />
              <div className={styles.cardValue} />
            </div>
          ))}
        </div>
        <div className={styles.chartPlaceholder}>
          {[...Array(10)].map((_, i) => (
            <div key={i} className={styles.bar} />
          ))}
        </div>
      </div>

      {/* Call to Action Overlay */}
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.iconCircle}>
            <Store />
          </div>
          <h3>Setup Required</h3>
          <p>
            You need to create a <strong>Sales Channel</strong> before you can view your store analytics.
          </p>
          <Link href={getAdminURL("/collections/sales-channel")} className={styles.ctaButton}>
            Go To Sales Channel
          </Link>
        </div>
      </div>
    </div>
  );
};
