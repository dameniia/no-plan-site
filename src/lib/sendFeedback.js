// Posts a feedback message to the PHP endpoint. Resolves on success; rejects with an Error
// whose `code` is one of the keys in FEEDBACK_ERRORS so the page can show a human message.

export const FEEDBACK_ENDPOINT = "/api/feedback.php";

export const FEEDBACK_ERRORS = {
  message_too_short: "Add a little more detail, a few words is enough.",
  message_too_long: "That's a lot. Please keep it under 4,000 characters.",
  invalid_email: "That email doesn't look right. You can also leave it empty.",
  rate_limited: "You've sent a few messages already. Please try again in an hour.",
  network: "Couldn't reach the server. Check your connection and try again.",
  send_failed: "Your message didn't go through. Please try again in a moment.",
};

export async function sendFeedback({ category, message, email, website }) {
  let response;
  try {
    response = await fetch(FEEDBACK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, message, email, website }),
    });
  } catch {
    throw Object.assign(new Error("network"), { code: "network" });
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON body (e.g. dev server without PHP): treated as a failed send below.
  }

  if (response.ok && payload?.ok) return;

  const code = payload?.error in FEEDBACK_ERRORS ? payload.error : "send_failed";
  throw Object.assign(new Error(code), { code });
}
