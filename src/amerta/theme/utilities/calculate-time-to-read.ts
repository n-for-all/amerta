/**
 * Calculates the estimated time to read the provided content.
 * @param content - The content object containing a root with children nodes.
 * @returns The estimated time to read in minutes.
 * @example
 * const minutes = calculateTimeToRead(myContent);
 */
export const calculateTimeToRead = (content: any): number => {
  return content?.root?.children && Array.isArray(content.root.children)
    ? Math.ceil(
        content.root.children
          .map((node) => {
            if (Array.isArray(node.children)) {
              return node.children.map((child) => child.text || "").join(" ");
            }
            return "";
          })
          .join(" ")
          .split(/\s+/g)
          .filter(Boolean).length / 200,
      )
    : 0;
};
