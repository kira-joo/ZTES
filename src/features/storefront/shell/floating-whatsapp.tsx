import { MessageCircle } from "lucide-react";

/** The reference's floating WhatsApp bubble (bottom, start side). */
export function FloatingWhatsApp({ number, label }: { number: string; label: string }) {
  const digits = number.replace(/\D/g, "");
  if (!digits) return null;
  return (
    <a
      href={`https://wa.me/${digits}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="fixed bottom-5 start-4 z-20 grid size-14 place-items-center rounded-full bg-whatsapp text-white shadow-lg transition-transform hover:scale-105 max-md:bottom-24"
    >
      <MessageCircle className="size-7" aria-hidden="true" />
    </a>
  );
}
