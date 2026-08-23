interface LogoMarkProps {
  size?: number
}

export function LogoMark({ size = 48 }: LogoMarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.jpg"
      alt="NTB logo"
      width={size}
      height={size}
      className="logo-mark shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  )
}
