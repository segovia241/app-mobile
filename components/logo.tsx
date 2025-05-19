import Image from "next/image"
import Link from "next/link"

interface LogoProps {
  size?: number
  showText?: boolean
  className?: string
  href?: string
}

export function Logo({ size = 40, showText = true, className = "", href = "/" }: LogoProps) {
  return (
    <Link href={href} className={`flex items-center gap-2 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Qj7o774IFhwcQ6p3TtiRqNPLinzVVI.png"
          alt="Emoggy Logo"
          width={size}
          height={size}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span className="font-bold text-xl tracking-tight">
          Emoggy<span className="text-primary">!</span>
        </span>
      )}
    </Link>
  )
}
