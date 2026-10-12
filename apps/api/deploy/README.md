# Deploy API

API được build bằng `turbo prune api --docker`, gắn tag Git SHA và push lên GHCR.
Image gồm Prisma CLI, migration, Prisma Client và seed đã compile. Entrypoint chỉ chạy API.
Database dùng volume PostgreSQL hiện có; Redis dùng Redis Cloud.

## CI/CD

- PR vào `main`: lint, typecheck, unit test, build. PR trong repository cũng push image để kiểm tra đóng gói.
- Merge vào `main`: kiểm tra, build/push rồi deploy production qua SSH và Docker Compose.
- Portainer chỉ dùng để xem container/log. Không cập nhật stack từ editor cũ trong Portainer vì cấu hình triển khai do Compose quản lý.
- `workflow_dispatch` trên `main`: để trống `image` để build; nhập tag/digest GHCR có sẵn để deploy lại, đổi env hoặc rollback.

Luồng deploy: pull image → backup DB → migrate → seed → thay API → chờ healthy → kiểm tra HTTPS → xóa image API cũ.
Migration/seed lỗi thì API cũ tiếp tục chạy. Nếu API mới không healthy, cấu hình và image API cũ được khôi phục.
Migration đã áp dụng không tự lùi; migration cần tương thích với phiên bản API trước đó.
Ba bộ backup gần nhất được giữ trên server. Image cũ trên GHCR được giữ để tải lại khi cần rollback.

## GitHub Environment `production`

Secrets:

`SSH_HOST`, `SSH_USER`, `SSH_KEY`, `POSTGRES_PASSWORD`, `DATABASE_URL`, `REDIS_URL`,
`JWT_SECRET`, `OTP_HMAC_SECRET`, `RESEND_API_KEY`, `ZALO_ACCESS_TOKEN` nếu dùng Zalo.

Variables:

`DEPLOY_PATH`, `COMPOSE_PROJECT_NAME`, `SSH_KNOWN_HOSTS`, `POSTGRES_USER`, `POSTGRES_DB`,
`POSTGRES_VOLUME`, `POSTGRES_BIND_ADDRESS`, `CORS_ORIGINS`, `LOG_LEVEL`,
`JWT_ACCESS_TTL_SECONDS`, `JWT_REFRESH_TTL_SECONDS`, `AUTH_COOKIE_SAME_SITE`,
`RESEND_FROM_EMAIL`, `ZALO_OTP_TEMPLATE_ID`, `ZALO_OTP_CODE_PARAM`.

`COMPOSE_PROJECT_NAME` phải giữ `postgres-stack` trên server hiện tại; `POSTGRES_VOLUME` phải là volume PostgreSQL đang chạy.
GHCR package `mediconnect/api` phải đặt Public để server pull mà không cần registry credential.
Sau lần publish đầu tiên, chọn package → Package settings → Change visibility → Public.

Thêm env: cập nhật validation/config trong API, tạo Secret/Variable và thêm `APP_<TÊN_BIẾN>` trong bước chuẩn bị production.
Không cần thêm từng biến vào Compose. `.env.example` được giữ theo cấu hình hiện tại.

## Server

Thư mục deploy hiện tại là `/opt/mediconnect`:

```text
compose.yml          # cấu hình đang hoạt động
.env                 # biến nội suy Compose, mode 600
.env.api             # env ứng dụng, mode 600; Compose dùng format raw
nginx.conf           # cấu hình Nginx đang hoạt động
origin-ca.pem        # CA công khai để kiểm tra HTTPS tại origin
tls/origin.key       # private key chỉ trên server
tls/origin.pem       # Cloudflare Origin Certificate
incoming/            # file của lượt deploy tiếp theo
backups/             # cấu hình và dump trước deploy
```

Server cần Docker Compose >= 2.30, Python 3, curl, Nginx và user SSH có quyền Docker/sudo.
Lần khởi tạo phải có `compose.yml`, `.env`, `.env.api`, `nginx.conf` khớp deployment đang chạy.
Các lần CD chỉ thay container API; PostgreSQL đang healthy không được tạo lại.
API bind `127.0.0.1:4000`, Nginx nhận cổng 80/443.

## Cloudflare

Domain API: `api.mediconnect.io.vn`.
Origin Certificate được ký từ CSR; private key không rời server.
Tạo bản ghi A cho `api` tới IP EC2, bật proxy, SSL/TLS chọn **Full (strict)**.
EC2 cần cho phép inbound TCP 80/443. Không cần mở cổng API 4000 để truy cập qua domain.
Swagger: `https://api.mediconnect.io.vn/api/docs`.

Kiểm tra origin trước khi DNS trỏ về server:

```sh
curl --cacert /opt/mediconnect/origin-ca.pem \
  --resolve api.mediconnect.io.vn:443:127.0.0.1 \
  https://api.mediconnect.io.vn/api/v1/health-check
```

## Build local

```sh
docker build -f apps/api/Dockerfile -t mediconnect-api:local .
```

Không đưa `.env`, private key hoặc secrets vào build context/image.
Package chung mới phải được khai báo trong dependencies của API và có build output/entrypoint đúng;
Turbo sẽ lấy các workspace phụ thuộc và build theo `dependsOn: ["^build"]`.
