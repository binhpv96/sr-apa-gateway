/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenAI } from "@google/genai";

// Khởi tạo Gemini với API Key của bạn (Nên để trong file .env khi đẩy lên Vercel)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: { json: () => any }) {
  try {
    // 1. Nhận dữ liệu từ SAP gửi lên
    const body = await req.json();
    const { filename, file_data } = body;

    if (!file_data) {
      return new Response(JSON.stringify({ error: "Không có dữ liệu file" }), {
        status: 400,
      });
    }

    // 2. Chuẩn bị prompt yêu cầu AI bóc tách
    const prompt = `
      Bạn là một trợ lý kế toán chuyên nghiệp. Hãy đọc hóa đơn PDF đính kèm và trích xuất các thông tin sau:
      1. vendor_id: Mã nhà cung cấp (Nếu không rõ, hãy tự tạo một mã bắt đầu bằng V_, ví dụ: V_SAMSUNG).
      2. ext_inv_no: Số hóa đơn (Invoice Number).
      3. total_amount: Tổng số tiền (Chỉ lấy con số, không lấy chữ, ví dụ: 2500.00).
      
      TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON SAU, KHÔNG THÊM BẤT KỲ CHỮ NÀO KHÁC:
      {
        "vendor_id": "...",
        "ext_inv_no": "...",
        "total_amount": "..."
      }
    `;

    // 3. Gọi Gemini API (Gửi kèm prompt và file PDF dưới dạng Base64)
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        prompt,
        {
          inlineData: {
            data: file_data,
            mimeType: "application/pdf",
          },
        },
      ],
    });

    // 4. Xử lý kết quả trả về (Lọc bỏ các ký tự thừa nếu AI trả về markdown ```json)
    let aiText = response.text || "";
    aiText = aiText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const jsonResult = JSON.parse(aiText);

    // 5. Trả về cho hệ thống SAP
    return new Response(JSON.stringify(jsonResult), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Lỗi AI Extract:", error);

    // ÉP NEXT.JS TRẢ VỀ LỖI THẬT CỦA HỆ THỐNG THAY VÌ CÂU CHUNG CHUNG
    const realErrorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Lỗi không xác định";

    return new Response(JSON.stringify({ error: realErrorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
