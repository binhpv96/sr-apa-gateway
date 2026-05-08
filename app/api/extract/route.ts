import { NextResponse } from "next/server";

// 1. Chuẩn bị sẵn một từ điển Mock Data ánh xạ theo tên file
const mockDatabase: Record<string, any> = {
  "HoaDon_Samsung.pdf": {
    vendor_id: "V_SAMSUNG",
    ext_inv_no: "SS-2026-001",
    total_amount: "5400.00",
  },
  "Apple_Invoice.pdf": {
    vendor_id: "V_APPLE",
    ext_inv_no: "APL-MAC-99",
    total_amount: "9999.99",
  },
  "Grab_Receipt.pdf": {
    vendor_id: "V_GRAB_VN",
    ext_inv_no: "GRB-RIDE-01",
    total_amount: "15.50",
  },
  // Data mặc định nếu người dùng upload một file không có trong danh sách trên
  default: {
    vendor_id: "V_UNKNOWN",
    ext_inv_no: "INV-DEMO-000",
    total_amount: "100.00",
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const uploadedFilename = body.filename;

    console.log("Đã nhận file từ SAP:", uploadedFilename);

    // 2. Giả lập delay 2 giây cho giống AI đang "suy nghĩ"
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 3. Tìm data tương ứng với tên file. Nếu không có, dùng default.
    // Lưu ý: Dùng fallback an toàn đề phòng body gửi lên không có filename
    const responseData =
      mockDatabase[uploadedFilename] || mockDatabase["default"];

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Lỗi Gateway:", error);
    return NextResponse.json({ error: "Lỗi Gateway" }, { status: 500 });
  }
}
