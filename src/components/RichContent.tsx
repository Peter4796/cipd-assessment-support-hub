import type { Block } from "@/content/blog";
import { Icon } from "@/components/Icon";

/** Renders a typed block array (blog posts, case studies) as styled long-form content. */
export function RichContent({ blocks }: { blocks: Block[] }) {
  return (
    <div className="rich-text">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return <h2 key={i}>{block.text}</h2>;
          case "h3":
            return <h3 key={i}>{block.text}</h3>;
          case "p":
            return <p key={i}>{block.text}</p>;
          case "ul":
            return (
              <ul key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="mt-4 list-decimal space-y-2 pl-5 text-navy-600 marker:font-semibold marker:text-gold-500">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ol>
            );
          case "callout":
            return (
              <div
                key={i}
                className="my-6 flex gap-3 rounded-2xl border border-teal-200 bg-teal-50/60 p-5"
              >
                <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-teal-500 text-white">
                  <Icon name="check" className="h-4 w-4" />
                </span>
                <p className="!mt-0 text-[15px] font-medium leading-relaxed text-navy-700">
                  {block.text}
                </p>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
