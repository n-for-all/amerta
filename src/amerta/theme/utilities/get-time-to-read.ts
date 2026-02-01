export const getTimeToRead = (content: string | Record<string, any> | null | undefined) => {
  if (!content) return null;

  let allText = "";

  // Scenario 1: It is just a simple string
  if (typeof content === "string") {
    allText = content;
  } 
  // Scenario 2: It is a Lexical Editor object (Starts with 'root')
  else if (typeof content === "object" && content.root && Array.isArray(content.root.children)) {
    allText = extractLexicalText(content.root);
  }

  // Calculate Reading Time
  // Split by whitespace to get accurate word count
  const wordCount = allText.trim().split(/\s+/).length;

  if (wordCount === 0) return null;

  // Average reading speed: 200 words per minute
  const minutes = Math.ceil(wordCount / 200);
  
  return minutes;
};

// Recursive helper to traverse the Lexical Tree
const extractLexicalText = (node: any): string => {
  let text = "";

  // 1. If this node has direct text content (Leaf node)
  if (node.text && typeof node.text === "string") {
    text += node.text + " ";
  }

  // 2. If this node has children (Element node like paragraph, link, list), recurse
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      text += extractLexicalText(child);
    }
  }

  return text;
};