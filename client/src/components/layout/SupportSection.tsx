import { Heart, ShieldCheck } from "lucide-react";
import { Badge } from "../ui/badge";

interface SupportSectionProps {
  creatorName?: string;
  backgroundColor?: string;
}

export function SupportSection({ creatorName = "dem Kurator", backgroundColor = "var(--color-gray-50)" }: SupportSectionProps) {
  return (
    <section className="py-16 px-8" style={{ backgroundColor }}>
      <div className="max-w-4xl mx-auto text-center">
        <div className="rounded-2xl p-12 px-[48px] py-[0px]">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal/10 rounded-full mb-6">
            <Heart className="w-8 h-8 text-teal" />
          </div>
          
          <h2 className="headline mb-4 text-[40px] text-foreground">Unterstütze den Kurator</h2>
          
          <p className="text-gray-700 mb-8 max-w-2xl mx-auto text-[20px] leading-relaxed">
            Diese Seite wird kuratiert von {creatorName}. Mit jedem Buchkauf unterstützt du dieses Format – vielen Dank! 
            Deine Unterstützung ermöglicht es, weiterhin unabhängige und 
            fundierte Inhalte zu produzieren.
          </p>
        </div>
      </div>
    </section>
  );
}