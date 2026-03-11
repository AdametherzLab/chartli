[![CI](https://github.com/AdametherzLab/chartli/actions/workflows/ci.yml/badge.svg)](https://github.com/AdametherzLab/chartli/actions) [![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

# 📊 chartli

## ✨ Features

- **Zero Config**: Pipe JSON, CSV, or space-separated numbers — it just works
- **Direct File Input**: Specify file paths directly or pipe content via stdin
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


## 🚀 Usage

bash
# Read from a file
chartli data.csv

# Pipe data from another command
curl https://api.example.com/metrics | chartli --type column

# Interactive explorer mode
chartli -i sales.json

# Export to SVG file
chartli temperatures.txt --svg output.svg --width 1200


## 📄 Examples

bash
# Basic bar chart from CSV
chartli --type bar data.csv

# Sparkline with custom color
cat metrics.txt | chartli --type spark --color magenta

# Generate SVG from JSON array
chartli values.json --svg chart.svg
