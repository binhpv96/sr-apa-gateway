import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export const runtime = "nodejs";

interface AIResult {
  vendor_id: string;
  ext_inv_no: string;
  total_amount: string;
}

interface RequestBody {
  file_data?: string;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY in .env.local" },
        { status: 500 },
      );
    }

    const body = (await req.json()) as RequestBody;
    const { file_data } = body;

    if (!file_data) {
      return NextResponse.json(
        { error: "Khong tim thay du lieu file" },
        { status: 400 },
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const base64Pdf = file_data.replace(/^data:application\/pdf;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "Ban la tro ly ke toan. Hay trich xuat thong tin tu PDF hoa don " +
                "va chi tra ve JSON dung schema, khong kem markdown hay giai thich.",
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
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vendor_id: { type: Type.STRING },
            ext_inv_no: { type: Type.STRING },
            total_amount: { type: Type.STRING },
          },
          required: ["vendor_id", "ext_inv_no", "total_amount"],
          propertyOrdering: ["vendor_id", "ext_inv_no", "total_amount"],
        },
      },
    });

    let text = response.text ?? "";

    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      const jsonParsed = JSON.parse(text) as AIResult;
      return NextResponse.json(jsonParsed, { status: 200 });
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      return NextResponse.json(
        { error: "AI tra ve sai dinh dang JSON", detail: text },
        { status: 500 },
      );
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("API Route Error:", errorMessage);

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
