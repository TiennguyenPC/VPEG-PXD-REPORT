/**
 * Logo Vu Phong — sidebar mở rộng: bản ngang SVG (cánh quạt xoay như vuphong.com)
 * Sidebar thu gọn: icon tròn mặt trời
 * responsive: mobile = vuông, desktop = ngang (trang đăng nhập)
 */
import logoSun from '../assets/logo-vuphong-sun.png';
import logoWide from '../assets/logo-vuphong-wide.svg';

export default function VuPhongLogo({ collapsed = false, responsive = false, className = '' }) {
  if (responsive) {
    return (
      <>
        <img
          src={logoSun}
          alt="VUPHONG"
          className={`sm:hidden w-16 h-16 object-cover object-top shrink-0 mx-auto ${className}`}
        />
        <img
          src={logoWide}
          alt="VUPHONG Energy Group"
          className={`hidden sm:block h-12 w-auto max-w-[240px] shrink-0 object-contain mx-auto ${className}`}
        />
      </>
    );
  }

  if (collapsed) {
    return (
      <img
        src={logoSun}
        alt="VUPHONG"
        className={`w-8 h-8 object-cover object-top shrink-0 ${className}`}
      />
    );
  }

  return (
    <img
      src={logoWide}
      alt="VUPHONG Energy Group"
      className={`h-11 w-auto max-w-[208px] shrink-0 object-contain object-left ${className}`}
    />
  );
}
