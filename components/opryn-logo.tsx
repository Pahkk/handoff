import Image from "next/image";

type Props = {
  inverse?: boolean;
  size?: "small" | "default" | "large";
  priority?: boolean;
  className?: string;
};

const sizes = {
  small: "h-7 w-[108px]",
  default: "h-9 w-[142px]",
  large: "h-11 w-[174px]",
};

export function OprynLogo({
  inverse = false,
  size = "default",
  priority = false,
  className = "",
}: Props) {
  return (
    <span
      className={`brand-wordmark relative block shrink-0 overflow-hidden ${sizes[size]} ${className}`}
      aria-label="Opryn"
      role="img"
    >
      <Image
        src="/opryn-logo.png"
        alt=""
        fill
        priority={priority}
        sizes={
          size === "large" ? "174px" : size === "small" ? "108px" : "142px"
        }
        className={`object-cover object-center ${inverse ? "brightness-0 invert" : ""}`}
      />
    </span>
  );
}
