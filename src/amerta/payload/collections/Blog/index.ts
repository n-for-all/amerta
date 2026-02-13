/**
 * @module Collections/Blog
 * @title Blog Collections
 * @description This module defines the collections related to the blog functionality in Amerta, including posts, categories, and tags. Each collection is structured to support a robust blogging system with features like categorization and tagging for better content organization and discoverability.
 */

import Categories from "./Categories";
import { Posts } from "./Posts";
import Tags from "./Tags";

export default [Posts, Categories, Tags];
