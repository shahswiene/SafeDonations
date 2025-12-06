import QRCode from "qrcode";

export interface QRPayload {
  type: "safe-donation";
  campaignId: string;
  bankAccount: string;
  version: number;
}

// Generate QR code data URL for a campaign
export async function generateCampaignQR(
  campaignId: string,
  bankAccount: string
): Promise<string> {
  const payload: QRPayload = {
    type: "safe-donation",
    campaignId,
    bankAccount,
    version: 1,
  };

  const qrDataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });

  return qrDataUrl;
}

// Parse QR payload from scanned content
export function parseQRPayload(content: string): QRPayload | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed.type === "safe-donation" && parsed.campaignId) {
      return parsed as QRPayload;
    }
    return null;
  } catch {
    return null;
  }
}

// Extract bank account from raw QR (for non-SafeDonation QRs)
export function extractBankAccount(content: string): string | null {
  // Try to extract Malaysian bank account patterns
  // Common formats: account numbers are 10-16 digits
  const accountMatch = content.match(/\b\d{10,16}\b/);
  if (accountMatch) {
    return accountMatch[0];
  }

  // Check for DuitNow format
  if (content.includes("duitnow") || content.includes("DUITNOW")) {
    const duitnowMatch = content.match(/\d{10,16}/);
    if (duitnowMatch) {
      return duitnowMatch[0];
    }
  }

  return null;
}
