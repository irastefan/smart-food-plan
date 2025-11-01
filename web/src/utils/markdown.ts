const FRONT_MATTER_DIVIDER = "---";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type ObjectContext = {
  type: "object";
  indent: number;
  value: Record<string, JsonValue>;
};

type ArrayContext = {
  type: "array";
  indent: number;
  value: JsonValue[];
};

type ParseContext = ObjectContext | ArrayContext;

function countIndent(line: string): number {
  let count = 0;
  for (const char of line) {
    if (char === " ") {
      count += 1;
      continue;
    }
    if (char === "\t") {
      count += 2;
      continue;
    }
    break;
  }
  return count;
}

function parseScalar(raw: string): JsonValue {
  if (raw === "" || raw === "~" || raw === "null") {
    return null;
  }
  if (raw === "true" || raw === "True") {
    return true;
  }
  if (raw === "false" || raw === "False") {
    return false;
  }
  if (/^-?\d+(\.\d+)?$/.test(raw)) {
    const parsed = Number.parseFloat(raw);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  if (raw.startsWith('"') && raw.endsWith('"')) {
    const inner = raw.slice(1, -1);
    return inner.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  if (raw.startsWith("'") && raw.endsWith("'")) {
    const inner = raw.slice(1, -1);
    return inner.replace(/''/g, "'");
  }
  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const jsonish = raw.replace(/'/g, '"');
      const parsed = JSON.parse(jsonish) as JsonValue;
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      /* noop */
    }
  }
  if (raw.startsWith("{") && raw.endsWith("}")) {
    try {
      const jsonish = raw.replace(/'/g, '"');
      const parsed = JSON.parse(jsonish) as JsonValue;
      if (typeof parsed === "object" && parsed !== null) {
        return parsed;
      }
    } catch {
      /* noop */
    }
  }
  return raw;
}

function peekNextNonEmpty(lines: string[], startIndex: number): { index: number; line: string } | null {
  for (let i = startIndex; i < lines.length; i += 1) {
    const candidate = lines[i];
    if (candidate.trim().length === 0) {
      continue;
    }
    return { index: i, line: candidate };
  }
  return null;
}

function ensureArrayContext(parent: ObjectContext, key: string, indent: number): ArrayContext {
  const array: JsonValue[] = [];
  parent.value[key] = array;
  return { type: "array", indent, value: array };
}

function ensureObjectContext(parent: ObjectContext, key: string, indent: number): ObjectContext {
  const obj: Record<string, JsonValue> = {};
  parent.value[key] = obj;
  return { type: "object", indent, value: obj };
}

function pushScalarToArray(parent: ArrayContext, value: JsonValue): void {
  parent.value.push(value);
}

function ensureObjectItemForArray(parent: ArrayContext, indent: number): ObjectContext {
  const obj: Record<string, JsonValue> = {};
  parent.value.push(obj);
  return { type: "object", indent, value: obj };
}

function parseYaml(frontMatter: string): Record<string, JsonValue> {
  const lines = frontMatter.split(/\r?\n/);
  const root: ParseContext = { type: "object", indent: -1, value: {} };
  const stack: ParseContext[] = [root];

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    if (!rawLine || rawLine.trim().length === 0 || rawLine.trim().startsWith("#")) {
      continue;
    }
    const indent = countIndent(rawLine);
    const trimmed = rawLine.trim();

    while (stack.length > 1) {
      const top = stack[stack.length - 1];
      if (indent > top.indent) {
        break;
      }
      if (indent === top.indent && trimmed.startsWith("- ") && top.type === "array") {
        break;
      }
      stack.pop();
    }

    const parent = stack[stack.length - 1];

    if (trimmed.startsWith("- ")) {
      const itemContent = trimmed.slice(2).trim();
      if (itemContent.length === 0) {
        if (parent.type !== "array") {
          throw new Error("Invalid YAML structure: expected array context");
        }
        const objectContext = ensureObjectItemForArray(parent, indent);
        stack.push(objectContext);
        continue;
      }

      if (itemContent.includes(":")) {
        const [rawKey, ...restParts] = itemContent.split(":");
        const key = rawKey.trim();
        const valuePart = restParts.join(":").trim();
        if (parent.type !== "array") {
          throw new Error("Invalid YAML structure: expected array context");
        }
        const objectContext = ensureObjectItemForArray(parent, indent);
        objectContext.value[key] = valuePart === "" ? null : parseScalar(valuePart);
        stack.push(objectContext);
      } else {
        if (parent.type !== "array") {
          throw new Error("Invalid YAML structure: expected array context");
        }
        pushScalarToArray(parent, parseScalar(itemContent));
      }
      continue;
    }

    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const valuePart = trimmed.slice(separatorIndex + 1).trim();

    if (valuePart.length === 0) {
      if (parent.type !== "object") {
        throw new Error("Invalid YAML structure: expected object context");
      }
      const next = peekNextNonEmpty(lines, index + 1);
      const nextIndent = next ? countIndent(next.line) : indent + 2;
      const isArray = next ? next.line.trim().startsWith("- ") : false;
      const contextIndent = isArray ? indent : nextIndent - 1;
      const context = isArray
        ? ensureArrayContext(parent, key, contextIndent)
        : ensureObjectContext(parent, key, contextIndent);
      stack.push(context);
      continue;
    }

    if (parent.type !== "object") {
      throw new Error("Invalid YAML structure: expected object context for scalar value");
    }
    parent.value[key] = parseScalar(valuePart);
  }

  return root.value;
}

function escapeString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function isObject(value: JsonValue): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringifyScalar(value: JsonValue): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : String(value);
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "string") {
    if (value === "") {
      return '""';
    }
    if (/^[\w\s\-\.,:%]+$/.test(value)) {
      return `"${escapeString(value)}"`;
    }
    return `"${escapeString(value)}"`;
  }
  if (Array.isArray(value) || isObject(value)) {
    return JSON.stringify(value);
  }
  return `"${escapeString(String(value))}"`;
}

function stringifyYamlValue(value: JsonValue, indentLevel: number): string {
  const indent = "  ".repeat(indentLevel);
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }
    const lines: string[] = [];
    for (const item of value) {
      if (isObject(item)) {
        const objectEntries = Object.entries(item);
        if (objectEntries.length === 0) {
          lines.push(`${indent}- {}`);
          continue;
        }
        const [firstKey, firstValue] = objectEntries[0];
        const head = `${indent}- ${firstKey}: ${
          isObject(firstValue) || Array.isArray(firstValue)
            ? ""
            : stringifyScalar(firstValue)
        }`;
        lines.push(head.trimEnd());
        const remainingEntries = objectEntries.slice(1);
        const childIndent = indentLevel + 1;
        if (isObject(firstValue) || Array.isArray(firstValue)) {
          lines.push(
            stringifyYamlValue(firstValue, childIndent)
              .split("\n")
              .map((line) => `${"  ".repeat(childIndent)}${line}`)
              .join("\n")
          );
        }
        for (const [entryKey, entryValue] of remainingEntries) {
          if (isObject(entryValue) || Array.isArray(entryValue)) {
            lines.push(`${"  ".repeat(childIndent)}${entryKey}:`);
            lines.push(
              stringifyYamlValue(entryValue, childIndent + 1)
                .split("\n")
                .map((line) => `${"  ".repeat(childIndent + 1)}${line}`)
                .join("\n")
            );
          } else {
            lines.push(`${"  ".repeat(childIndent)}${entryKey}: ${stringifyScalar(entryValue)}`);
          }
        }
      } else {
        lines.push(`${indent}- ${stringifyScalar(item)}`);
      }
    }
    return lines.join("\n");
  }

  if (isObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return "{}";
    }
    const lines: string[] = [];
    for (const [key, entryValue] of entries) {
      if (isObject(entryValue) || Array.isArray(entryValue)) {
        lines.push(`${indent}${key}:`);
        const nested = stringifyYamlValue(entryValue, indentLevel + 1)
          .split("\n")
          .map((line) => `${"  ".repeat(indentLevel + 1)}${line}`)
          .join("\n");
        lines.push(nested);
      } else {
        lines.push(`${indent}${key}: ${stringifyScalar(entryValue)}`);
      }
    }
    return lines.join("\n");
  }

  return stringifyScalar(value);
}

function stringifyYaml(frontMatter: Record<string, JsonValue>): string {
  return stringifyYamlValue(frontMatter, 0);
}

function extractFrontMatter(source: string): { frontMatter: string; body: string } {
  const lines = source.split(/\r?\n/);
  if (lines.length === 0 || lines[0].trim() !== FRONT_MATTER_DIVIDER) {
    return { frontMatter: "", body: source };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === FRONT_MATTER_DIVIDER) {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { frontMatter: "", body: source };
  }

  const frontMatterText = lines.slice(1, endIndex).join("\n");
  const body = lines.slice(endIndex + 1).join("\n");
  return { frontMatter: frontMatterText, body };
}

export function parseMarkdownDocument(source: string): {
  data: Record<string, JsonValue>;
  body: string;
} {
  const { frontMatter, body } = extractFrontMatter(source);
  if (!frontMatter.trim()) {
    return { data: {}, body };
  }
  try {
    return { data: parseYaml(frontMatter), body };
  } catch (error) {
    console.error("Failed to parse YAML front matter", error);
    return { data: {}, body };
  }
}

export function buildMarkdownDocument(
  data: Record<string, JsonValue>,
  body: string
): string {
  const yamlText = stringifyYaml(data);
  const trimmedBody = body.replace(/\s+$/u, "");
  return `${FRONT_MATTER_DIVIDER}\n${yamlText}\n${FRONT_MATTER_DIVIDER}\n\n${trimmedBody}\n`;
}

export function formatAutoBlock(marker: string, content: string): string {
  const trimmed = content.trim();
  return `<!-- AUTO:${marker} START -->\n${trimmed}\n<!-- AUTO:${marker} END -->`;
}

export function upsertAutoBlock(body: string, marker: string, content: string): string {
  const startToken = `<!-- AUTO:${marker} START -->`;
  const endToken = `<!-- AUTO:${marker} END -->`;
  const trimmedContent = content.trim();
  const block = `${startToken}\n${trimmedContent}\n${endToken}`;

  const startIndex = body.indexOf(startToken);
  const endIndex = body.indexOf(endToken);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const before = body.slice(0, startIndex).replace(/\s+$/u, "");
    const after = body.slice(endIndex + endToken.length).replace(/^\s+/u, "");
    const pieces = [];
    if (before) {
      pieces.push(before);
    }
    pieces.push(block);
    if (after) {
      pieces.push(after);
    }
    return `${pieces.join("\n\n")}\n`;
  }

  const trimmedBody = body.trim();
  if (!trimmedBody) {
    return `${block}\n`;
  }
  return `${trimmedBody}\n\n${block}\n`;
}

export type { JsonValue };
