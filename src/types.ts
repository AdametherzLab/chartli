/**
 * Supported chart visualization formats.
 */
export type ChartType = 'bar' | 'column' | 'spark' | 'heatmap' | 'braille';

/**
 * Terminal color support levels and named colors.
 */
export type ColorScheme = 'auto' | 'none' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white';

/**
 * Configuration options for chart rendering operations.
 */
export interface ChartOptions {
  /** Maximum width of the chart in characters. Defaults to terminal width or 80. */
  readonly width?: number;
  
  /** Color scheme for chart elements. */
  readonly color?: ColorScheme;
  
  /** Title displayed above the chart visualization. */
  readonly title?: string;
  
  /** Absolute or relative path for SVG file output. If omitted, no SVG is generated. */
  readonly svgOutputPath?: string;
  
  /** Specific chart type to render. */
  readonly chartType?: ChartType;
}

/**
 * Normalized input data structure containing numeric values with optional metadata.
 */
export interface ParsedData {
  /** Array of numeric values to visualize. Must be finite numbers. */
  readonly values: readonly number[];
  
  /** Optional human-readable labels corresponding to each value. */
  readonly labels?: readonly string[];
  
  /** Identifier for the original input format (e.g., 'csv', 'json', 'tsv', 'plain'). */
  readonly sourceFormat?: string;
}

/**
 * Output structure containing rendered chart representations.
 */
export interface RenderResult {
  /** Formatted string suitable for terminal display (ASCII/Unicode art). */
  readonly terminal: string;
  
  /** Scalable Vector Graphics markup for embedding in documents or web pages. */
  readonly svg?: string;
}

/**
 * Branded type representing a validated file system path.
 * Prevents accidental use of unvalidated strings as paths.
 */
export type ValidatedPath = string & { readonly __brand: 'ValidatedPath' };

/**
 * Branded type representing a validated hexadecimal color code (e.g., '#FF5733').
 */
export type HexColor = string & { readonly __brand: 'HexColor' };