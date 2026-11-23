import InformationPage from "@/components/shared/InformationPage";

export default function GuidePage() {
  return <InformationPage title="Hướng dẫn sử dụng cổng bệnh nhân" description="Các bước cơ bản để tra cứu thông tin, đặt lịch và theo dõi lịch khám." sections={[{ title: "Đặt lịch khám", body: "Chọn chuyên khoa, bác sĩ, ngày và khung giờ phù hợp. Sau khi đăng nhập, kiểm tra thông tin cá nhân rồi xác nhận đặt lịch." }, { title: "Theo dõi lịch hẹn", body: "Mở mục Lịch sử & Lịch hẹn để xem trạng thái, đổi lịch hoặc hủy lịch theo điều kiện của hệ thống." }]} />;
}
