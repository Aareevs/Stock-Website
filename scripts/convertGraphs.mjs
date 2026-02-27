/**
 * convertGraphs.mjs
 *
 * Reads graph-data.xlsx, extracts Price columns from all 12 sheets,
 * shuffles sheets randomly (Fisher-Yates), maps each to a company symbol,
 * and outputs data/graphData.json.
 *
 * Run once manually: node scripts/convertGraphs.mjs
 * The mapping is permanent until re-run.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

const EXCEL_PATH = join(ROOT, "graph-data.xlsx");
const OUTPUT_PATH = join(ROOT, "data", "graphData.json");

const SYMBOLS = [
  "VELOCITY",
  "APEXAUTO",
  "CRUISER",
  "VITALIS",
  "CAREPLUS",
  "MEDISURG",
  "EDUNEXT",
  "SCHOLAR",
  "BRAINB",
  "FRESHC",
  "SPICER",
  "URBANB",
];

// Fisher-Yates shuffle (in-place)
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function main() {
  console.log("📊 Reading Excel file:", EXCEL_PATH);

  const buf = readFileSync(EXCEL_PATH);
  const workbook = XLSX.read(buf, { type: "buffer" });

  const sheetNames = workbook.SheetNames;
  console.log(`📋 Found ${sheetNames.length} sheets:`, sheetNames);

  if (sheetNames.length !== SYMBOLS.length) {
    throw new Error(
      `Sheet count mismatch! Expected ${SYMBOLS.length} sheets, found ${sheetNames.length}.\n` +
        `Sheets: ${sheetNames.join(", ")}\n` +
        `Symbols: ${SYMBOLS.join(", ")}`,
    );
  }

  // Extract Price arrays from each sheet
  const sheetData = {};
  for (const name of sheetNames) {
    const sheet = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const prices = [];
    for (const row of rows) {
      const price = row.Price ?? row.price ?? row.PRICE;
      if (price === undefined || price === null || price === "") continue;
      const num = Number(price);
      if (!Number.isFinite(num)) {
        console.warn(`⚠️  Skipping invalid price in sheet "${name}": ${price}`);
        continue;
      }
      prices.push(parseFloat(num.toFixed(4)));
    }

    if (prices.length === 0) {
      throw new Error(`Sheet "${name}" has no valid Price data!`);
    }

    sheetData[name] = prices;
    console.log(
      `  ✅ ${name}: ${prices.length} price points (₹${prices[0]} → ₹${prices[prices.length - 1]})`,
    );
  }

  // Shuffle sheet names and map to symbols
  const shuffledSheetNames = shuffle([...sheetNames]);

  const graphData = {};
  const mapping = [];

  for (let i = 0; i < SYMBOLS.length; i++) {
    const symbol = SYMBOLS[i];
    const sheetName = shuffledSheetNames[i];
    graphData[symbol] = sheetData[sheetName];
    mapping.push({
      symbol,
      sheet: sheetName,
      points: sheetData[sheetName].length,
    });
  }

  // Log mapping clearly
  console.log("\n🔀 Random Sheet → Symbol Mapping:");
  console.log("─".repeat(60));
  for (const m of mapping) {
    console.log(`  ${m.symbol.padEnd(12)} ← ${m.sheet} (${m.points} points)`);
  }
  console.log("─".repeat(60));

  // Ensure output directory exists
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });

  // Write JSON
  writeFileSync(OUTPUT_PATH, JSON.stringify(graphData, null, 2));
  console.log(`\n✅ Successfully wrote ${OUTPUT_PATH}`);
  console.log(
    `   ${SYMBOLS.length} symbols, ${Object.values(graphData).reduce((s, a) => s + a.length, 0)} total data points`,
  );
}

main();
