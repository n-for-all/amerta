"use client";

import { useListDrawer } from "@payloadcms/ui";
import { Drawer, DrawerToggler } from "@payloadcms/ui";
import { Loader2 } from "lucide-react";
import { IFrame } from "./Iframe";
import Editor from "./Editor";
import React, { useEffect, useRef, useState } from "react";
import styles from "./index.module.scss";
import nunjucks from "nunjucks/browser/nunjucks";
import { format } from "date-fns";
import { Customer, Order, Settings, User } from "@/payload-types";

interface EmailTemplateProps {
  initialContent?: string;
  loading: boolean;
  value: string;
  onValueChange: (value: string) => void;
  settings: {
    url: string;
    verify_url: string;
    reset_password_url: string;
    logo: string | null;
    color: string | null;
    fromName: string | null;
    fromEmail: string | null;
    siteName: string | null;
    siteDescription: string | null;
    footerAddress: string | null;
    footerEmail: string | null;
    footerPhone: string | null;
    footerHtml: string | null;
    settings: Settings;
  };
}

const PREVIEW_CONTEXT: {
  user: User;
  order: Order;
  customer: Customer;
} = {
  user: {
    id: "user_01",
    email: "john@example.com",
    createdAt: "2024-05-15T10:00:00.000Z",
    updatedAt: "2024-05-15T10:00:00.000Z",
  },
  order: {
    id: "60d5ec49f1b2c8a",
    orderId: "ORD-2024-001",
    orderCounter: 1001,
    createdAt: "2024-05-20T14:30:00.000Z",
    updatedAt: "2024-05-20T14:30:00.000Z",
    status: "processing",
    orderNote: "Please leave the package at the front desk.",
    subtotal: 155.0,
    discountTotal: 15.0,
    shippingTotal: 10.0,
    tax: 5.0,
    total: 155.0,
    shippingMethodName: "Express Delivery",
    shippingMethod: "express_01",
    paymentMethodName: "Credit Card (Visa)",
    paymentMethod: "stripe",
    salesChannel: "online_store",
    customerTotal: 155.0,
    customerCurrency: "USD",
    exchangeRate: 1,
    orderedBy: "customer_01",
    items: [
      {
        id: "item_01",
        productName: "Premium Arabica Coffee Beans",
        productSKU: "COFFEE-ARA-001",
        product: "prod_001",
        variantText: "Roast: Medium, Size: 500g",
        price: 50.0,
        quantity: 2,
      },
      {
        id: "item_02",
        productName: "Ceramic Coffee Mug",
        productSKU: "MUG-BLK-002",
        product: "prod_002",
        variantText: "Color: Matte Black",
        price: 25.0,
        quantity: 1,
      },
      {
        id: "item_03",
        productName: "Coffee Filter Pack",
        productSKU: "FIL-003",
        product: "prod_003",
        price: 30.0,
        quantity: 1,
      },
    ],
    address: {
      firstName: "Ahmed",
      lastName: "Al-Farsi",
      country: "United Arab Emirates",
      countryName: "United Arab Emirates",
      city: "Dubai",
      state: "Dubai",
      street: "Sheikh Zayed Road",
      address: "Business Bay, Executive Towers",
      apartment: "Tower B",
      building: "Executive Towers",
      floor: "15",
      postalCode: "00000",
      phoneCountryCode: "+971",
      phone: 501234567,
      isDefaultShipping: true,
    },
    billingAddress: {
      firstName: "Ahmed",
      lastName: "Al-Farsi",
      country: "United Arab Emirates",
      countryName: "United Arab Emirates",
      city: "Dubai",
      state: "Dubai",
      street: "Sheikh Zayed Road",
      address: "Business Bay, Executive Towers",
      apartment: "Tower B",
      building: "Executive Towers",
      floor: "15",
      postalCode: "00000",
      phoneCountryCode: "+971",
      phone: 501234567,
      isDefaultBilling: true,
    },
  },
  customer: {
    id: "customer_01",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    createdAt: "2024-05-15T10:00:00.000Z",
    updatedAt: "2024-05-15T10:00:00.000Z",
  },
};

const DRAWER_SLUG = "email-template-editor-drawer";
let timer: ReturnType<typeof setTimeout>;

if (nunjucks && nunjucks.configure) {
  const env = nunjucks.configure({ autoescape: true });

  // Add the 'date' filter
  env.addFilter("date", function (str, formatStr) {
    if (!str) return "";
    try {
      const date = new Date(str);
      // Default to 'MMM dd, yyyy' if no format provided
      return format(date, formatStr || "MMM dd, yyyy");
    } catch {
      return str; // Return original string if parsing fails
    }
  });
}

export const EmailTemplate: React.FC<EmailTemplateProps> = ({ initialContent, loading, value, onValueChange, settings }) => {
  const editorRef = useRef<any>(null);
  const [previewHtml, setPreviewHtml] = useState<string>(value);
  const [renderError, setRenderError] = useState<string | null>(null);

  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [ListDrawer, , { toggleDrawer }] = useListDrawer({
    collectionSlugs: ["media"],
    uploads: true,
  });

  useEffect(() => {
    if (!value) return;

    // Set a timer to run the compilation after 1000ms (1 second) of inactivity
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        const compiled = nunjucks.renderString(value, { ...PREVIEW_CONTEXT, ...settings });
        setPreviewHtml(compiled);
        setLastUpdated(Date.now());
        setRenderError(null);
      } catch (err: any) {
        setPreviewHtml(value);
        setLastUpdated(Date.now());
        console.warn("Nunjucks Render Error:", err.message);
        setRenderError(err.message);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, settings]);

  const onMediaSelect = async ({ docID, collectionSlug }: { docID: string; collectionSlug: string }) => {
    try {
      const res = await fetch(`/api/${collectionSlug}/${docID}`);
      const doc = await res.json();

      insertAtCursor(doc.url);

      toggleDrawer();
    } catch (err) {
      console.error("Failed to fetch image details", err);
    }
  };
  const insertAtCursor = (text: string) => {
    const wrapper = editorRef.current;
    if (!wrapper) return;

    const rawEditor = wrapper.getEditor();
    if (!rawEditor) return;

    const selection = rawEditor.getSelection();

    const id = { major: 1, minor: 1 };
    const op = {
      identifier: id,
      range: selection,
      text: text,
      forceMoveMarkers: true,
    };

    rawEditor.executeEdits("media-insert", [op]);
    rawEditor.focus();

    onValueChange(rawEditor.getValue());
  };

  const createElementMap = (htmlContent: string) => {
    const lines = htmlContent.split("\n");
    const elementMap: Array<{
      tagName: string;
      startLine: number;
      endLine: number;
      startColumn: number;
      endColumn: number;
      attributes: Record<string, string>;
      content: string;
      fullMatch: string;
      normalized: string;
      depth: number;
      path: string;
    }> = [];

    const getPosition = (pos: number) => {
      let charCount = 0;
      let line = 0;
      let column = 0;

      for (let i = 0; i < lines.length; i++) {
        const lineLength = lines[i]!.length;
        if (charCount + lineLength >= pos) {
          line = i;
          column = pos - charCount;
          break;
        }
        charCount += lineLength + 1;
      }

      return { line, column };
    };

    const parseHTML = (html: string, startPos: number = 0, depth: number = 0, parentPath: string = ""): void => {
      const tagRegex = /<([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^>]*)?)(\s*\/?>)/g;
      let match;
      let elementIndex = 0;

      while ((match = tagRegex.exec(html)) !== null) {
        const fullOpeningTag = match[0];
        const tagName = match[1].toLowerCase();
        const attributesStr = match[2] || "";
        const isVoidElement = match[3].includes("/") || ["img", "br", "hr", "input", "meta", "link", "area", "base", "col", "embed", "source", "track", "wbr"].includes(tagName);

        const tagStartPos = startPos + match.index;
        const tagEndPos = tagStartPos + fullOpeningTag.length;

        const attributes: Record<string, string> = {};
        const attrRegex = /(\w+)(?:\s*=\s*["']([^"']*)["'])?/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attributesStr)) !== null) {
          attributes[attrMatch[1]] = attrMatch[2] || "";
        }

        const currentPath = `${parentPath}/${tagName}[${elementIndex}]`;
        elementIndex++;

        let elementContent = "";
        let elementEndPos = tagEndPos;
        let innerContent = "";

        if (!isVoidElement) {
          const searchFrom = tagEndPos;
          let openTags = 1;
          let searchPos = searchFrom;

          const nestedOpenRegex = new RegExp(`<${tagName}(?:\\s[^>]*)?>`, "gi");
          const nestedCloseRegex = new RegExp(`<\\/${tagName}\\s*>`, "gi");

          while (openTags > 0 && searchPos < html.length) {
            nestedOpenRegex.lastIndex = searchPos;
            nestedCloseRegex.lastIndex = searchPos;

            const nextOpen = nestedOpenRegex.exec(html);
            const nextClose = nestedCloseRegex.exec(html);

            if (!nextClose) break;

            if (nextOpen && nextOpen.index < nextClose.index) {
              openTags++;
              searchPos = nextOpen.index + nextOpen[0].length;
            } else {
              openTags--;
              searchPos = nextClose.index + nextClose[0].length;
              if (openTags === 0) {
                elementEndPos = startPos + nextClose.index + nextClose[0].length;
                innerContent = html.substring(tagEndPos - startPos, nextClose.index);
                break;
              }
            }
          }

          elementContent = innerContent.replace(/<[^>]*>/g, "").trim();

          if (innerContent.trim()) {
            parseHTML(innerContent, tagEndPos, depth + 1, currentPath);
          }
        }

        const startPosition = getPosition(tagStartPos);
        const endPosition = getPosition(elementEndPos);

        const fullElement = html.substring(match.index, isVoidElement ? tagEndPos - startPos : elementEndPos - startPos);
        const normalized = fullElement.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim().toLowerCase();

        elementMap.push({
          tagName,
          startLine: startPosition.line,
          endLine: endPosition.line,
          startColumn: startPosition.column,
          endColumn: endPosition.column,
          attributes,
          content: elementContent,
          fullMatch: fullElement,
          normalized,
          depth,
          path: currentPath,
        });

        tagRegex.lastIndex = isVoidElement ? tagEndPos - startPos : elementEndPos - startPos;
      }
    };

    try {
      parseHTML(htmlContent);
    } catch {}

    elementMap.sort((a, b) => {
      if (a.startLine !== b.startLine) return a.startLine - b.startLine;
      return a.startColumn - b.startColumn;
    });

    return elementMap;
  };

  const scrollToElementInEditor = (element: HTMLElement) => {
    if (!editorRef.current || !value) return;

    try {
      const elementMap = createElementMap(value);

      const tagName = element.tagName.toLowerCase();
      const attributes: Record<string, string> = {};

      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        if (attr) attributes[attr.name] = attr.value;
      }

      const textContent = element.textContent?.trim() || "";
      const elementHTML = element.outerHTML;

      const normalizedClickedElement = elementHTML.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim().toLowerCase();

      const normalizeText = (text: string): string => {
        return text
          .replace(/\s+/g, " ")
          .replace(/[\r\n\t]/g, " ")
          .trim()
          .toLowerCase();
      };

      const calculateTextSimilarity = (text1: string, text2: string): number => {
        if (!text1 || !text2) return 0;

        const normalized1 = normalizeText(text1);
        const normalized2 = normalizeText(text2);

        if (normalized1 === normalized2) return 100;

        if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return 90;

        const words1 = normalized1.split(" ").filter((w) => w.length > 2);
        const words2 = normalized2.split(" ").filter((w) => w.length > 2);

        if (words1.length === 0 && words2.length === 0) return 0;
        if (words1.length === 0 || words2.length === 0) return 0;

        const matchingWords = words1.filter((word) => words2.includes(word));
        const similarity = (matchingWords.length * 2) / (words1.length + words2.length);

        return similarity >= 0.7 ? similarity * 80 : similarity * 40;
      };

      const getElementPath = (el: HTMLElement): string => {
        const path: string[] = [];
        let current: HTMLElement | null = el;

        while (current && current.tagName !== "HTML") {
          const tagName = current.tagName.toLowerCase();
          const siblings = current.parentElement ? Array.from(current.parentElement.children).filter((child) => child.tagName.toLowerCase() === tagName) : [current];
          const index = siblings.indexOf(current);
          path.unshift(`${tagName}[${index}]`);
          current = current.parentElement;
        }

        return "/" + path.join("/");
      };

      const clickedElementPath = getElementPath(element);

      let bestMatch = { element: null as any, score: 0, line: -1 };

      elementMap.forEach((mappedElement, index) => {
        if (mappedElement.tagName !== tagName) return;

        let score = 0;

        if (mappedElement.normalized === normalizedClickedElement) {
          score = 1000;
        } else {
          if (clickedElementPath && mappedElement.path) {
            const pathParts = clickedElementPath.split("/").filter((p) => p);
            const mappedParts = mappedElement.path.split("/").filter((p) => p);
            const minLength = Math.min(pathParts.length, mappedParts.length);
            let pathMatches = 0;

            for (let i = 0; i < minLength; i++) {
              if (pathParts[pathParts.length - 1 - i] === mappedParts[mappedParts.length - 1 - i]) {
                pathMatches++;
              } else {
                break;
              }
            }

            if (pathMatches > 0) {
              const pathScore = (pathMatches / Math.max(pathParts.length, mappedParts.length)) * 100;
              score += pathScore;
            }
          }

          Object.keys(attributes).forEach((attrName) => {
            if (mappedElement.attributes[attrName] === attributes[attrName]) {
              switch (attrName) {
                case "id":
                  score += 50;
                  break;
                case "class":
                  score += 30;
                  break;
                case "src":
                case "href":
                  score += 40;
                  break;
                case "alt":
                case "title":
                  score += 20;
                  break;
                case "style": {
                  const clickedStyle = attributes[attrName] || "";
                  const mappedStyle = mappedElement.attributes[attrName] || "";
                  if (clickedStyle && mappedStyle) {
                    const clickedProps = clickedStyle
                      .split(";")
                      .map((s) => s.trim())
                      .filter((s) => s);
                    const mappedProps = mappedStyle
                      .split(";")
                      .map((s) => s.trim())
                      .filter((s) => s);
                    const matchedProps = clickedProps.filter((prop) => mappedProps.includes(prop));
                    score += (matchedProps.length / Math.max(clickedProps.length, 1)) * 25;
                  }
                  break;
                }
                default:
                  score += 10;
              }
            }
          });

          if (textContent && mappedElement.content) {
            const textSimilarity = calculateTextSimilarity(textContent, mappedElement.content);
            score += textSimilarity;
          }

          const clickedDepth = clickedElementPath.split("/").length - 1;
          const depthDiff = Math.abs(clickedDepth - mappedElement.depth);
          if (depthDiff <= 1) score += 10;
        }

        if (score > bestMatch.score) {
          bestMatch = {
            element: mappedElement,
            score,
            line: mappedElement.startLine,
          };
        }
      });

      if (bestMatch.score >= 10) {
        const targetLine = bestMatch.line;

        editorRef.current.revealLineInCenter(targetLine + 1);
        editorRef.current.setPosition({
          lineNumber: targetLine + 1,
          column: bestMatch.element.startColumn + 1,
        });

        const startLine = bestMatch.element.startLine + 1;
        const endLine = bestMatch.element.endLine + 1;
        const startColumn = bestMatch.element.startColumn + 1;
        const endColumn = bestMatch.element.endColumn + 1;

        const decoration = editorRef.current.createDecorationsCollection([
          {
            range: {
              startLineNumber: startLine,
              startColumn: startColumn,
              endLineNumber: endLine,
              endColumn: endColumn,
            },
            options: {
              className: "highlighted-line",
              glyphMarginClassName: "highlighted-glyph",
            },
          },
        ]);

        setTimeout(() => {
          if (decoration) {
            decoration.clear();
          }
        }, 2000);
      } 
    } catch (error) {
      console.error("Error finding element in editor:", error);
    }
  };

  const handleIframeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    const target = e.target as HTMLElement;

    if (target.tagName === "A") {
      const anchor = target as HTMLAnchorElement;
      if (anchor.href.startsWith("#")) {
        return;
      }
      window.open(anchor.href, "_blank")?.focus();
      return;
    }

    scrollToElementInEditor(target);

    target.style.outline = "2px solid #3b82f6";
    target.style.outlineOffset = "2px";
    setTimeout(() => {
      target.style.outline = "";
      target.style.outlineOffset = "";
    }, 1000);
  };
  return (
    <div className={styles.container}>
      <ListDrawer onSelect={onMediaSelect} />
      <div className={styles.header}>
        <h3 className={styles.headerTitle}>{"Email Template Preview"}</h3>
        <DrawerToggler slug={DRAWER_SLUG} className={styles.editButton}>
          {"Edit Email Template"}
        </DrawerToggler>
      </div>

      <div className={styles.previewPaneFullWidth}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div>
              <Loader2 className={styles.spinner} />
              <p>Loading template content...</p>
            </div>
          </div>
        ) : (
          <IFrame key={lastUpdated} initialContent={initialContent} className={styles.iframeWrapper}>
            <>
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} onClick={handleIframeClick} style={{ cursor: "pointer", minHeight: "100%" }} />
            </>
          </IFrame>
        )}
      </div>

      {}
      <Drawer slug={DRAWER_SLUG} title="Edit Email Template" className={styles.editorDrawer}>
        <div className={styles.drawerContent}>
          {renderError && <div style={{ marginBottom: "10px", padding: "8px", fontSize: "12px", color: "#fff", backgroundColor: "#dc2626", borderBottom: "1px solid #b91c1c" }}>{`Error: ${renderError}; if you don't want to fix the syntax then wrap the syntax with {% raw %}{% endraw %} to ignore it like #{, #}, {{}} and more`}</div>}
          {loading ? (
            <div className={styles.loadingContainer}>
              <div>
                <Loader2 className={styles.spinner} />
                <p>Loading template content...</p>
              </div>
            </div>
          ) : (
            <Editor
              ref={editorRef}
              onFormatDocument={() => {
                if (editorRef.current) {
                  const formattedValue = editorRef.current.getValue();
                  onValueChange(formattedValue);
                }
              }}
              onToggleUpload={toggleDrawer}
              onChange={(e) => {
                onValueChange(e);
              }}
              placeholder="Add or paste your html..."
              value={value}
              language="html"
              theme={"light"}
            />
          )}
        </div>
      </Drawer>
    </div>
  );
};
