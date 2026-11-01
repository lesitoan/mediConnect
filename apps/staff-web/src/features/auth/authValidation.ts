export function isValidOtp(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}

export function getPasswordError(password: string): string | undefined {
  if (Array.from(password).length < 8)
    return "Mật khẩu mới phải có ít nhất 8 ký tự.";
  if (new TextEncoder().encode(password).length > 72)
    return "Mật khẩu mới quá dài. Vui lòng dùng mật khẩu ngắn hơn.";
  if (
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+$/.test(password)
  ) {
    return "Mật khẩu cần có chữ hoa, chữ thường, số và ký tự đặc biệt.";
  }
}
