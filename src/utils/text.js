export const normalizeLineEndings = (value = "") =>
  value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

export const escapeXml = (value = "") =>
  value.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      case "'":
        return "&apos;";
      default:
        return char;
    }
  });

export const escapeAttribute = (value = "") =>
  escapeXml(value).replace(/`/g, "&#96;");

export const isBlank = (value = "") => value.trim().length === 0;

export const collapseWhitespace = (value = "") =>
  value.replace(/\s+/g, " ").trim();

export const stripOuterQuotes = (value = "") =>
  value.replace(/^[“”"'`]+/, "").replace(/[“”"'`]+$/, "");

