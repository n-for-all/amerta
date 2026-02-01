import { Field } from "payload";

export const SEOFields: Field[] = [
  {
    name: "seoTitleTemplate",
    type: "text",
    label: "SEO Title Template",
    defaultValue: "%s | {siteName}",
    localized: true,
    admin: {
      description: "Template for page titles. Use %s as placeholder for page title and {siteName} for site name",
    },
  },
  {
    name: "defaultSeoTitle",
    type: "text",
    label: "Default SEO Title",
    defaultValue: "",
    localized: true,
    admin: {
      description: "Default title when no specific title is set",
    },
  },
  {
    name: "defaultSeoDescription",
    type: "textarea",
    label: "Default SEO Description",
    localized: true,
    admin: {
      description: "Default description when no specific description is set",
    },
  },
  {
    name: "defaultSeoImage",
    type: "upload",
    label: "Default SEO Image",
    relationTo: "media",
    admin: {
      description: "Default image for social media sharing (1200x630 recommended)",
    },
  },
  {
    name: "defaultSeoPaginationTitle",
    type: "text",
    label: "Default SEO Pagination Title",
    defaultValue: "%s - Page %d",
    localized: true,
    admin: {
      description: "Don't add {siteName} here, it will be appended automatically from the SEO Title Template setting. Use %s for the base title and %d for the page number",
    },
  },
  {
    type: "collapsible",
    label: "Blog Page",
    fields: [
      {
        name: "blogPageTitle",
        type: "text",
        label: "Title",
        localized: true,
        defaultValue: "Blog",
        admin: {
          description: "SEO title for the blog page",
        },
      },
      {
        name: "blogPageDescription",
        type: "textarea",
        label: "Description",
        localized: true,
        defaultValue: "Discover our latest articles and insights",
        admin: {
          description: "SEO description for the blog page",
        },
      },
    ],
  },
  {
    type: "collapsible",
    label: "Create Account Page",
    fields: [
      {
        name: "createAccountPageTitle",
        type: "text",
        label: "Title",
        localized: true,
        defaultValue: "Create Account",
        admin: {
          description: "SEO title for the create account page",
        },
      },
      {
        name: "createAccountPageDescription",
        type: "textarea",
        label: "Description",
        localized: true,
        defaultValue: "Create a new account to access your orders and manage your profile",
        admin: {
          description: "SEO description for the create account page",
        },
      },
    ],
  },
  {
    type: "collapsible",
    label: "Login Page",
    fields: [
      {
        name: "loginPageTitle",
        type: "text",
        label: "Title",
        localized: true,
        defaultValue: "Login",
        admin: {
          description: "SEO title for the login page",
        },
      },
      {
        name: "loginPageDescription",
        type: "textarea",
        label: "Description",
        localized: true,
        defaultValue: "Sign in to your account to view orders and manage your information",
        admin: {
          description: "SEO description for the login page",
        },
      },
    ],
  },
  {
    type: "collapsible",
    label: "Recover Password Page",
    fields: [
      {
        name: "recoverPasswordPageTitle",
        type: "text",
        label: "Title",
        localized: true,
        defaultValue: "Recover Password",
        admin: {
          description: "SEO title for the recover password page",
        },
      },
      {
        name: "recoverPasswordPageDescription",
        type: "textarea",
        label: "Description",
        localized: true,
        defaultValue: "Reset your password and regain access to your account",
        admin: {
          description: "SEO description for the recover password page",
        },
      },
    ],
  },
  {
    type: "collapsible",
    label: "Resend Verification Email Page",
    fields: [
      {
        name: "resendVerificationEmailPageTitle",
        type: "text",
        label: "Title",
        localized: true,
        defaultValue: "Resend Verification Email",
        admin: {
          description: "SEO title for the resend verification email page",
        },
      },
      {
        name: "resendVerificationEmailPageDescription",
        type: "textarea",
        label: "Description",
        localized: true,
        defaultValue: "Request a new verification email to confirm your email address",
        admin: {
          description: "SEO description for the resend verification email page",
        },
      },
    ],
  },
  {
    type: "collapsible",
    label: "Reset Password Page",
    fields: [
      {
        name: "resetPasswordPageTitle",
        type: "text",
        label: "Title",
        localized: true,
        defaultValue: "Reset Password",
        admin: {
          description: "SEO title for the reset password page",
        },
      },
      {
        name: "resetPasswordPageDescription",
        type: "textarea",
        label: "Description",
        localized: true,
        defaultValue: "Create a new password for your account",
        admin: {
          description: "SEO description for the reset password page",
        },
      },
    ],
  },
  {
    type: "collapsible",
    label: "Verify Email Page",
    fields: [
      {
        name: "verifyEmailPageTitle",
        type: "text",
        label: "Title",
        localized: true,
        defaultValue: "Verify Email",
        admin: {
          description: "SEO title for the verify email page",
        },
      },
      {
        name: "verifyEmailPageDescription",
        type: "textarea",
        label: "Description",
        localized: true,
        defaultValue: "Verify your email address to complete your account setup",
        admin: {
          description: "SEO description for the verify email page",
        },
      },
    ],
  },
  {
    type: "collapsible",
    label: "Account Page",
    fields: [
      {
        name: "accountPageTitle",
        type: "text",
        label: "Title",
        localized: true,
        defaultValue: "My Account",
        admin: {
          description: "SEO title for the account page",
        },
      },
      {
        name: "accountPageDescription",
        type: "textarea",
        label: "Description",
        localized: true,
        defaultValue: "Access your account information and settings",
        admin: {
          description: "SEO description for the account page",
        },
      },
    ],
  },
  {
    type: "collapsible",
    label: "Addresses Page",
    fields: [
      {
        name: "addressesPageTitle",
        type: "text",
        label: "Title",
        localized: true,
        defaultValue: "My Addresses",
        admin: {
          description: "SEO title for the addresses page",
        },
      },
      {
        name: "addressesPageDescription",
        type: "textarea",
        label: "Description",
        localized: true,
        defaultValue: "Manage your saved addresses for faster checkout",
        admin: {
          description: "SEO description for the addresses page",
        },
      },
    ],
  },
  {
    type: "collapsible",
    label: "Orders Page",
    fields: [
      {
        name: "ordersPageTitle",
        type: "text",
        label: "Title",
        localized: true,
        defaultValue: "My Orders",
        admin: {
          description: "SEO title for the orders page",
        },
      },
      {
        name: "ordersPageDescription",
        type: "textarea",
        label: "Description",
        localized: true,
        defaultValue: "View your order history and tracking information",
        admin: {
          description: "SEO description for the orders page",
        },
      },
    ],
  },
  {
    type: "collapsible",
    label: "Profile Page",
    fields: [
      {
        name: "profilePageTitle",
        type: "text",
        label: "Title",
        localized: true,
        defaultValue: "My Profile",
        admin: {
          description: "SEO title for the profile page",
        },
      },
      {
        name: "profilePageDescription",
        type: "textarea",
        label: "Description",
        localized: true,
        defaultValue: "Update your profile information and preferences",
        admin: {
          description: "SEO description for the profile page",
        },
      },
    ],
  },
  {
    type: "collapsible",
    label: "Collections Page",
    fields: [
      {
        name: "collectionsPageTitle",
        type: "text",
        label: "Title",
        localized: true,
        defaultValue: "Collections",
        admin: {
          description: "SEO title for the collections page",
        },
      },
      {
        name: "collectionsPageDescription",
        type: "textarea",
        label: "Description",
        localized: true,
        defaultValue: "Browse our curated collection of products",
        admin: {
          description: "SEO description for the collections page",
        },
      },
    ],
  },
  {
    type: "collapsible",
    label: "Brands Page",
    fields: [
      {
        name: "brandsPageTitle",
        type: "text",
        label: "Title",
        localized: true,
        defaultValue: "Brands",
        admin: {
          description: "SEO title for the brands page",
        },
      },
      {
        name: "brandsPageDescription",
        type: "textarea",
        label: "Description",
        localized: true,
        defaultValue: "Browse our curated collection of products",
        admin: {
          description: "SEO description for the brands page",
        },
      },
    ],
  },
  {
    type: "collapsible",
    label: "Products Page",
    fields: [
      {
        name: "productsPageTitle",
        type: "text",
        label: "Title",
        localized: true,
        defaultValue: "Products",
        admin: {
          description: "SEO title for the products page",
        },
      },
      {
        name: "productsPageDescription",
        type: "textarea",
        label: "Description",
        localized: true,
        defaultValue: "Explore our full range of available products",
        admin: {
          description: "SEO description for the products page",
        },
      },
    ],
  },
  {
    type: "collapsible",
    label: "Product Tags Page",
    fields: [
      {
        name: "productTagsPageTitle",
        type: "text",
        label: "Title",
        localized: true,
        defaultValue: "Product Tags",
        admin: {
          description: "SEO title for the product tags page",
        },
      },
      {
        name: "productTagsPageDescription",
        type: "textarea",
        label: "Description",
        localized: true,
        defaultValue: "Explore our full range of available product tags",
        admin: {
          description: "SEO description for the product tags page",
        },
      },
    ],
  },
  {
    type: "collapsible",
    label: "Categories Page",
    fields: [
      {
        name: "categoriesPageTitle",
        type: "text",
        label: "Title",
        localized: true,
        defaultValue: "Categories",
        admin: {
          description: "SEO title for the categories page",
        },
      },
      {
        name: "categoriesPageDescription",
        type: "textarea",
        label: "Description",
        localized: true,
        defaultValue: "Shop by category to find what you're looking for",
        admin: {
          description: "SEO description for the categories page",
        },
      },
    ],
  },
  {
    type: "collapsible",
    label: "Tags Page",
    fields: [
      {
        name: "tagsPageTitle",
        type: "text",
        label: "Title",
        localized: true,
        defaultValue: "Tags",
        admin: {
          description: "SEO title for the tags page",
        },
      },
      {
        name: "tagsPageDescription",
        type: "textarea",
        label: "Description",
        localized: true,
        defaultValue: "Discover products by tags and topics",
        admin: {
          description: "SEO description for the tags page",
        },
      },
    ],
  },
  {
    type: "collapsible",
    label: "Cart Page",
    fields: [
      {
        name: "cartPageTitle",
        type: "text",
        label: "Title",
        localized: true,
        defaultValue: "Shopping Cart",
        admin: {
          description: "SEO title for the cart page",
        },
      },
      {
        name: "cartPageDescription",
        type: "textarea",
        label: "Description",
        localized: true,
        defaultValue: "Review your items before checkout",
        admin: {
          description: "SEO description for the cart page",
        },
      },
    ],
  },
  {
    type: "collapsible",
    label: "Checkout Page",
    fields: [
      {
        name: "checkoutPageTitle",
        type: "text",
        label: "Title",
        localized: true,
        defaultValue: "Checkout",
        admin: {
          description: "SEO title for the checkout page",
        },
      },
      {
        name: "checkoutPageDescription",
        type: "textarea",
        label: "Description",
        localized: true,
        defaultValue: "Complete your purchase securely",
        admin: {
          description: "SEO description for the checkout page",
        },
      },
    ],
  },
  {
    type: "collapsible",
    label: "Logout Page",
    fields: [
      {
        name: "logoutPageTitle",
        type: "text",
        label: "Title",
        localized: true,
        defaultValue: "Logout",
        admin: {
          description: "SEO title for the logout page",
        },
      },
      {
        name: "logoutPageDescription",
        type: "textarea",
        label: "Description",
        localized: true,
        defaultValue: "You have been successfully logged out",
        admin: {
          description: "SEO description for the logout page",
        },
      },
    ],
  },
];
