/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenAI } from "@google/genai";

// Khởi tạo instance với API Key từ biến môi trường
// GoogleGenAI expects an options object; provide the apiKey field
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { file_data } = body;

    if (!file_data) {
      return new Response(
        JSON.stringify({ error: "Không tìm thấy dữ liệu file trong request" }),
        { status: 400 },
      );
    }

    const prompt = `Bạn là chuyên gia bóc tách hóa đơn. Hãy đọc file PDF đính kèm và trích xuất thông tin.
      Yêu cầu trả về định dạng JSON thuần túy, không có ký hiệu markdown, không giải thích gì thêm:
      {
        "vendor_id": "Mã nhà cung cấp hoặc mã số thuế",
        "ext_inv_no": "Số hóa đơn",
        "total_amount": "Tổng tiền thanh toán (chỉ lấy số, ví dụ: 1500.00)"
      }`;

    // Gọi AI bóc tách nội dung
    const result = await genAI.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: file_data,
                mimeType: "application/pdf",
              },
            },
          ],
        },
      ],
    });

    const aiText = (result.text || "")
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return new Response(aiText, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Lỗi xử lý API:", error);
    // Trả về chi tiết lỗi để hiển thị lên popup SAP giúp dễ debug
    const errorMessage = error.message || "Lỗi không xác định tại Next.js";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
