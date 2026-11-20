"use client";

import { useRef } from "react";
import { ImageIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const FOOD_PRESETS = [
  { label: "Chicken Wrap", url: "/images/wrap.jpg" },
  { label: "Peri Peri Wrap", url: "/images/wrap-peri-peri.jpg" },
  { label: "Zinger Wrap", url: "/images/wrap-zinger.jpg" },
  { label: "Falafel Wrap", url: "/images/wrap-falafel.jpg" },
  { label: "BBQ Beef Wrap", url: "/images/wrap-bbq.jpg" },
  { label: "Shawarma", url: "/images/shawarma.jpg" },
  { label: "Cheese Shawarma", url: "/images/cheese-shawarma.jpg" },
  { label: "Mandi", url: "/images/mandi.jpg" },
  { label: "Madbi", url: "/images/madbi.jpg" },
  { label: "Fries", url: "/images/fries.jpg" },
  { label: "Blueberry Mojito", url: "/images/drink-blueberry.jpg" },
  { label: "Mint Lemonade", url: "/images/drink-mint-lemonade.jpg" },
  { label: "Mango Lassi", url: "/images/drink.jpg" },
  { label: "Strawberry Shake", url: "/images/drink-strawberry.jpg" },
  { label: "Peach Iced Tea", url: "/images/drink-peach-tea.jpg" },
  { label: "Kunafa", url: "/images/kunafa.jpg" },
  { label: "Deal", url: "/images/deal.jpg" },
];

export const LOGO_PRESETS = [
  { label: "Wrap Lab", url: "/images/wraplab-logo.jpg" },
  { label: "Shawarma Palace", url: "/images/shawarma-palace-logo.jpg" },
];

function resizeImageToDataUrl(file: File, maxDim: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image file"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function ImagePicker({
  id,
  label,
  value,
  onChange,
  presets,
  maxDim = 800,
  placeholder = "/images/wrap.jpg or https://…",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  presets: { label: string; url: string }[];
  maxDim?: number;
  placeholder?: string;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file, maxDim);
      onChange(dataUrl);
      toast.success("Image loaded");
    } catch {
      toast.error("Could not process image");
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          {value ? (
            <img src={value} alt={label} className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-5 text-slate-400" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex gap-2">
            <Input
              id={id}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="flex-1"
            />
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onChange("")}
                aria-label="Clear image"
              >
                <X className="size-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-3.5" />
              Upload
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
          </div>
          {presets.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 mr-1">Presets:</span>
              {presets.map((p) => (
                <button
                  key={p.url}
                  type="button"
                  onClick={() => onChange(p.url)}
                  className={
                    "flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] transition-colors cursor-pointer " +
                    (value === p.url
                      ? "border-[#d7b51a] bg-[#d7b51a]/15 font-semibold text-slate-900"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
                  }
                >
                  <img src={p.url} alt="" className="size-3.5 rounded-sm object-cover" />
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
