import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "API extract is running",
  });
}

export async function POST(req: NextRequest) {
  try {
    console.log("POST /api/extract HIT");

    const rawBody = await req.text();

    console.log("RAW BODY LENGTH:", rawBody.length);
    console.log("RAW BODY START:", rawBody.substring(0, 300));

    const body = JSON.parse(rawBody);

    const { file_data, filename } = body;

    if (!file_data) {
      return NextResponse.json(
        {
          error: "Missing file_data",
        },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Missing GEMINI_API_KEY",
        },
        { status: 500 },
      );
    }

    const pureBase64 = file_data.replace(/^data:application\/pdf;base64,/, "");

    console.log("FILENAME:", filename);
    console.log("BASE64 LENGTH:", pureBase64.length);
    console.log("BASE64 START:", pureBase64.substring(0, 20));

    const ai = new GoogleGenAI({
      apiKey,
    });

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Extract invoice information from this PDF. Return ONLY valid JSON with fields: vendor_id, ext_inv_no, total_amount",
            },
            {
              inlineData: {
                mimeType: "application/pdf",
                data: pureBase64,
              },
            },
          ],
        },
      ],
    });

    console.log("FULL GEMINI RESPONSE:", JSON.stringify(response));

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log("AI TEXT:", text);

    const cleanJson = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanJson);

    return NextResponse.json(parsed);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("FULL ERROR:", error);

    return NextResponse.json(
      {
        error: error?.message || "Internal error",
        detail: JSON.stringify(error),
        stack: error?.stack,
      },
      { status: 500 },
    );
  }
}
