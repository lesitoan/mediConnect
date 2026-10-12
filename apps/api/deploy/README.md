# Deploy API

Image được build bằng `turbo prune api --docker`, gắn tag Git SHA và push lên GHCR Public.
Image gồm API, Prisma CLI, migration và seed đã compile. Entrypoint chỉ chạy API.
PostgreSQL dùng volume hiện có; Redis dùng Redis Cloud. `.env.example` giữ nguyên.

## CI/CD

- PR vào `main`: build, lint, typecheck và unit test. PR trong repo cũng publish image.
- Merge vào `main`: build/push rồi deploy qua SSH bằng Bash và Docker Compose.
- `workflow_dispatch` trên `main`: nhập `image` có sẵn hoặc để trống để build từ commit được chọn.
- Portainer dùng để xem container/log; cấu hình triển khai do Compose quản lý.

Các bước triển khai nằm trực tiếp trong `.github/workflows/deploy.yml`, không dùng script `.sh` riêng:
cấu hình SSH → tạo env → gửi file → kiểm tra PostgreSQL healthy, đúng project/volume
→ pull image → migrate → cập nhật API và chờ healthy. PostgreSQL không bị tạo lại.
CD không backup database hoặc dọn image cũ; các image đã tải vẫn được giữ trên server.
Seed và Nginx không chạy trong CD. Deploy lỗi sẽ dừng và báo job failed; không tự rollback.

## Secrets và Variables

GitHub Environment `production`:

| Loại | Tên |
| --- | --- |
| Secrets | `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `POSTGRES_PASSWORD`, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `OTP_HMAC_SECRET`, `RESEND_API_KEY`, `ZALO_ACCESS_TOKEN` nếu dùng |
| Variables triển khai | `DEPLOY_PATH`, `COMPOSE_PROJECT_NAME`, `SSH_KNOWN_HOSTS`, `API_PORT` (mặc định `4000`) |
| Variables ứng dụng/DB | `POSTGRES_USER`, `POSTGRES_DB`, `POSTGRES_VOLUME`, `POSTGRES_BIND_ADDRESS`, `POSTGRES_PORT`, `CORS_ORIGINS`, `LOG_LEVEL`, `JWT_ACCESS_TTL_SECONDS`, `JWT_REFRESH_TTL_SECONDS`, `AUTH_COOKIE_SAME_SITE`, `RESEND_FROM_EMAIL`, `ZALO_OTP_TEMPLATE_ID`, `ZALO_OTP_CODE_PARAM` |

Thêm env ứng dụng: thêm Secret/Variable, khai báo trong `env` của bước tạo file env
và thêm tên vào danh sách ghi `.env.api`; không phải liệt kê lại trong Compose.
Biến ứng dụng rỗng được bỏ qua để API dùng giá trị mặc định. Env ứng dụng chỉ nhận giá trị một dòng.
`COMPOSE_PROJECT_NAME` và `POSTGRES_VOLUME` phải khớp database đang chạy.
Container ID được lấy từ service `postgres`/`api` trong Compose.

Server cần Bash, jq, Docker Compose >= 2.30; user SSH có quyền Docker.
Trong `DEPLOY_PATH`: `compose.yml`, `.env` cho nội suy Compose và `.env.api` dùng `format: raw`.
Các file env có quyền `600`; không đưa secrets vào image hay Git.

## Seed chạy tay

Trong thư mục `DEPLOY_PATH` trên server:

```sh
docker compose run --rm seed
```

## Rollback

Trong Actions, chạy lại workflow của commit production đã chạy tốt để deploy image mang Git SHA đó.
Hoặc chạy workflow hiện tại với `image` là tag/digest cũ trên GHCR; cách này giữ script deploy hiện tại.
Image cũ được giữ trên server; nếu không còn ở local thì Docker pull lại từ GHCR.
Migration đã áp dụng không tự lùi; rollback API cần migration tương thích với phiên bản trước đó.
Secrets/Variables lấy giá trị hiện tại tại thời điểm chạy lại.

## Nginx và Cloudflare: cấu hình riêng một lần

Nginx không được sửa hoặc reload khi deploy API. `nginx.conf` là template.
Đặt `API_DOMAIN`, `DEPLOY_PATH`, `API_PORT` từ cấu hình môi trường đã chọn, rồi chạy riêng:

```sh
envsubst '${API_DOMAIN} ${DEPLOY_PATH} ${API_PORT}' < nginx.conf > nginx-rendered.conf
sudo install -m 644 nginx-rendered.conf "/etc/nginx/sites-available/$COMPOSE_PROJECT_NAME"
sudo ln -sfn "/etc/nginx/sites-available/$COMPOSE_PROJECT_NAME" "/etc/nginx/sites-enabled/$COMPOSE_PROJECT_NAME"
sudo nginx -t && sudo systemctl reload nginx
```

Các biến phải được `export` trước khi chạy `envsubst`; lệnh chỉ thay ba biến template và giữ nguyên `$host`, `$scheme` của Nginx.
Cloudflare Origin Certificate/key nằm trong `DEPLOY_PATH/tls/origin.pem` và `origin.key`.
Server hiện tại đã cấu hình Nginx/TLS; không cần chạy lại đoạn trên khi cập nhật API.
Cloudflare: bản ghi A cho domain API tới EC2, bật proxy và SSL/TLS **Full (strict)**.
EC2 mở TCP 80/443; API chỉ bind localhost. Swagger ở `https://<API_DOMAIN>/api/docs`.
Khi đổi `API_PORT`, cập nhật Nginx riêng để khớp port mới.

## Build local

```sh
docker build -f apps/api/Dockerfile -t mediconnect-api:local .
```

Package chung phải khai báo trong dependencies của API và có build output/entrypoint đúng.
Turbo lấy các workspace phụ thuộc và build theo `dependsOn: ["^build"]`.
