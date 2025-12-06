import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface ScanAnalysis {
  decision: "verified" | "unverified" | "suspicious";
  riskLevel: "low" | "medium" | "high";
  explanation: string;
  educationTip: string;
}

export interface CampaignInfo {
  title?: string;
  description?: string;
  organizerName?: string;
  bankAccount: string;
  isVerified: boolean;
  isActive: boolean;
  campaignType?: string;
}

export async function analyzeQRScan(
  qrPayload: string,
  campaign: CampaignInfo | null,
  amount?: number
): Promise<ScanAnalysis> {
  // If campaign is verified and active, it's safe
  if (campaign?.isVerified && campaign?.isActive) {
    const explanation = await generateExplanation(
      "verified",
      campaign,
      qrPayload
    );
    return {
      decision: "verified",
      riskLevel: "low",
      explanation,
      educationTip:
        "This donation goes to a verified campaign. Always look for the verified badge before donating.",
    };
  }

  // If no campaign found, it's unverified
  if (!campaign) {
    const analysis = await generateUnverifiedAnalysis(qrPayload, amount);
    return analysis;
  }

  // Campaign exists but not active or not verified
  const analysis = await generateSuspiciousAnalysis(campaign, qrPayload);
  return analysis;
}

async function generateExplanation(
  status: string,
  campaign: CampaignInfo,
  qrPayload: string
): Promise<string> {
  const prompt = `You are a banking security assistant. Generate a short, reassuring message (1-2 sentences) for a donor who scanned a QR code for a VERIFIED donation campaign.

Campaign: "${campaign.title || "Donation Campaign"}"
Organizer: ${campaign.organizerName || "Unknown"}
Type: ${campaign.campaignType || "general"}

Keep it friendly and professional. Example: "This is a verified funeral fund for [name]. Your donation will go directly to the family."`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 100,
    });

    return (
      completion.choices[0]?.message?.content ||
      `Verified campaign: ${campaign.title}`
    );
  } catch (error) {
    console.error("Groq API error:", error);
    return `This is a verified ${campaign.campaignType || "donation"} campaign: ${campaign.title}`;
  }
}

async function generateUnverifiedAnalysis(
  qrPayload: string,
  amount?: number
): Promise<ScanAnalysis> {
  const prompt = `You are a banking security assistant helping protect donors from scams. A user scanned a QR code that is NOT linked to any verified donation campaign.

QR Content: "${qrPayload}"
${amount ? `Amount: RM ${amount}` : ""}

Generate a JSON response with:
1. "riskLevel": "medium" or "high" based on the QR content
2. "explanation": A clear, 2-3 sentence warning explaining why this is risky (mention that it's not a verified campaign, could be a scam)
3. "educationTip": A helpful tip about donation scams (e.g., fake QR codes at funerals, always verify with organizers)

Respond ONLY with valid JSON, no markdown.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content || "";
    const parsed = JSON.parse(content);

    return {
      decision: "unverified",
      riskLevel: parsed.riskLevel || "medium",
      explanation:
        parsed.explanation ||
        "This QR code is not linked to any verified donation campaign. Proceed with caution.",
      educationTip:
        parsed.educationTip ||
        "Scammers often create fake QR codes to hijack donations. Always verify with the organizer directly.",
    };
  } catch (error) {
    console.error("Groq API error:", error);
    return {
      decision: "unverified",
      riskLevel: "medium",
      explanation:
        "This QR code is not linked to any verified donation campaign. We cannot confirm where your money will go.",
      educationTip:
        "Tip: Scammers often replace legitimate QR codes with fake ones at public events. Always verify the account with the organizer.",
    };
  }
}

async function generateSuspiciousAnalysis(
  campaign: CampaignInfo,
  qrPayload: string
): Promise<ScanAnalysis> {
  const issues: string[] = [];
  if (!campaign.isVerified) issues.push("not verified");
  if (!campaign.isActive) issues.push("expired or inactive");

  const prompt = `You are a banking security assistant. A user scanned a QR code linked to a campaign with issues: ${issues.join(", ")}.

Campaign: "${campaign.title || "Unknown"}"
Bank Account: ${campaign.bankAccount}

Generate a JSON response with:
1. "riskLevel": "medium" or "high"
2. "explanation": A clear 2-3 sentence warning about why this is suspicious
3. "educationTip": A tip about verifying donation campaigns

Respond ONLY with valid JSON, no markdown.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content || "";
    const parsed = JSON.parse(content);

    return {
      decision: "suspicious",
      riskLevel: parsed.riskLevel || "high",
      explanation:
        parsed.explanation ||
        `This campaign has issues: ${issues.join(", ")}. Please verify before donating.`,
      educationTip:
        parsed.educationTip ||
        "Always check if a campaign is still active and verified before donating.",
    };
  } catch (error) {
    console.error("Groq API error:", error);
    return {
      decision: "suspicious",
      riskLevel: "high",
      explanation: `Warning: This campaign is ${issues.join(" and ")}. Your donation may not reach the intended recipient.`,
      educationTip:
        "Tip: Legitimate campaigns are registered and verified. Contact the organizer directly if unsure.",
    };
  }
}

export { groq };
