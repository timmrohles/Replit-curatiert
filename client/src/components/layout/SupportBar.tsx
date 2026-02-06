import { Button } from "./ui/button";
import { Heart, ExternalLink } from "lucide-react";

export function SupportBar() {
  return (
    <section className="bg-[var(--charcoal)] py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center gap-12">
          {/* Left: Support Label */}
          <span className="text-white/70 text-sm">Unterstützung:</span>
          
          {/* Center: All Buttons with Equal Spacing */}
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              className="bg-[#D6A847] hover:bg-[#D6A847]/90 text-[var(--charcoal)] h-9 px-5 text-sm"
            >
              Spenden
            </Button>
            <Button
              size="sm"
              className="bg-[#D6A847] hover:bg-[#D6A847]/90 text-[var(--charcoal)] h-9 px-5 text-sm"
            >
              Newsletter abonnieren
            </Button>
            <Button
              size="sm"
              className="bg-[#D6A847] hover:bg-[#D6A847]/90 text-[var(--charcoal)] h-9 px-5 text-sm"
            >
              Abo bestellen
            </Button>
          </div>

          {/* Right: Partner Logos */}
          <div className="flex items-center gap-3">
            <span className="text-white/70 text-sm">Partner:</span>
            <div className="flex items-center gap-3">
              {/* Placeholder Logos */}
              <div className="h-7 w-20 bg-white/10 rounded flex items-center justify-center">
                <span className="text-white/40 text-xs">Logo 1</span>
              </div>
              <div className="h-7 w-20 bg-white/10 rounded flex items-center justify-center">
                <span className="text-white/40 text-xs">Logo 2</span>
              </div>
              <div className="h-7 w-20 bg-white/10 rounded flex items-center justify-center">
                <span className="text-white/40 text-xs">Logo 3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}