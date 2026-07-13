/**
 * Twitter/X card image — identical to the Open Graph image. Kept as its own
 * file-convention route so twitter:image is emitted explicitly (the root
 * metadata declares `summary_large_image`, which must always have an image).
 * `runtime` must be a string literal here for Next's static analysis.
 */
export const runtime = "edge";
export { default, alt, size, contentType } from "./opengraph-image";
