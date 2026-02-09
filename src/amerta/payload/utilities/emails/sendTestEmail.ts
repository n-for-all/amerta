import { PayloadRequest } from "payload";

export const sendTestEmail = async (req: PayloadRequest) => {
  try {
    // 1. Get the email address to test
    const body = req.json ? await req.json() : req.body; // Handle Payload v2 vs v3 parsing
    const { testEmail } = body;

    if (!testEmail) {
      return Response.json({ message: "Missing 'testEmail' field" }, { status: 400 });
    }

    // 2. Send using Payload's native email function
    // This automatically triggers your custom 'dynamicTransport.send' logic
    await req.payload.sendEmail({
      to: testEmail,
      subject: "Test Email from Payload",
      html: `
            <h2>Test Email Success</h2>
            <p>If you see this, your email sending is working!</p>
          `,
    });

    return Response.json({ message: "Test email sent successfully" }, { status: 200 });
  } catch (error) {
    console.error("Test Email Error:", error);
    return Response.json(
      {
        message: "Failed to send email. Check server logs.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
};
