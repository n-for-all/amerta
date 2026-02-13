/**
 * @module Collections/Store
 * @title Store Collection
 * @description This module defines the Store collection, including its fields, access control, and hooks.
 */

import { admins } from "@/amerta/access/admins";
import { CollectionConfig } from "payload";

export const Store: CollectionConfig = {
  slug: "store",
  labels: {
    plural: "Store",
    singular: "Store",
  },
  admin: {
    group: "Ecommerce",
    useAsTitle: "name",
    defaultColumns: ["name", "enabled", "defaultSalesChannelId", "currencies", "updatedAt"],
  },
  access: {
    read: () => true,
    update: admins,
    create: admins,
    delete: admins,
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "enabled",
          type: "select",
          required: true,
          options: [
            {
              label: "Enabled",
              value: "1",
            },
            {
              label: "Disabled",
              value: "0",
            },
          ],
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          label: "Default Sales Channel",
          name: "defaultSalesChannelId",
          type: "relationship",
          relationTo: "sales-channel",
          required: true,
        },
        {
          label: "Default Location",
          name: "defaultLocationId",
          type: "relationship",
          relationTo: "country",
        },
      ],
    },
    
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "metadata",
      type: "json",
    },
    {
      name: "createdAt",
      label: "Created At",
      type: "date",
      admin: {
        readOnly: true,
        position: "sidebar",
      },
    },
    {
      name: "updatedAt",
      label: "Updated At",
      type: "date",
      admin: {
        readOnly: true,
        position: "sidebar",
      },
    },
  ],
};
