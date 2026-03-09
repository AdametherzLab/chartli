import * as fs from "fs";
import * as path from "path";
import type { ParsedData } from "./types.js";

/**
 * Strip UTF-8 BOM if present from text content.
 */
function stripBom(text: string): string {
  return text.replace(/^\uFEFF/, "");
}

/**
 * Parse JSON array into values and optional labels.
 */
function parseJson(data: unknown): ParsedData {
  if (!Array.isArray(data)) throw new TypeError("JSON root must be an array");
  if (data.length === 0) return { values: [], sourceFormat: "json" };

  if (data.every((d) => typeof d === "number" && Number.isFinite(d))) {
    return { values: data as number[], sourceFormat: "json" };
  }

  if (!data.every((d) => typeof d === "object" && d !== null)) {
    throw new TypeError("JSON array must contain only numbers or objects");
  }

  const first = data[0] as Record<string, unknown>;
  const numKey =
    Object.keys(first).find((k) => typeof first[k] === "number") ??
    Object.keys(first).find((k) => !Number.isNaN(parseFloat(String(first[k]))));

  if (!numKey) throw new TypeError("JSON objects must contain at least one numeric field");

  const values: number[] = [];
  const labels: string[] = [];

  for (const item of data) {
    const obj = item as Record<string, unknown>;
    const val = typeof obj[numKey] === "number" ? obj[numKey] : parseFloat(String(obj[numKey]));
    if (!Number.isFinite(val)) throw new TypeError(`Invalid number in field "${numKey}"`);
    values.push(val);

    const labelKey = Object.keys(obj).find(
      (k) => ["label", "name", "key", "id", "category"].includes(k) && typeof obj[k] === "string"
    );
    if (labelKey) labels.push(String(obj[labelKey]));
  }

  return {
    values,
    labels: labels.length === values.length ? labels : undefined,
    sourceFormat: "json",
  };
}

/**
 * Parse CSV content into values and optional labels.
 * Handles optional header row and basic quoted fields.
 */
function parseCsv(text: string): ParsedData {
  const lines = stripBom(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  if (lines.length === 0) return { values: [], sourceFormat: "csv" };

  const rows = lines.map((line) => line.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
  const hasHeader =
    rows.length > 1 &&
    rows[0].some((cell, idx) => Number.isNaN(parseFloat(cell)) && !Number.isNaN(parseFloat(rows[1][idx])));

  const data = hasHeader ? rows.slice(1) : rows;
  if (data.length === 0) return { values: [], sourceFormat: "csv" };

  const numCol = rows[0].findIndex((_, idx) =>
    data.every((r) => {
      const n = parseFloat(r[idx]);
      return !Number.isNaN(n) && Number.isFinite(n);
    })
  );

  if (numCol === -1) throw new TypeError("CSV must contain at least one column with numeric values");

  const values = data.map((r) => parseFloat(r[numCol]));
  const labelCol = numCol === 0 && rows[0].length > 1 ? 1 : numCol > 0 ? 0 : -1;
  const labels = labelCol >= 0 ? data.map((r) => r[labelCol]) : undefined;

  return { values, labels, sourceFormat: "csv" };
}

/**
 * Parse plain whitespace-separated numbers.
 */
function parsePlain(text: string): ParsedData {
  const values = stripBom(text)
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !t.startsWith("#"))
    .map((t) => {
      const n = parseFloat(t);
      if (Number.isNaN(n) || !Number.isFinite(n)) throw new TypeError(`Cannot parse "${t}" as a finite number`);
      return n;
    });

  if (values.length === 0) throw new Error("No numeric values found in input");
  return { values, sourceFormat: "plain" };
}

/**
 * Synchronously parse text input into normalized numeric data.
 * Auto-detects format: JSON, CSV, or plain whitespace-separated values.
 * Strips UTF-8 BOM, ignores lines starting with #, and filters empty lines.
 *
 * @param input - Raw text content to parse
 * @returns Normalized parsed data with values and optional labels
 * @throws {TypeError} If format detection fails or data contains invalid numbers
 * @throws {Error} If input is empty
 * @example
 * parseText("10 20 30");
 * // => { values: [10, 20, 30], sourceFormat: "plain" }
 *
 * @example
 * parseText('[{"value": 5, "label": "A"}, {"value": 10, "label": "B"}]');
 * // => { values: [5, 10], labels: ["A", "B"], sourceFormat: "json" }
 */
export function parseText(input: string): ParsedData {
  if (!input?.trim()) throw new Error("Input text is empty");

  const trimmed = input.trim();

  if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
    try {
      return parseJson(JSON.parse(trimmed));
    } catch (err) {
      if (err instanceof TypeError) throw err;
    }
  }

  if (trimmed.includes(",") && trimmed.split(/\r?\n/).some((l) => l.includes(","))) {
    try {
      return parseCsv(trimmed);
    } catch (err) {
      if (err instanceof TypeError) throw err;
    }
  }

  return parsePlain(trimmed);
}

/**
 * Asynchronously parse input from file path or stdin stream.
 * Reads entire input into memory for format detection and parsing.
 *
 * @param source - File path to read, "-" for stdin, or undefined to auto-detect stdin
 * @returns Promise resolving to normalized parsed data
 * @throws {Error} If file cannot be read, input is empty, or no source provided
 * @throws {TypeError} If detected format contains invalid numeric data
 * @example
 * // Read from file
 * const data = await parseInput("./metrics.csv");
 *
 * @example
 * // Read from piped stdin
 * const data = await parseInput("-");
 *
 * @example
 * // Auto-detect stdin
 * const data = await parseInput();
 */
export async function parseInput(source?: string): Promise<ParsedData> {
  let content: string;

  const useStdin = source === "-" || (!source && process.stdin.isTTY === false);

  if (useStdin) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(Buffer.from(chunk));
    }
    content = Buffer.concat(chunks).toString("utf-8");
  } else if (source) {
    const resolved = path.isAbsolute(source) ? source : path.join(process.cwd(), source);
    if (!fs.existsSync(resolved)) throw new Error(`File not found: ${source}`);
    content = fs.readFileSync(resolved, "utf-8");
  } else {
    throw new Error("No input source provided: specify file path or pipe data to stdin");
  }

  return parseText(content);
}