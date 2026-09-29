import Image from "next/image";

interface LogoProps {
  size?: number;
  mark?: boolean;
  className?: string;
  monochrome?: boolean;
}

export default function Logo({ size = 40, mark = false, className = "", monochrome = false }: LogoProps) {
  const src = mark ? "/logo-mark.png" : "/logo.png";
  const dims = mark ? { w: 736, h: 354 } : { w: 736, h: 506 };

  return (
    <Image
      src={src}
      alt="ms.rent"
      width={dims.w}
      height={dims.h}
      className={`${className} ${monochrome ? "brightness-0 invert" : ""}`}
      style={{ height: size, width: "auto" }}
      priority
    />
  );
}

