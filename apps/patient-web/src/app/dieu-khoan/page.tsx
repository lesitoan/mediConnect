import InformationPage from "@/components/shared/InformationPage";

export default function TermsPage() {
  return <InformationPage title="Điều khoản sử dụng" description="Các nguyên tắc sử dụng cổng bệnh nhân MediConnect." sections={[{ title: "Sử dụng tài khoản", body: "Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và cung cấp thông tin chính xác khi sử dụng dịch vụ." }, { title: "Đặt lịch và hủy lịch", body: "Lịch hẹn chỉ được xác nhận khi hệ thống ghi nhận thành công. Các thay đổi phụ thuộc vào tình trạng khung giờ và chính sách của cơ sở khám." }]} />;
}
