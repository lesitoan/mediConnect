import InformationPage from "@/components/shared/InformationPage";

export default function PrivacyPage() {
  return <InformationPage title="Chính sách bảo mật" description="MediConnect bảo vệ dữ liệu tài khoản và thông tin y tế theo phạm vi cần thiết để cung cấp dịch vụ." sections={[{ title: "Dữ liệu được sử dụng", body: "Thông tin được dùng để xác thực tài khoản, quản lý lịch khám, hỗ trợ chăm sóc và vận hành hệ thống." }, { title: "Quyền của người bệnh", body: "Bạn có thể kiểm tra và yêu cầu cập nhật thông tin cá nhân trong hồ sơ bệnh nhân." }]} />;
}
