/**
 * Logo Vu Phong — sidebar mở rộng: bản ngang SVG (cánh quạt xoay như vuphong.com)
 * Sidebar thu gọn: icon tròn mặt trời
 */
export default function VuPhongLogo({ collapsed = false, className = '' }) {
  if (collapsed) {
    return (
      <img
        src="/logo-vuphong-sun.png"
        alt="VUPHONG"
        className={`w-8 h-8 object-cover object-top shrink-0 ${className}`}
      />
    );
  }

  return (
    <img
      src="/logo-vuphong-wide.svg"
      alt="VUPHONG Energy Group"
      className={`h-11 w-auto max-w-[208px] shrink-0 object-contain object-left ${className}`}
    />
  );
}
