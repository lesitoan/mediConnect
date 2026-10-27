import assert from 'node:assert/strict';
import type { Prisma } from '../src/generated/prisma/client';
import { PermissionEnum } from '../src/modules/authentication/constants/permissions.constant';
import { RoleEnum } from '../src/modules/users/constants/roles.constant';

// SRS sections 1.1.2, 1.3.1 and 2.1; office hours only, without overtime.
// Permissions name capabilities; controllers/services must also enforce ownership and record state.
// Existing disabled/deleted entries and custom grants are preserved when adding missing grants.
export const RBAC_ROLES = {
  [RoleEnum.PATIENT]:
    'Bệnh nhân quản lý hồ sơ và lịch hẹn của mình, thanh toán, xem lịch sử khám và đánh giá dịch vụ.',
  [RoleEnum.DOCTOR]:
    'Bác sĩ xem lịch được phân công, báo nghỉ hoặc vắng, quản lý hàng chờ và ghi nhận khám trong phạm vi phụ trách.',
  [RoleEnum.RECEPTIONIST]:
    'Lễ tân quản lý thông tin tiếp nhận, đặt lịch tại quầy, check-in, điều phối hàng chờ và xác nhận thu tiền.',
  [RoleEnum.ADMIN]:
    'Quản trị viên quản lý tài khoản, phân quyền, danh mục, lịch làm việc, xét duyệt nghỉ và xử lý ngoại lệ, tra cứu nhật ký.',
} satisfies Record<RoleEnum, string>;

const ALL_ROLES = Object.values(RoleEnum);

export const RBAC_PERMISSIONS: Record<
  PermissionEnum,
  { description: string; roles: readonly RoleEnum[] }
> = {
  [PermissionEnum.USERS_READ_ME]: {
    description: 'Xem thông tin tài khoản của chính mình.',
    roles: ALL_ROLES,
  },
  [PermissionEnum.USERS_UPDATE_ME]: {
    description:
      'Cập nhật thông tin cá nhân của chính mình; không thay đổi vai trò hoặc trạng thái tài khoản.',
    roles: ALL_ROLES,
  },
  [PermissionEnum.USERS_READ]: {
    description: 'Tra cứu tài khoản người dùng phục vụ quản trị.',
    roles: [RoleEnum.ADMIN],
  },
  [PermissionEnum.USERS_WRITE]: {
    description:
      'Tạo và sửa thông tin tài khoản nội bộ; không bao gồm gán vai trò hoặc khóa tài khoản.',
    roles: [RoleEnum.ADMIN],
  },
  [PermissionEnum.USERS_LOCK]: {
    description: 'Khóa hoặc mở khóa tài khoản người dùng.',
    roles: [RoleEnum.ADMIN],
  },
  [PermissionEnum.USERS_ASSIGN_ROLE]: {
    description: 'Gán vai trò cho tài khoản theo ma trận quyền của hệ thống.',
    roles: [RoleEnum.ADMIN],
  },
  [PermissionEnum.PATIENTS_READ_ME]: {
    description:
      'Xem hồ sơ thông tin bệnh nhân gắn với tài khoản của chính mình.',
    roles: [RoleEnum.PATIENT],
  },
  [PermissionEnum.PATIENTS_WRITE_ME]: {
    description:
      'Cập nhật thông tin cá nhân và liên hệ trong hồ sơ bệnh nhân của chính mình.',
    roles: [RoleEnum.PATIENT],
  },
  [PermissionEnum.PATIENTS_READ]: {
    description:
      'Tra cứu thông tin định danh và liên hệ bệnh nhân trong phạm vi tiếp nhận hoặc lượt khám phụ trách.',
    roles: [RoleEnum.DOCTOR, RoleEnum.RECEPTIONIST],
  },
  [PermissionEnum.PATIENTS_WRITE]: {
    description:
      'Tạo và cập nhật thông tin hành chính bệnh nhân khi tiếp nhận; không sửa nội dung bệnh án.',
    roles: [RoleEnum.RECEPTIONIST],
  },
  [PermissionEnum.DOCTORS_READ]: {
    description:
      'Tra cứu thông tin bác sĩ được phép hiển thị để đặt lịch, điều phối hoặc chuyển khám.',
    roles: ALL_ROLES,
  },
  [PermissionEnum.DOCTORS_WRITE]: {
    description:
      'Thêm, sửa và vô hiệu hóa bác sĩ sau khi xử lý các lịch hẹn bị ảnh hưởng.',
    roles: [RoleEnum.ADMIN],
  },
  [PermissionEnum.SPECIALTIES_READ]: {
    description: 'Tra cứu chuyên khoa và danh sách bác sĩ được phép hiển thị.',
    roles: ALL_ROLES,
  },
  [PermissionEnum.SPECIALTIES_WRITE]: {
    description:
      'Thêm, sửa và vô hiệu hóa chuyên khoa theo điều kiện còn bác sĩ hoạt động.',
    roles: [RoleEnum.ADMIN],
  },
  [PermissionEnum.SCHEDULES_READ]: {
    description: 'Tra cứu lịch khám đã công bố và các khung giờ còn khả dụng.',
    roles: ALL_ROLES,
  },
  [PermissionEnum.SCHEDULES_READ_ME]: {
    description: 'Xem lịch làm việc được phân công cho chính mình.',
    roles: [RoleEnum.DOCTOR],
  },
  [PermissionEnum.SCHEDULES_WRITE]: {
    description:
      'Tạo, sửa và hủy lịch làm việc bác sĩ trong giờ hành chính, kiểm tra trùng lịch.',
    roles: [RoleEnum.ADMIN],
  },
  [PermissionEnum.SCHEDULES_PUBLISH]: {
    description:
      'Công bố lịch làm việc và sinh khung giờ khám trong giờ hành chính.',
    roles: [RoleEnum.ADMIN],
  },
  [PermissionEnum.LEAVE_REQUESTS_READ_ME]: {
    description: 'Xem các yêu cầu nghỉ phép hoặc báo vắng của chính mình.',
    roles: [RoleEnum.DOCTOR],
  },
  [PermissionEnum.LEAVE_REQUESTS_WRITE_ME]: {
    description:
      'Gửi yêu cầu nghỉ phép hoặc báo vắng đột xuất cho lịch làm việc của chính mình.',
    roles: [RoleEnum.DOCTOR],
  },
  [PermissionEnum.LEAVE_REQUESTS_REVIEW]: {
    description:
      'Xem, phê duyệt hoặc từ chối yêu cầu nghỉ phép và báo vắng, xử lý lịch hẹn bị ảnh hưởng.',
    roles: [RoleEnum.ADMIN],
  },
  [PermissionEnum.APPOINTMENTS_READ_ME]: {
    description: 'Xem lịch hẹn của chính bệnh nhân đang đăng nhập.',
    roles: [RoleEnum.PATIENT],
  },
  [PermissionEnum.APPOINTMENTS_WRITE_ME]: {
    description:
      'Đặt, đổi hoặc hủy lịch hẹn của chính mình theo chính sách thời gian và số lần đổi.',
    roles: [RoleEnum.PATIENT],
  },
  [PermissionEnum.APPOINTMENTS_READ]: {
    description:
      'Xem thông tin hành chính lịch hẹn trong phạm vi công việc được giao; không gồm nội dung bệnh án.',
    roles: [RoleEnum.DOCTOR, RoleEnum.RECEPTIONIST, RoleEnum.ADMIN],
  },
  [PermissionEnum.APPOINTMENTS_CREATE]: {
    description:
      'Đặt lịch tại quầy cho bệnh nhân sau khi xác minh thông tin và khả năng tiếp nhận.',
    roles: [RoleEnum.RECEPTIONIST],
  },
  [PermissionEnum.APPOINTMENTS_RESOLVE]: {
    description:
      'Xử lý lịch hẹn bị ảnh hưởng: đề xuất đổi bác sĩ, đổi thời gian hoặc hủy theo chính sách.',
    roles: [RoleEnum.ADMIN],
  },
  [PermissionEnum.APPOINTMENT_PROPOSALS_RESPOND_ME]: {
    description:
      'Chấp nhận hoặc từ chối phương án đổi bác sĩ hoặc lịch khám cho lịch hẹn của chính mình.',
    roles: [RoleEnum.PATIENT],
  },
  [PermissionEnum.RECEPTION_CHECK_IN]: {
    description:
      'Xác minh và check-in bệnh nhân có lịch hẹn hoặc vãng lai vào lượt khám tương ứng.',
    roles: [RoleEnum.RECEPTIONIST],
  },
  [PermissionEnum.RECEPTION_QUEUES_READ]: {
    description:
      'Xem thông tin hàng chờ thuộc phạm vi tiếp nhận, khám hoặc điều phối; không gồm nội dung bệnh án.',
    roles: [RoleEnum.DOCTOR, RoleEnum.RECEPTIONIST, RoleEnum.ADMIN],
  },
  [PermissionEnum.RECEPTION_QUEUES_WRITE]: {
    description:
      'Cấp số, gọi, bỏ qua hoặc đưa bệnh nhân trở lại hàng chờ được phân quyền.',
    roles: [RoleEnum.DOCTOR, RoleEnum.RECEPTIONIST],
  },
  [PermissionEnum.MEDICAL_RECORDS_READ_ME]: {
    description:
      'Xem tiền sử, dị ứng và hồ sơ khám đã hoàn tất được phép công bố của chính mình.',
    roles: [RoleEnum.PATIENT],
  },
  [PermissionEnum.MEDICAL_RECORDS_WRITE_ME]: {
    description:
      'Khai báo, sửa hoặc xóa tiền sử và dị ứng tự khai của chính mình khi chưa được bác sĩ xác nhận.',
    roles: [RoleEnum.PATIENT],
  },
  [PermissionEnum.MEDICAL_RECORDS_READ]: {
    description:
      'Xem tiền sử, dị ứng và lịch sử khám liên quan của bệnh nhân thuộc phạm vi lượt khám phụ trách.',
    roles: [RoleEnum.DOCTOR],
  },
  [PermissionEnum.MEDICAL_RECORDS_CONFIRM]: {
    description:
      'Xác minh, cập nhật và xác nhận tiền sử, dị ứng trong phiên khám được phụ trách, gắn với bác sĩ và phiên khám.',
    roles: [RoleEnum.DOCTOR],
  },
  [PermissionEnum.CONSULTATIONS_READ]: {
    description:
      'Xem hồ sơ phiên khám trong phạm vi bác sĩ được giao phụ trách.',
    roles: [RoleEnum.DOCTOR],
  },
  [PermissionEnum.CONSULTATIONS_WRITE]: {
    description:
      'Thực hiện phiên khám được giao: ghi lâm sàng, chẩn đoán, đơn thuốc, cận lâm sàng, tạm dừng, tiếp tục và chốt hồ sơ chưa khóa.',
    roles: [RoleEnum.DOCTOR],
  },
  [PermissionEnum.CONSULTATIONS_ADDEND]: {
    description:
      'Bổ sung hoặc đính chính hồ sơ đã khóa trong phạm vi trách nhiệm, có lý do và giữ nguyên nội dung gốc.',
    roles: [RoleEnum.DOCTOR],
  },
  [PermissionEnum.REFERRALS_WRITE]: {
    description:
      'Tạo hoặc hủy yêu cầu chuyển chuyên khoa từ phiên khám phụ trách theo trạng thái cho phép.',
    roles: [RoleEnum.DOCTOR],
  },
  [PermissionEnum.REFERRALS_SCHEDULE]: {
    description:
      'Bố trí lượt khám đích cho yêu cầu chuyển chuyên khoa đã được bác sĩ chỉ định.',
    roles: [RoleEnum.DOCTOR, RoleEnum.RECEPTIONIST],
  },
  [PermissionEnum.CARE_SESSIONS_RESOLVE]: {
    description:
      'Điều phối lượt khám tạm dừng hoặc chờ quá hạn; không thay bác sĩ sửa hoặc chốt nội dung chuyên môn.',
    roles: [RoleEnum.ADMIN],
  },
  [PermissionEnum.INVOICES_READ_ME]: {
    description:
      'Xem hóa đơn và tình trạng thanh toán của chính bệnh nhân đang đăng nhập.',
    roles: [RoleEnum.PATIENT],
  },
  [PermissionEnum.INVOICES_READ]: {
    description:
      'Tra cứu hóa đơn phục vụ thu tiền tại quầy hoặc xử lý hoàn tiền trong phạm vi được giao.',
    roles: [RoleEnum.RECEPTIONIST, RoleEnum.ADMIN],
  },
  [PermissionEnum.PAYMENTS_CREATE_ME]: {
    description:
      'Khởi tạo thanh toán SePay QR cho hóa đơn của chính mình; không tự xác nhận đã thu tiền.',
    roles: [RoleEnum.PATIENT],
  },
  [PermissionEnum.PAYMENTS_CONFIRM]: {
    description:
      'Xác nhận khoản tiền thực tế đã thu tại quầy, lưu người thu và thời điểm.',
    roles: [RoleEnum.RECEPTIONIST],
  },
  [PermissionEnum.REFUNDS_REQUEST]: {
    description:
      'Tạo yêu cầu hoàn tiền theo chính sách khi xử lý lịch hẹn bị ảnh hưởng.',
    roles: [RoleEnum.ADMIN],
  },
  [PermissionEnum.REVIEWS_CREATE_ME]: {
    description:
      'Đánh giá bác sĩ và dịch vụ một lần cho phiên khám đã hoàn thành của chính mình.',
    roles: [RoleEnum.PATIENT],
  },
  [PermissionEnum.AI_ASSISTANT_USE]: {
    description:
      'Dùng AI tra cứu và hỗ trợ đặt, đổi, hủy lịch trong phạm vi của chính mình, xác nhận trước khi thay đổi dữ liệu.',
    roles: [RoleEnum.PATIENT],
  },
  [PermissionEnum.AI_CONVERSATION_LOGS_READ]: {
    description:
      'Tra cứu nhật ký hội thoại AI phục vụ quản trị và truy vết theo chính sách lưu trữ.',
    roles: [RoleEnum.ADMIN],
  },
  [PermissionEnum.NOTIFICATIONS_READ_ME]: {
    description: 'Xem thông báo được gửi đến chính mình.',
    roles: ALL_ROLES,
  },
  [PermissionEnum.NOTIFICATIONS_MARK_READ_ME]: {
    description:
      'Đánh dấu đã đọc thông báo của chính mình; không sửa nội dung hoặc người nhận.',
    roles: ALL_ROLES,
  },
  [PermissionEnum.AUDIT_LOGS_READ]: {
    description:
      'Tra cứu và lọc nhật ký nghiệp vụ bất biến theo quyền truy cập.',
    roles: [RoleEnum.ADMIN],
  },
  [PermissionEnum.AUDIT_LOGS_EXPORT]: {
    description:
      'Xuất nhật ký nghiệp vụ trong phạm vi được phép; không sửa hoặc xóa nhật ký.',
    roles: [RoleEnum.ADMIN],
  },
};

export async function seedRbac(
  transaction: Prisma.TransactionClient,
): Promise<void> {
  const roleIds = new Map<RoleEnum, string>();
  for (const name of ALL_ROLES) {
    const role = await transaction.role.upsert({
      where: { name },
      create: { name, description: RBAC_ROLES[name] },
      update: { description: RBAC_ROLES[name] },
    });
    roleIds.set(name, role.id);
  }

  for (const name of Object.values(PermissionEnum)) {
    const { description, roles } = RBAC_PERMISSIONS[name];
    assert.ok(description.trim(), `Missing description for ${name}`);
    assert.ok(roles.length > 0, `No role assigned to ${name}`);
    assert.equal(
      new Set(roles).size,
      roles.length,
      `Duplicate role for ${name}`,
    );
    const permission = await transaction.permission.upsert({
      where: { name },
      create: { name, description },
      update: { description },
    });
    for (const roleName of roles) {
      const roleId = roleIds.get(roleName);
      assert.ok(roleId, `Unknown role ${roleName}`);
      await transaction.infoPermission.upsert({
        where: {
          role_id_permission_id: {
            role_id: roleId,
            permission_id: permission.id,
          },
        },
        create: {
          role_id: roleId,
          permission_id: permission.id,
          description,
        },
        update: {},
      });
    }
  }
}
