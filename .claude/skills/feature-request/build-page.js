// Runs a feature-request page script with the page kit in reach.
//   node .claude/skills/feature-request/build-page.js <page script> <output folder>
// The page script reads the kit from process.env.FR_KIT and writes into process.env.FR_OUT, so
// it can live outside this repository (beside its .md file) and still find both.
'use strict';
const fs = require('fs');
const path = require('path');

const [scriptArgument, outputArgument] = process.argv.slice(2);
if (!scriptArgument || !outputArgument) {
  console.error('Usage: node build-page.js <page script> <output folder>');
  process.exit(1);
}
const outputFolder = path.resolve(outputArgument);
fs.mkdirSync(outputFolder, { recursive: true });
process.env.FR_KIT = path.join(__dirname, 'page-kit.js');
process.env.FR_OUT = outputFolder;
require(path.resolve(scriptArgument));
console.log(`Written to ${outputFolder}`);
