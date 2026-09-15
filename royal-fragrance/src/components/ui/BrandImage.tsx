import Image from "next/image";
import { Sparkle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Renders a real photo when one exists; otherwise renders an elegant
 * on-brand gradient placeholder instead of a broken image path or, worse,
 * a hotlinked stock photo of someone else's actual branded product.
 *
 * Use this everywhere a product/brand photo is shown until real product
 * photography is uploaded via the admin dashboard.
 */
export function BrandImage({
  src,
  alt,
  className,
  fill = true,
  sizes,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
}) {
  const hasRealImage = !!src && !src.includes("/images/placeholder");

  if (!hasRealImage) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-brand-gradient",
          className
        )}
      >
        <Sparkle className="text-caramel/60" size={28} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      // object-cover is the sensible default for real product photography
      // (fills the frame edge-to-edge, no letterboxing). Listed FIRST so
      // any caller that explicitly wants object-contain (e.g. a logo, or
      // a photo that genuinely shouldn't be cropped) can still override it
      // — this used to be forced the other way around, which is why shop
      // images weren't filling their card despite ProductCard asking for
      // object-cover.
      className={cn("object-cover", className)}
    />
  );
}
