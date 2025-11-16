import { escapeXml, normalizeLineEndings, isBlank } from "../../utils/text.js";

export const matheusV1Converter = {
  id: "matheus.v1",
  label: "Matheus v1",
  description: "Matheus' original Markdown → XML strategy (headings become nested tags, lists and code intact).",
  guidePath: "./guide.html",
  convert(markdown = "") {
    const start = performance?.now ? performance.now() : Date.now();
    const blocks = tokenizeBlocks(markdown ?? "");
    const output = renderBlocks(blocks);
    const end = performance?.now ? performance.now() : Date.now();

    return {
      output,
      diagnostics: {
        durationMs: Number((end - start).toFixed(3)),
        messages: [],
      },
    };
  },
};

function tokenizeBlocks(markdown) {
  const lines = normalizeLineEndings(markdown).split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (isBlank(line)) {
      index += 1;
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    const italicHeadingMatch = line.match(/^\s{0,3}_([^_].*?)_\s*$/);
    const boldHeadingMatch = line.match(/^\s{0,3}__([^_].*?)__\s*$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      index += 1;
      continue;
    }
    if (italicHeadingMatch) {
      blocks.push({
        type: "heading",
        level: 1,
        text: italicHeadingMatch[1].trim(),
      });
      index += 1;
      continue;
    }
    if (boldHeadingMatch) {
      blocks.push({
        type: "heading",
        level: 1,
        text: boldHeadingMatch[1].trim(),
      });
      index += 1;
      continue;
    }

    const fenceMatch = line.trim().match(/^```(\w+)?\s*$/);
    if (fenceMatch) {
      const { block, nextIndex } = readCodeFence(lines, index, fenceMatch[1] ?? "");
      blocks.push(block);
      index = nextIndex;
      continue;
    }

    const unorderedMatch = line.match(/^\s{0,3}[-*+]\s+(.*)$/);
    if (unorderedMatch) {
      const { block, nextIndex } = readList(lines, index, "unordered");
      blocks.push(block);
      index = nextIndex;
      continue;
    }

    const orderedMatch = line.match(/^\s{0,3}\d+[.)]\s+(.*)$/);
    if (orderedMatch) {
      const { block, nextIndex } = readList(lines, index, "ordered");
      blocks.push(block);
      index = nextIndex;
      continue;
    }

    const { block, nextIndex } = readParagraph(lines, index);
    if (block.content.length > 0) {
      blocks.push(block);
    }
    index = nextIndex;
  }

  return blocks;
}

function readCodeFence(lines, start, language) {
  const content = [];
  let index = start + 1;

  while (index < lines.length) {
    const candidate = lines[index];
    if (candidate.trim().startsWith("```")) {
      index += 1;
      break;
    }
    content.push(candidate);
    index += 1;
  }

  return {
    block: {
      type: "code",
      language: language || null,
      content: content.join("\n"),
    },
    nextIndex: index,
  };
}

function readList(lines, start, mode) {
  const items = [];
  let index = start;
  const matcher =
    mode === "ordered" ? /^\s{0,3}\d+[.)]\s+(.*)$/ : /^\s{0,3}[-*+]\s+(.*)$/;
  
  // Get the base indentation from the first item
  const firstLine = lines[start];
  const baseIndent = firstLine.match(/^(\s*)/)[1].length;

  while (index < lines.length) {
    const current = lines[index];
    if (isBlank(current)) {
      // Check if next line is a nested list before breaking
      if (index + 1 < lines.length) {
        const nextLine = lines[index + 1];
        const nextIndent = nextLine.match(/^(\s*)/)?.[1]?.length ?? 0;
        if (nextIndent > baseIndent) {
          const nestedUnorderedMatch = nextLine.match(/^\s+[-*+]\s+(.*)$/);
          const nestedOrderedMatch = nextLine.match(/^\s+\d+[.)]\s+(.*)$/);
          if (nestedUnorderedMatch || nestedOrderedMatch) {
            // Skip blank line and process nested list
            index += 1;
            continue;
          }
        }
      }
      index += 1;
      break;
    }

    const match = current.match(matcher);
    if (!match) {
      // Check if this is a nested list (more indentation)
      const currentIndent = current.match(/^(\s*)/)?.[1]?.length ?? 0;
      if (currentIndent > baseIndent) {
        // Try to parse as nested list - match any indentation greater than base
        const nestedUnorderedMatch = current.match(/^\s+[-*+]\s+(.*)$/);
        const nestedOrderedMatch = current.match(/^\s+\d+[.)]\s+(.*)$/);
        
        if (nestedUnorderedMatch || nestedOrderedMatch) {
          // Parse nested list
          const nestedMode = nestedOrderedMatch ? "ordered" : "unordered";
          const { block: nestedBlock, nextIndex: nestedNextIndex } = readList(lines, index, nestedMode);
          
          // Attach nested list to the last item
          if (items.length > 0) {
            const lastItem = items[items.length - 1];
            if (typeof lastItem === "string") {
              items[items.length - 1] = { text: lastItem, nested: [nestedBlock] };
            } else {
              if (!lastItem.nested) {
                lastItem.nested = [];
              }
              lastItem.nested.push(nestedBlock);
            }
          }
          
          index = nestedNextIndex;
          continue;
        }
      }
      // Not a nested list, break
      break;
    }

    items.push(match[1].trim());
    index += 1;
  }

  return {
    block: {
      type: "list",
      order: mode,
      items,
    },
    nextIndex: index,
  };
}

function readParagraph(lines, start) {
  const collected = [lines[start]];
  let index = start + 1;

  while (index < lines.length) {
    const line = lines[index];
    if (isBlank(line)) {
      index += 1;
      break;
    }
    if (/^#{1,6}\s+/.test(line)) break;
    if (/^\s{0,3}[-*+]\s+/.test(line)) break;
    if (/^\s{0,3}\d+[.)]\s+/.test(line)) break;
    if (line.trim().startsWith("```")) break;

    collected.push(line);
    index += 1;
  }

  return {
    block: {
      type: "paragraph",
      content: collected.join(" "),
    },
    nextIndex: index,
  };
}

function renderBlocks(blocks) {
  if (!blocks.length) {
    return "";
  }

  const stack = [];
  const output = [];

  blocks.forEach((block) => {
    if (block.type === "heading") {
      while (
        stack.length > 0 &&
        stack[stack.length - 1].level >= block.level
      ) {
        const closed = stack.pop();
        output.push(indentStr(closed.indentLevel) + `</${closed.tagName}>`);
      }

      const tagName = headingToTagName(block.text);
      const indentLevel = stack.length; // Indent based on nesting depth, not header level
      output.push(indentStr(indentLevel) + `<${tagName}>`);
      stack.push({ level: block.level, tagName, indentLevel });
      return;
    }

    const currentLevel = stack.length + 1; // Content indentation: one level deeper than the header
    output.push(...renderBlock(block, currentLevel));
  });

  while (stack.length > 0) {
    const closed = stack.pop();
    output.push(indentStr(closed.indentLevel) + `</${closed.tagName}>`);
  }

  return output.join("\n");
}

function renderBlock(block, indentLevel) {
  switch (block.type) {
    case "paragraph":
      return [indentStr(indentLevel) + escapeXml(block.content)];
    case "list":
      return renderList(block.items, indentLevel, block.order === "ordered");
    case "code":
      return renderCode(block, indentLevel);
    default:
      return [];
  }
}

function renderList(items, indentLevel, isOrdered = false) {
  const lines = [];
  items.forEach((item, index) => {
    const numberAttr = isOrdered ? ` number="${index + 1}"` : "";
    const itemText = typeof item === "string" ? item : item.text;
    const nested = typeof item === "object" && item.nested ? item.nested : [];
    
    if (nested.length > 0) {
      // Item with nested content - put text and nested content on separate lines
      lines.push(indentStr(indentLevel) + `<item${numberAttr}>${escapeXml(itemText)}`);
      nested.forEach((nestedBlock) => {
        const nestedIndentLevel = indentLevel + 1;
        lines.push(...renderBlock(nestedBlock, nestedIndentLevel));
      });
      lines.push(indentStr(indentLevel) + `</item>`);
    } else {
      // Simple item without nested content
      lines.push(indentStr(indentLevel) + `<item${numberAttr}>${escapeXml(itemText)}</item>`);
    }
  });
  return lines;
}

function renderCode(block, indentLevel) {
  const indentValue = indentStr(indentLevel);
  const langAttr = block.language ? ` lang="${escapeXml(block.language)}"` : "";
  return [
    `${indentValue}<code${langAttr}><![CDATA[`,
    block.content,
    `]]></code>`,
  ];
}

function headingToTagName(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/^_+|_+$/g, "") || "section";
}

function indent(level) {
  return indentStr(Math.max(0, level - 1));
}

function indentStr(level) {
  return "  ".repeat(level);
}

