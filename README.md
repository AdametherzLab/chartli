[![CI](https://github.com/AdametherzLab/chartli/actions/workflows/ci.yml/badge.svg)](https://github.com/AdametherzLab/chartli/actions) [![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

# 📊 chartli

## ✨ Features

- **Zero Config**: Pipe JSON, CSV, or space-separated numbers — it just works
- **Five Chart Types**: Horizontal bars, vertical columns, sparklines, density heatmaps, and high-resolution Braille patterns
- **SVG Export**: Generate clean vector graphics for GitHub READMEs and documentation
- **Pipe Friendly**: Seamlessly integrates with `curl`, `cat`, `jq`, and shell workflows
- **ESM Native**: Modern TypeScript with zero dependencies, runs on Bun and Node.js 20+

## 📦 Installation

```bash
npm install -g @adametherzlab/chartli
# or
bun add -g @adametherzlab/chartli
```

## 🚀 Quick Start

```bash
# Basic bar chart from piped data
echo "10 50 30 80 20" | chartli

# Sparkline from a file
chartli --type spark metrics.txt

# Vertical columns with custom width and color
cat data.csv | chartli --type column --width 60 --color cyan

# Export to SVG for your README
chartli --svg chart.svg --title "Q4 Revenue" sales.json
```

## 🖥️ CLI Usage

### Chart Types

**Bar Chart** (default) — Horizontal bars using Unicode blocks:
```bash
chartli values.txt
# or explicitly
chartli --type bar values.txt
```
Output:
```
Sales    ████████████████████ 120
Revenue  ██████████████ 85
Profit   ██████ 42
```

**Sparkline** — Compact single-line trend:
```bash
echo "1 5 2 8 3 9" | chartli --type spark
```
Output:
```
▁▄▂█▃█
```

**Column Chart** — Vertical bars:
```bash
chartli --type column --height 10 data.json
```

**Heatmap** — 2D density visualization:
```bash
chartli --type heatmap matrix.csv
```

**Braille** — High-resolution dot matrix:
```bash
chartli --type braille --width 40 sensor-data.txt
```

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--type` | Chart type: `bar`, `column`, `spark`, `heatmap`, `braille` | `bar` |
| `--width` | Maximum width in characters | `80` |
| `--height` | Maximum height (for column charts) | `20` |
| `--color` | Color scheme: `auto`, `none`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan` | `auto` |
| `--title` | Chart title displayed above output | none |
| `--svg` | Export to SVG file path | none |

## 🔌 Programmatic API

```typescript
// REMOVED external import: import { parseText, renderBar, renderSpark, renderToSvg, type ChartOptions } from '@adametherzlab/chartli';

// Parse raw input
const data = parseText("10 20 30 40");
console.log(data.values); // [10, 20, 30, 40]

// Render options
const options: ChartOptions = {
  width: 60,
  color: 'green',
  title: 'Weekly Active Users'
};

// Generate terminal chart
const result = renderBar([10, 25, 15, 40, 30], options);
console.log(result.terminal);

// Export SVG
const svg = renderToSvg([10, 25, 15, 40, 30], options, 'bar');
await Bun.write('chart.svg', svg);
```

### API Reference

#### `parseText(input: string): ParsedData`
```typescript
const data = parseText("10 20 30");
// => { values: [10, 20, 30], sourceFormat: "plain" }
```

#### `parseInput(source?: string): Promise<ParsedData>`
```typescript
const data = await parseInput("./metrics.csv");
const fromStdin = await parseInput("-");
```

#### `renderBar(values: readonly number[], options: ChartOptions): RenderResult`
#### `renderColumn(values: readonly number[], options: ChartOptions): RenderResult`
Render vertical column chart.

#### `renderSpark(values: readonly number[], options: ChartOptions): RenderResult`
Render single-line sparkline using `▁▂▃▄▅▆▇█`.

#### `renderHeatmap(values: readonly number[], options: ChartOptions): RenderResult`
#### `renderBraille(values: readonly number[], options: ChartOptions): RenderResult`
Render high-resolution dot-matrix using Unicode Braille patterns (U+2800–U+28FF).

#### `renderChart(values: readonly number[], options: ChartOptions, type: ChartType): RenderResult`
#### `renderToSvg(values: readonly number[], options: ChartOptions, chartType: ChartType): string`
#### `runCli(argv: readonly string[]): void`
Execute the CLI programmatically.

```typescript
// REMOVED external import: import { runCli } from '@adametherzlab/chartli';
runCli(["--type", "spark", "data.txt"]);
```

## 🎨 SVG Export Workflow

Generate publication-ready charts for documentation:

```bash
chartli --type bar --svg assets/chart.svg --title "Response Times (ms)" --width 800 benchmarks.json
```

```markdown
![Performance Chart](./assets/chart.svg)
```

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 License

MIT © [AdametherzLab](https://github.com/AdametherzLab)