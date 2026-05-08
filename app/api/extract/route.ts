/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 },
      );
    }

    const body = await req.json();

    const { file_data, filename } = body;

    if (!file_data) {
      return NextResponse.json({ error: "Missing file_data" }, { status: 400 });
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Extract invoice information from this PDF and return ONLY valid JSON with fields: vendor_id, ext_inv_no, total_amount",
            },
            {
              inlineData: {
                mimeType: "application/pdf",
                data: file_data,
              },
            },
          ],
        },
      ],
    });

    const text = result.text || "";

    const cleanJson = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return NextResponse.json(JSON.parse(cleanJson));
  } catch (error: any) {
    console.error("FULL ERROR:", error);

    return NextResponse.json(
      {
        error: error.message || "Internal error",
        detail: JSON.stringify(error),
      },
      { status: 500 },
    );
  }
}
