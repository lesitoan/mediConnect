# Xác thực và khôi phục mật khẩu bằng Redis OTP

Luồng đã chốt: **email/SĐT → xác minh OTP → nhập mật khẩu mới**. Người dùng chỉ nhập OTP và mật khẩu; frontend tự giữ và gửi `resetToken` giữa hai bước cuối. Token này chỉ cấp quyền đổi mật khẩu cho một tài khoản, có hạn 10 phút và dùng một lần; không phải access token.

## API

Các endpoint đều có prefix `/api/v1/authentication`, trả kết quả trong `{ success, data }`:

| Endpoint | Body | Kết quả |
|---|---|---|
| `POST /register` | `name`, `password`, một trong `email`/`phone` | Tạo PATIENT ở trạng thái PENDING_VERIFICATION, gửi OTP, trả challengeId |
| `POST /send_otp` | một trong `email`/`phone`, `purpose: REGISTER hoặc RESET_PASSWORD` | Yêu cầu gửi/gửi lại OTP |
| `POST /forgot_password` | một trong `email`/`phone` | Gửi OTP RESET_PASSWORD, trả challengeId |
| `POST /verify` | `challengeId`, `otp` | REGISTER: kích hoạt tài khoản; RESET_PASSWORD: trả resetToken và expiresIn |
| `POST /reset_password` | `resetToken`, `password` mới | Tiêu thụ quyền reset, đổi mật khẩu, thu hồi phiên, yêu cầu đăng nhập lại |
| `POST /login` | `password`, một trong `email`/`phone`, tùy chọn `clientType`, `deviceName` | Tạo AuthSession và trả token theo WEB/MOBILE |
| `POST /refresh` | WEB: `{}` và cookie; MOBILE: `refreshToken` | Cấp token mới, thay hash refresh token trong cùng phiên |
| `POST /logout` | Access token hoặc cookie; không cần body | Thu hồi phiên hiện tại, xóa cookie |
| `POST /logout_all` | Access token hoặc cookie; không cần body | Thu hồi tất cả phiên của tài khoản |
| `GET /sessions` | Access token hoặc cookie | Danh sách phiên còn hiệu lực của tài khoản |
| `DELETE /sessions/:sessionId` | Access token hoặc cookie | Thu hồi một phiên thuộc tài khoản |

`/forgot_password` không nhận mật khẩu mới. `/verify` không nhận purpose do client lựa chọn: purpose lấy từ trạng thái đã lưu trên server. `/reset_password` không nhận OTP hoặc `tokenString`; trường đúng là `resetToken` do `/verify` trả về. Frontend cần giữ token trong bộ nhớ trong thời gian màn hình đặt mật khẩu, không tạo ô nhập token và không dùng token như phiên đăng nhập.

Giữ `/reset_password` vì đây là thao tác đổi mật khẩu, có trách nhiệm riêng với xác minh OTP. Phương án gộp OTP và mật khẩu mới vào một request cũng có thể hợp lệ, nhưng không phải phương án đã chọn.

## Refresh token và phiên đăng nhập

Đăng nhập thành công tạo đúng một bản ghi `auth_sessions` trong PostgreSQL. Phiên lưu ID người dùng, SHA-256 của refresh token, `clientType` (WEB/MOBILE), tên thiết bị tùy chọn, User-Agent, IP, thời gian tạo/refresh, hạn phiên và lý do thu hồi. Không lưu access token hoặc refresh token gốc trong DB/Redis. `lastActiveAt` ghi nhận lần đăng nhập/refresh gần nhất; không phải thời điểm của mọi request.

- Access token mặc định 900 giây; phiên/refresh token mặc định 2592000 giây (30 ngày), điều chỉnh bằng `JWT_ACCESS_TTL_SECONDS` và `JWT_REFRESH_TTL_SECONDS`. Hạn refresh phải ít nhất bằng hạn access và không quá 90 ngày.
- Refresh không kéo dài hạn tuyệt đối của phiên. Token mới không được sống lâu hơn thời gian còn lại của phiên.
- Access token chứa `sid` và `tokenUse: ACCESS`. Guard kiểm tra chữ ký, thời hạn, tài khoản, role, phiên bản mật khẩu và phiên có đúng chủ sở hữu/còn hiệu lực/chưa bị thu hồi.
- Refresh token là JWT có nonce ngẫu nhiên, `tokenUse: REFRESH` và audience riêng `mediconnect-refresh`; không dùng nó làm Bearer access token. Chữ ký phải hợp lệ trước khi server kiểm tra hash hoặc thu hồi do dùng lại, tránh để token giả thu hồi phiên của người khác.
- Mỗi refresh thay hash bằng token mới trong cùng bản ghi. Dùng lại refresh token đã bị thay thế trả 401 và thu hồi toàn bộ phiên đó, gồm cả access token mới. Phiên trên thiết bị khác không bị ảnh hưởng.
- Frontend phải gom các request refresh đồng thời thành một request và dùng kết quả chung. Không thử lại token cũ khi mất phản hồi; chính sách phát hiện dùng lại có thể yêu cầu đăng nhập lại. Nếu hai request cùng dùng một token thì chỉ một request nhận 200, request còn lại thu hồi phiên theo chính sách này.
- Đăng nhập, refresh, logout và reset mật khẩu dùng cùng khóa hàng tài khoản PostgreSQL để tuần tự hóa thay đổi phiên/thông tin xác thực. Đăng nhập kiểm tra lại mật khẩu dưới khóa để tránh tạo phiên từ mật khẩu vừa bị reset.
- Logout, logout_all, thu hồi phiên và reset mật khẩu làm access token mất hiệu lực ở request tiếp theo; không đợi JWT tự hết hạn. Logout và quản lý phiên cần access token còn hiệu lực; nếu hết hạn, refresh trước. Phiên bị thu hồi/hết hạn vẫn giữ bản ghi, nhưng không xuất hiện trong danh sách phiên đang hoạt động.
- Access token cũ được cấp trước thay đổi này không có `sid`; người dùng cần đăng nhập lại.

**WEB** là mặc định. API đặt cookie `accessToken` (path `/api/v1`) và `refreshToken` (path `/api/v1/authentication`), cùng `HttpOnly`, `SameSite` theo cấu hình và `Secure` khi production. JSON trả accessToken, sessionId và thời hạn; không trả refresh token của WEB. Khi refresh, trình duyệt gửi `{}` với `credentials: 'include'`. POST/DELETE xác thực bằng cookie và refresh từ cookie yêu cầu Origin nằm trong `CORS_ORIGINS`; request thiếu Origin bị từ chối. Để test cookie bằng Postman, thêm `Origin` hợp lệ. Nếu dùng Swagger từ một origin khác, thêm chính origin Swagger vào cấu hình cho phép.

**MOBILE** nhận cả accessToken và refreshToken trong JSON, không nhận cookie. Ứng dụng lưu refresh token trong bộ nhớ bảo mật của hệ điều hành và gửi `{ "refreshToken": "..." }` khi refresh. Với API tests, body này cũng được hỗ trợ để tránh phụ thuộc cookie.

Ví dụ test bằng Swagger/Postman:

```json
{
  "email": "patient@example.com",
  "password": "mật khẩu hiện tại",
  "clientType": "MOBILE",
  "deviceName": "Postman"
}
```

Sau `/login`, kiểm tra `data.sessionId` trong bảng `auth_sessions`. Lấy `data.refreshToken` gọi `/refresh`; lưu token mới thay token trước đó. Dùng `data.accessToken` làm Bearer để gọi `/sessions`, `/logout` hoặc `/logout_all`.

Cơ chế thay refresh token và thu hồi khi phát hiện dùng lại dựa trên [RFC 9700, mục 4.14.2](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14.2). Cookie và thu hồi phiên tham khảo [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html). Đây là đăng nhập nội bộ bằng mật khẩu, không phải triển khai đầy đủ một OAuth authorization server.

## Redis và giới hạn

`RedisService` được Nest quản lý vòng đời; không tự kết nối khi import file. API yêu cầu `REDIS_URL`, kiểm tra URI và kết nối khi khởi động. Khi Redis không sẵn sàng, các thao tác OTP thất bại với 503 và không dùng bộ nhớ cục bộ làm đường dự phòng.

- OTP ngẫu nhiên 6 số, TTL 300 giây; Redis chỉ lưu HMAC-SHA256 của mã và ngữ cảnh.
- Tối đa 5 lần nhập sai cho mỗi tài khoản/purpose trong cửa sổ 15 phút, bao gồm các lần gửi lại và đổi kênh email/SĐT. Giới hạn này chỉ áp dụng cho phục hồi/xác minh; không chuyển tài khoản sang LOCKED.
- Gửi lại cách nhau ít nhất 60 giây; tối đa 5 lần gửi cho mỗi tài khoản/purpose trong một giờ tính từ lần gửi đầu.
- Giới hạn IP: 30 yêu cầu gửi/giờ, 60 yêu cầu verify/phút, 20 yêu cầu reset/phút. Cấu hình reverse proxy phải bảo đảm `request.ip` là IP đáng tin cậy trước khi dùng ngoài môi trường local.
- OTP chỉ được xác minh sau khi nhà cung cấp chấp nhận gửi. Gửi thất bại thì thu hồi challenge; giới hạn gửi vẫn được giữ để tránh spam.
- Gửi lại thay thế trạng thái hiện tại: OTP cũ và resetToken cũ đều mất hiệu lực.
- Xác minh thành công tiêu thụ OTP ngay. ResetToken lưu dưới dạng hash, TTL 600 giây, chỉ dùng một lần.
- Lua thực hiện nguyên tử việc đếm thử sai, kiểm tra trạng thái và tiêu thụ quyền. Những key tham gia cùng script dùng cùng Redis hash tag; các key tra cứu chỉ dẫn về scope và vẫn phải khớp ID/token của trạng thái hiện tại.
- Redis key dùng HMAC để tránh đặt email/SĐT trực tiếp trong tên key. Payload cần thông tin liên hệ để ràng buộc xác minh; Redis phải được bảo vệ bằng mạng nội bộ/TLS/ACL phù hợp.

OTP, mật khẩu và token reset được che trong HTTP log. Luồng forgot/send trả cùng cấu trúc JSON cho tài khoản không tồn tại, không đủ điều kiện hoặc bị giới hạn theo tài khoản. Việc gọi nhà cung cấp gửi tin hiện vẫn đồng bộ; cấu trúc JSON giống nhau không bảo đảm thời gian phản hồi giống nhau.

## Cập nhật mật khẩu và schema hiện tại

Code dùng `User.fullName`, enum `UserStatus` và bảng `auth_sessions` theo schema mới. Baseline hiện tại `20261006135520_init` đã bao gồm:

- Email có thể NULL để hỗ trợ đăng ký bằng SĐT; email và phone có ràng buộc duy nhất để việc tra cứu không chọn nhầm tài khoản.
- `phoneVerifiedAt`, `passwordChangedAt`, `deletedAt` phục vụ vòng đời xác thực.
- Tên role/permission và cặp role/permission là duy nhất để seed idempotent và phân quyền không bị trùng.

Giữ các tên model `role`, `permission`, `infoPermission` và field `role_id`, `permission_id` mà schema hiện tại đã chọn, dù khác quy ước PascalCase/camelCase của repository. Không tạo thêm model song song.

Không có bảng OTP, bảng refresh token riêng hoặc AccountExternal trong schema mới. Reset thu hồi `AuthSession` bằng `revokedAt` và `revocationReason`. `passwordChangedAt` được đưa vào phiên bản thông tin xác thực trong JWT; token cũ bị từ chối ngay sau khi đổi mật khẩu.

Khi cấp OTP, server ghi nhận phiên bản mật khẩu hiện tại. Khi verify/reset, server kiểm tra lại phiên bản này, tài khoản, role và thông tin liên hệ dưới khóa hàng PostgreSQL. Một challenge trước lần đổi mật khẩu khác không được tiếp tục dùng.

Redis và PostgreSQL không có transaction chung. Quyền reset được tiêu thụ nguyên tử trước cập nhật DB; nếu DB lỗi, quyền đó không được khôi phục vì không thể chắc chắn transaction chưa commit. Người dùng phải yêu cầu OTP mới. Cách xử lý này ưu tiên không dùng lại quyền đổi mật khẩu.

## Chạy và kiểm thử

Từ thư mục `mediConnect`:

```sh
npm run prisma:migrate --workspace api
npm run prisma:generate --workspace api
npm run prisma:seed --workspace api
npm run test:e2e --workspace api -- --runInBand
```

Lịch sử migration hiện chỉ có baseline `20261006135520_init` do dự án đã tạo lại. Phần refresh/session không sửa baseline. Không áp dụng baseline này lên DB có lịch sử/schema khác bằng cách reset hoặc đánh dấu applied tùy tiện. Khi cập nhật dữ liệu, email, phone, tên role/permission và cặp grant phải duy nhất; không tự xóa hay gộp tài khoản khi gặp trùng.

HTTP tests dùng JWT/bcrypt thật, mock PostgreSQL (có lưu trạng thái phiên và tuần tự hóa transaction) và một bộ lưu trữ OTP mô phỏng. Các ca kiểm tra bao gồm tạo phiên, hash refresh token, rotation/dùng lại, request đồng thời, hết hạn, khác chủ sở hữu, WEB/MOBILE, CSRF, logout, reset mật khẩu và lỗi DB. Test migration dùng PGlite trong bộ nhớ và đối chiếu toàn bộ schema với SQL Prisma sinh ra. Chúng không kết nối DB/Redis của ứng dụng hoặc gửi OTP thật; mock transaction không thay thế kiểm thử đa kết nối PostgreSQL thực tế.

Phần refresh/session dùng bảng `auth_sessions` hiện có, không cần migration mới. Cần khởi động lại API sau khi cập nhật source/env.

Suite Redis thật được bật bằng `REDIS_TEST_URL` riêng; không dùng ngầm `REDIS_URL`, không FLUSHDB và chỉ xóa namespace test ngẫu nhiên:

```powershell
$env:REDIS_TEST_URL = 'redis://localhost:6379'
npm run test:redis --workspace api
```

Nếu chưa đặt `REDIS_TEST_URL`, suite Redis thật được đánh dấu skipped trong test:e2e; test:redis báo lỗi rõ ràng. Suite kiểm tra TTL, request đồng thời, giới hạn 5 lần sai, chống reset bộ đếm khi resend và tiêu thụ token đúng một lần.

## Cơ sở lựa chọn luồng

[OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html) mô tả xác minh PIN/mã rồi tạo một phiên giới hạn chỉ cho phép đổi mật khẩu. [Tài liệu Redis Lua](https://redis.io/docs/latest/develop/programmability/eval-intro/) xác nhận script chạy nguyên tử; đây là cơ sở để triển khai bộ đếm và quyền dùng một lần.
