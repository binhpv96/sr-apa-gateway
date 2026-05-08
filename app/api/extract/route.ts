import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

interface AIResult {
  vendor_id: string;
  ext_inv_no: string;
  total_amount: string;
}

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
    const { file_data } = body;

    if (!file_data) {
      return NextResponse.json(
        { error: "Khong tim thay du lieu file" },
        { status: 400 },
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const base64Pdf = file_data.replace(/^data:application\/pdf;base64,/, "");

    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Ban la tro ly ke toan. Hay trich xuat thong tin tu PDF hoa don va tra ve JSON: vendor_id, ext_inv_no, total_amount.",
            },
            {
              inlineData: {
                data: base64Pdf,
                mimeType: "application/pdf",
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

    try {
      const jsonParsed = JSON.parse(cleanJson) as AIResult;

      return NextResponse.json(jsonParsed, {
        status: 200,
      });
    } catch {
      return NextResponse.json(
        {
          error: "AI tra ve sai dinh dang JSON",
          detail: cleanJson,
        },
        { status: 500 },
      );
    }
  } catch (error: unknown) {
    console.error(error);

    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
