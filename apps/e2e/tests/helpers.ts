import type { APIRequestContext } from "@playwright/test";

const MAILPIT_URL = "http://localhost:8025";

interface TestUser {
  displayName: string;
  email: string;
  password: string;
}

export async function createVerifiedUser(
  request: APIRequestContext,
  user: TestUser,
): Promise<void> {
  await request.post("/api/users", {
    data: {
      displayName: user.displayName,
      email: user.email,
      password: user.password,
    },
  });

  // Wait briefly for email delivery
  await new Promise((r) => setTimeout(r, 500));

  // Fetch confirmation token from Mailpit
  const messagesRes = await request.get(
    `${MAILPIT_URL}/api/v1/search?query=to:${encodeURIComponent(user.email)}`,
  );
  const messages = await messagesRes.json();
  const messageId = messages.messages[0]?.ID;

  if (!messageId) {
    throw new Error(`No confirmation email found for ${user.email}`);
  }

  const messageRes = await request.get(
    `${MAILPIT_URL}/api/v1/message/${messageId}`,
  );
  const message = await messageRes.json();
  const body: string = message.Text;

  const match = body.match(/token=([a-f0-9]+)&email=([^\s]+)/);
  if (!match) {
    throw new Error("Could not extract token from confirmation email");
  }

  const [, token, encodedEmail] = match;
  const email = decodeURIComponent(encodedEmail);

  await request.post("/api/auth/confirm_email", {
    data: { token, email },
  });

  // Clean up the email from Mailpit
  await request.delete(`${MAILPIT_URL}/api/v1/messages`, {
    data: { IDs: [messageId] },
  });
}
