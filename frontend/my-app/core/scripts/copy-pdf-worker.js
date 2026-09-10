const fs = require("fs");
const path = require("path");

const source = path.resolve(
  __dirname,
  "../node_modules/pdfjs-dist/build/pdf.worker.min.mjs"
);

const destination = path.resolve(
  __dirname,
  "../public/pdf.worker.min.mjs"
);

fs.copyFileSync(source, destination);

console.log(`Copied PDF.js worker to ${destination}`);
