import { whatsappLink } from "@/lib/site";
import { Icon } from "@/components/Icon";

/** Floating WhatsApp button — persistent conversion prompt on every page. */
export function WhatsAppFloat() {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3.5 text-white shadow-card-hover transition-transform hover:scale-105"
    >
      <Icon name="whatsapp" className="h-6 w-6" />
      <span className="hidden text-sm font-semibold sm:inline">Chat with us</span>
    </a>
  );
}
