[![CI](https://github.com/AdametherzLab/chartli/actions/workflows/ci.yml/badge.svg)](https://github.com/AdametherzLab/chartli/actions) [![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

# 📊 chartli

## ✨ Features

- **Zero Config**: Pipe JSON, CSV, or space-separated numbers — it just works
- **Five Chart Types**: Horizontal bars, vertical columns, sparklines, density heatmaps, and high-resolution Braille patterns
- **Interactive Explorer**: Dynamically adjust chart type, width, and color with real-time terminal updates
- **SVG Export**: Generate clean vector graphics for GitHub READMEs and documentation
- **Pipe Friendly**: Seamlessly integrates with `curl`, `cat`, `jq`, and shell workflows
- **ESM Native**: Modern TypeScript with zero dependencies, runs on Bun and Node.js 20+

## 📦 Installation

bash
npm install -g @adametherzlab/chartli
# or
bun add -g @adametherzlab/chartli


## 🚀 Quick Start

bash
# Basic bar chart from piped data
echo "10 50 30 80 60" | chartli

# Sparkline
echo "1 3 5 2 8 4" | chartli --type spark

# SVG export
echo "10 20 30" | chartli --svg output.svg


## 🎮 Interactive Explorer

Launch the interactive explorer to dynamically adjust chart parameters and see real-time updates:

bash
# Start interactive mode from a file
chartli --interactive data.csv

# Or pipe data into interactive mode
echo "10 20 30 40 50" | chartli -i


### Controls

| Key | Action |
|-----|--------|
| `t` / `T` | Cycle chart type forward / backward |
| `w` / `W` | Increase / decrease width by 5 |
| `c` / `C` | Cycle color scheme forward / backward |
| `q` | Quit explorer |

The explorer displays the current chart type, width, and color scheme in a status bar below the chart. Changes are applied instantly.

## 📖 API

### `parseText(input: string): ParsedData`

Parse raw text (JSON, CSV, or space-separated numbers) into normalized data.

### `renderBar(values, options): RenderResult`

Render a horizontal bar chart.

### `renderSpark(values, options): RenderResult`

Render a single-line sparkline.

### `renderColumn(values, options): RenderResult`

Render a vertical column chart.

### `renderHeatmap(values, options): RenderResult`

Render a 2D heatmap grid.

### `renderBraille(values, options): RenderResult`

Render a high-resolution Braille dot pattern.

### `renderToSvg(values, options, chartType): string`

Generate SVG markup.

### `createExplorerState(options?): ExplorerState`

Create an initial explorer state from chart options.

### `applyKey(state, key): ExplorerState | null`

Apply a keypress to explorer state. Returns `null` on quit.

### `buildFrame(values, state): string`

Build a complete terminal frame (chart + status bar) for the explorer.

### `startExplorer(data, options?): Promise<void>`

Start the interactive terminal explorer session.
