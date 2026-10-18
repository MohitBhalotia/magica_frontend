import Image from "next/image";

/** Reference wordmark (public/magica.png, 80×20), inverted in dark mode (DESIGN §3.2). */
export function Logo() {
  return (
    <Image
      src="/magica.png"
      alt="Magica"
      width={80}
      height={20}
      priority
      className="h-(--magica-logo-height) w-(--magica-logo-width) object-contain object-left dark:invert"
    />
  );
}

/** Collapsed-rail mark (18×13); the reference ships separate light and dark SVGs. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={className}>
      <Image
        src="/magica_logo_collapsed_light.svg"
        alt="Magica"
        width={18}
        height={13}
        className="dark:hidden"
      />
      <Image
        src="/magica_logo_collapsed_dark.svg"
        alt="Magica"
        width={18}
        height={13}
        className="hidden dark:block"
      />
    </span>
  );
}
