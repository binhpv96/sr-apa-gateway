/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import * as GoogleAI from "@google/genai";

export const runtime = "nodejs";

// Định nghĩa Interface để xử lý kết quả
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

    // GIẢI PHÁP VƯỢT RÀO: Ép kiểu 'any' ngay tại đây để tránh lỗi ts(2339)
    // Dù thư viện dùng tên GoogleGenAI hay GoogleGenerativeAI, cách này đều chạy được
    const GoogleAIClass =
      (GoogleAI as any).GoogleGenAI || (GoogleAI as any).GoogleGenerativeAI;

    if (!GoogleAIClass) {
      throw new Error("Không thể tìm thấy Class khởi tạo của Google SDK");
    }

    const genAI = new GoogleAIClass(apiKey);

    // Gọi phương thức getGenerativeModel qua ép kiểu any để TS không kiểm tra thuộc tính
    const model = (genAI as any).getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const base64Pdf = file_data.replace(/^data:application\/pdf;base64,/, "");

    // Thực hiện gọi Content
    const result = await model.generateContent([
      "Ban la tro ly ke toan. Hay trich xuat thong tin tu PDF hoa don va tra ve JSON: vendor_id, ext_inv_no, total_amount.",
      {
        inlineData: {
          data: base64Pdf,
          mimeType: "application/pdf",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    const cleanJson = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      const jsonParsed = JSON.parse(cleanJson) as AIResult;
      return NextResponse.json(jsonParsed, { status: 200 });
    } catch (parseError) {
      return NextResponse.json(
        { error: "AI tra ve sai dinh dang JSON", detail: cleanJson },
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
