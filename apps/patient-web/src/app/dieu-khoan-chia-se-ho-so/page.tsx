import InformationPage from "@/components/shared/InformationPage";

export default function MedicalRecordSharingTermsPage() {
  return <InformationPage title="Điều khoản chia sẻ hồ sơ" description="Thông tin về phạm vi sử dụng hồ sơ y tế trong quá trình chăm sóc." sections={[{ title: "Phạm vi chia sẻ", body: "Hồ sơ chỉ được cung cấp cho nhân sự có thẩm quyền và các quy trình chăm sóc liên quan đến lịch khám của bạn." }, { title: "Kiểm soát truy cập", body: "Hệ thống ghi nhận quyền truy cập và giới hạn dữ liệu theo vai trò nghiệp vụ." }]} />;
}
