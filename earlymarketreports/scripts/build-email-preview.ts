/**
 * A) Preview local
 * Generates:
 *   ./tmp/email_preview.compiled.html
 *   ./tmp/email_preview.txt
 *
 * Run: pnpm email:preview
 */

import * as fs from "fs";
import * as path from "path";
import { renderEmail } from "../src/email/renderEmail";
import { sampleVerification } from "../src/email/email.samples";

const TMP_DIR = path.resolve(process.cwd(), "tmp");
const HTML_FILE = "email_preview.compiled.html";
const TXT_FILE = "email_preview.txt";

function main() {
  const { subject, html, text } = renderEmail(sampleVerification, {
    inlineCss: true,
  });

  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }

  const htmlPath = path.join(TMP_DIR, HTML_FILE);
  const txtPath = path.join(TMP_DIR, TXT_FILE);

  fs.writeFileSync(htmlPath, html, "utf-8");
  fs.writeFileSync(txtPath, text, "utf-8");

  console.log("Subject:", subject);
  console.log("Written: ./tmp/" + HTML_FILE);
  console.log("Written: ./tmp/" + TXT_FILE);
}

main();
