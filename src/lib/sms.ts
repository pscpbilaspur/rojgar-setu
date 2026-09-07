import "server-only";

// Pluggable SMS gateway (Section 11 of the master build prompt: "a real
// SMS/OTP gateway, e.g. an Indian provider with DLT registration for
// transactional SMS — required for OTP delivery in India").
//
// No SMS provider account/credentials exist yet, so this ships a dev-mode
// implementation that logs the OTP to the server console instead of
// silently pretending to send it. This is a real, visible gap — not a
// disguised fake success — so it's obvious in every log line that no SMS
// actually went out. Swap sendSms's body for a real provider call (MSG91,
// Twilio, etc.) once SMS_PROVIDER + SMS_API_KEY are set in .env, and delete
// the dev branch below.

export interface SendSmsResult {
  ok: boolean;
  provider: "dev-console" | string;
}

export async function sendSms(
  mobile: string,
  message: string
): Promise<SendSmsResult> {
  const provider = process.env.SMS_PROVIDER;
  const apiKey = process.env.SMS_API_KEY;

  if (!provider || !apiKey) {
    console.log(
      `\n[DEV SMS — no real gateway configured] To: ${mobile}\n  "${message}"\n`
    );
    return { ok: true, provider: "dev-console" };
  }

  // TODO: real provider integration goes here once SMS_PROVIDER/SMS_API_KEY
  // are set. Throwing here instead of silently no-op-ing so this is caught
  // immediately in testing, not discovered in production.
  throw new Error(
    `SMS_PROVIDER="${provider}" is configured but no integration has been written for it yet in src/lib/sms.ts.`
  );
}
