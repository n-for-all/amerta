import { defaultReplacements } from "./Replacements";

export class slugify {
  replacements: string[][];
  constructor(replacements = defaultReplacements) {
    this.replacements = replacements;
  }

  /**
   * Escape characters with special meaning either inside or outside the character sets
   * @param {string} str - The string to escape.
   * @returns {string} - The escaped string.
   * @see https://mathiasbynens.be/notes/javascript-escapes
   * @see https://stackoverflow.com/a/6969486/112731
   * @see https://stackoverflow.com/a/1144788/112731
   */
  escapeRegExp(str) {
    if (typeof str !== "string") {
      throw new TypeError("Expected a string");
    }
    return str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
  }

  /**
   * Generate a slugified version of the string using the specified delimiter.
   *
   * @param {string} str - The string to slugify.
   * @param {string} [delimiter='-'] - The delimiter to use for the slug.
   * @return {string} - The slugified string.
   *
   * @see https://gist.github.com/mathewbyrne/1280286
   * @see https://stackoverflow.com/a/2955878/112731
   */
  generate(str, delimiter = "-") {
    try {
      let processedStr = str.toString().trim();
      this.replacements.forEach(([from, to]) => {
        processedStr = processedStr.replace(new RegExp(this.escapeRegExp(from), "g"), to);
      });

      // Ensure delimiter is a non-empty string
      if (typeof delimiter !== "string" || delimiter === "") {
        delimiter = "-";
      }

      const escapedDelimiter = this.escapeRegExp(delimiter);

      processedStr = processedStr
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/@/g, " at ")
        .replace(/'/g, "")
        .replace(/#+([a-zA-Z0-9_]+)/gi, "hashtag $&")
        .replace(/#([0-9]\d*)/g, "number $&")
        .replace("hashtag number", "number")
        .replace(/--+/g, " ")
        .replace(/[^a-zA-Z0-9_\u3400-\u9FBF\s-]/g, " ")
        .replace(/\s+/g, delimiter)
        .replace(new RegExp(`^${escapedDelimiter}+`), "")
        .replace(new RegExp(`${escapedDelimiter}+$`), "");

      return processedStr;
    } catch (error: any) {
      console.error(`Error in generate method: ${error.message}`);
      throw error;
    }
  }
}
