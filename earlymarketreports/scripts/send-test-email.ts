/**
 * B) Envío test real con SendGrid
 * Lee TEST_EMAIL, envía sample A, loguea messageId y errores completos (status + body).
 *
 * Requiere en .env.local (o env): SENDGRID_API_KEY, EMAIL_FROM, TEST_EMAIL
 *
 * Run: pnpm email:send-test
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Cargar env ANTES de importar sendgrid (sendgrid lee SENDGRID_API_KEY al cargar el módulo)
const cwd = process.cwd();
dotenv.config({ path: path.join(cwd, ".env.local") });
dotenv.config({ path: path.join(cwd, ".env") });

const TEST_EMAIL = process.env.TEST_EMAIL?.trim();
const FROM =
  process.env.EMAIL_FROM || "EarlyMarketReports <no-reply@earlymarketreports.com>";

async function main() {
  if (!TEST_EMAIL) {
    console.error("Missing TEST_EMAIL. Set it in .env.local or environment.");
    process.exit(1);
  }

  const { sendEmail } = await import("../src/email/sendgrid");
  const { sampleVerification } = await import("../src/email/email.samples");

  console.log("Sending test email (sample A) to:", TEST_EMAIL);

  const result = await sendEmail({
    to: TEST_EMAIL,
    templateData: sampleVerification,
    from: FROM,
    categories: ["test", "verification"],
    unsubscribeUrl: sampleVerification.unsubscribe_url,
  });

  if (result.success) {
    console.log("OK – Email sent successfully.");
    console.log("messageId:", result.messageId ?? "(none)");
    console.log("statusCode:", result.statusCode ?? "(none)");
    return;
  }

  console.error("FAIL – SendGrid error (full detail):");
  console.error(JSON.stringify(
    {
      error: result.error,
      statusCode: result.statusCode,
      responseBody: result.responseBody,
    },
    null,
    2
  ));
  process.exit(1);
}

main();
