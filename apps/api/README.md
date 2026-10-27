# MediConnect API

REST API dạng modular monolith bằng NestJS cho MediConnect. Các module hiện có phục vụ xác thực, tài khoản, gửi OTP và kiểm tra kết nối cơ sở dữ liệu.

## Cấu trúc thư mục

Cách chia thư mục theo `tripBackend`, dùng lại cấu hình và các service hiện có của MediConnect:

```text
apps/api/
├── prisma/                         # Một schema, lịch sử migration và seed
├── src/
│   ├── common/                     # Bộ tiện ích dùng chung kế thừa từ tripBackend
│   │   ├── constants/
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── enums/
│   │   ├── exceptions/
│   │   ├── filters/
│   │   ├── interfaces/
│   │   └── utils/
│   ├── configs/                    # Env validation, HTTP, JWT, logger, OTP, database, Redis
│   ├── generated/prisma/           # Prisma Client tự sinh; không sửa trực tiếp
│   ├── modules/
│   │   ├── authentication/
│   │   │   ├── constants/
│   │   │   ├── decorators/
│   │   │   ├── dto/
│   │   │   │   ├── requests/       # Đầu vào và quy tắc validation
│   │   │   │   └── responses/      # Dữ liệu trả về
│   │   │   ├── guards/
│   │   │   ├── services/           # Xác thực, cookie/token, OTP và OTP store
│   │   │   ├── authentication.controller.ts
│   │   │   └── authentication.module.ts
│   │   ├── database/
│   │   │   ├── services/prisma.service.ts
│   │   │   └── database.module.ts
│   │   ├── health-check/           # Controller, module và services/
│   │   ├── notifications/          # Module và services/ gửi OTP qua email/Zalo
│   │   ├── redis/                  # Module và services/ quản lý kết nối Redis
│   │   └── users/
│   │       ├── constants/
│   │       ├── dto/responses/
│   │       ├── services/           # Tài khoản và phiên đăng nhập
│   │       ├── users.controller.ts
│   │       ├── users.repository.ts
│   │       └── users.module.ts
│   ├── swagger/
│   ├── app.module.ts
│   └── main.ts
├── test/                           # HTTP, migration, RBAC và Redis integration tests
├── docs/                           # Tài liệu xác thực và phân quyền
├── scripts/                        # Công cụ chạy kiểm thử
└── deploy/                         # Docker entrypoint, Compose và Nginx
```

- Tên file/thư mục dùng kebab-case; module nghiệp vụ dùng danh từ số nhiều theo quy ước MediConnect. Giữ tên `authentication` và `health-check` đang dùng.
- Controller xử lý HTTP và validation. Service chứa nghiệp vụ; repository chứa truy cập dữ liệu của module. Dùng lại `DatabaseModule` để nhận `PrismaService`, không tạo Prisma Client mới trong từng module.
- Module khác sử dụng service được module sở hữu export. Không truy cập repository nội bộ của module khác.
- `configs/configure-app.ts` cấu hình prefix, CORS, cookie, validation và filter lỗi dùng chung cho ứng dụng và HTTP tests.
- Chỉ tạo module khi triển khai nghiệp vụ. Khi cần nhiều audience, đặt controller/DTO `patient`, `staff`, `admin` bên trong module sở hữu nghiệp vụ.
- Giữ cách gọi service/repository đang có; không thêm CQRS hoặc các module tour, sản phẩm, giỏ hàng từ dự án tham chiếu.

## Chạy local

Thực hiện từ thư mục `mediConnect`. Cài dependency bằng `npm ci`. Nếu chưa có cấu hình local, sao chép `apps/api/.env.example` thành `apps/api/.env` và điền:

- `DATABASE_URL`: PostgreSQL cho MediConnect.
- `REDIS_URL`: Redis cho OTP và giới hạn yêu cầu.
- `JWT_SECRET`, `OTP_HMAC_SECRET`: hai secret khác nhau, mỗi secret tối thiểu 32 ký tự.
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`: gửi OTP qua email. Điền thông tin Zalo khi bật đăng ký bằng SĐT.

```sh
npm run prisma:generate --workspace api
npm run prisma:migrate --workspace api
npm run prisma:seed --workspace api
npm run dev:api
```

`prisma:migrate` áp dụng migration vào database đã cấu hình; kiểm tra đúng database trước khi chạy. Seed mặc định bổ sung role/permission còn thiếu, không tạo người dùng hoặc mật khẩu. `npm run prisma:seed:clinic --workspace api` tạo dữ liệu phòng khám giả lập cho đồ án. Tạo thêm 2 admin và 2 lễ tân bằng `npm run prisma:seed:staff --workspace api`. Các tài khoản demo mới đã xác minh email, có trạng thái ACTIVE và mật khẩu `123456`. Xem [danh sách tài khoản và cách chạy seed](../../docs/clinic-seed-and-staff-activation.md).

Cổng mặc định: `4000`. Base path: `/api/v1`. Swagger: `http://localhost:4000/api/docs`. Health check: `GET /api/v1/health-check`. Thông tin người dùng hiện tại: `GET /api/v1/me`.

## Kiểm tra và build

```sh
npm run check-types --workspace api
npm run lint --workspace api
npm run test --workspace api -- --runInBand
npm run test:e2e --workspace api -- --runInBand
npm run build --workspace api
```

HTTP tests dùng JWT/bcrypt thật và mock PostgreSQL/OTP; migration tests chạy PostgreSQL trong bộ nhớ bằng PGlite. Chúng không ghi vào database của ứng dụng. Test Redis thật chỉ chạy khi có `REDIS_TEST_URL` riêng; xem [hướng dẫn kiểm thử Redis](docs/authentication.md#chạy-và-kiểm-thử).

Build tạo `dist/` cho API và `dist-seed/` cho seed. Chạy production bằng `npm run start:prod --workspace api`; cấu hình container nằm trong `Dockerfile` và `deploy/`.

## Tài liệu

- [Luồng hoạt động, luồng dữ liệu và nơi lưu token — đọc từ đầu](docs/authentication-data-flow.md)
- [Common kế thừa từ tripBackend và cách sử dụng](docs/common.md)
- [Xác thực, Redis OTP, refresh token và phiên đăng nhập](docs/authentication.md)
- [Phân quyền và cách áp dụng từ TripByToanNgo](docs/rbac.md)
- [API contracts của MediConnect](../../docs/api-contracts/README.md)
