"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  MapPin, Phone, ShoppingBag, Menu, X, ChevronLeft, ChevronRight,
  Facebook, Instagram, Linkedin, Youtube, ChevronDown, ChevronUp,
  Plus, Minus, Star, Flame, Search, Trash2, ShoppingCart,
  CreditCard, Banknote, Check, Eye, Copy, User, LogIn, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/cart-store";
import { useToast } from "@/hooks/use-toast";

// ============ TYPES ============

interface Category {
  id: number; name: string; icon: string; sortOrder: number;
  _count: { products: number };
}

interface ProductAddon {
  name: string; price: number;
}

interface Product {
  id: number; name: string; description: string; price: number; image: string;
  categoryId: number; badge: string | null; rating: number; isActive: boolean;
  category: { name: string; icon: string };
  addons: ProductAddon[];
}

interface Offer {
  id: number; title: string; description: string; code: string;
  icon: string; discountType: string; discountValue: number; minOrder: number;
}

interface AuthUser {
  id: string; name: string; email: string; phone: string | null; role: string;
}

// ============ DATA CONSTANTS (fallbacks) ============

const BANNER_DATA = [
  { title: "Delicious Wraps", subtitle: "Fresh & Flavorful, Delivered Fast", cta: "Order Now", bg: "from-amber-800 via-orange-700 to-amber-900" },
  { title: "Authentic Mandi", subtitle: "Traditional Arabic Rice Dishes", cta: "Explore Menu", bg: "from-stone-800 via-amber-900 to-stone-800" },
  { title: "Family Deals", subtitle: "Feed the Whole Family", cta: "View Deals", bg: "from-red-900 via-orange-800 to-red-900" },
];

function getCategoryEmoji(cat: string): string {
  const map: Record<string, string> = { Wraps: "🌯", Shawarma: "🥙", Mandi: "🍚", Madbi: "🔥", Beverages: "🥤", Sides: "🍟", Desserts: "🍰", Deals: "🏷️" };
  return map[cat] || "🍽️";
}

// ============ SUB-COMPONENTS ============

function AppDownloadBanner({ onClose }: { onClose: () => void }) {
  return (
    <div className="lg:hidden relative overflow-hidden" style={{ background: "#333333", color: "#ffffff", padding: "8px 16px" }}>
      <div className="flex items-center justify-center gap-4 relative z-10">
        <div className="uppercase font-bold leading-tight text-sm tracking-wider">DOWNLOAD<br />OUR APP</div>
        <div className="w-[2px] h-7 opacity-70" style={{ background: "#ffffff" }} />
        <a href="https://play.google.com/store/apps/details?id=com.blink.wraplab&hl=en" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105">
          <div className="bg-white rounded px-3 py-1 text-gray-800 font-semibold text-xs">Google Play</div>
        </a>
        <button onClick={onClose} className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer hover:scale-110 z-20 rounded-full" style={{ background: "#fff", color: "#333", width: 26, height: 26 }} aria-label="Close"><X className="w-3 h-3" /></button>
      </div>
    </div>
  );
}

function WrapLabLogo({ className = "" }: { className?: string }) {
  return (
    <div className={"flex items-center justify-center " + className}>
      <svg width="170" height="70" viewBox="0 0 170 70" fill="none">
        <text x="85" y="38" textAnchor="middle" fontSize="28" fontWeight="800" fill="#333333" fontFamily="var(--font-poppins), Poppins, sans-serif" letterSpacing="-0.5">WRAP</text>
        <text x="85" y="62" textAnchor="middle" fontSize="28" fontWeight="300" fill="#d7b51a" fontFamily="var(--font-poppins), Poppins, sans-serif" letterSpacing="-0.5">LAB</text>
      </svg>
    </div>
  );
}

function SearchBar({ value, onChange, onFocus, isFocused }: { value: string; onChange: (v: string) => void; onFocus: () => void; isFocused: boolean }) {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className={"flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all duration-200 bg-white " + (isFocused ? "border-[#d7b51a] shadow-md shadow-amber-100" : "border-gray-200 hover:border-gray-300")}>
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input type="text" placeholder="Search wraps, shawarma, mandi..." value={value} onChange={(e) => onChange(e.target.value)} onFocus={onFocus} className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 text-gray-700" />
        {value && <button onClick={() => onChange("")} className="p-0.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"><X className="w-3.5 h-3.5 text-gray-400" /></button>}
      </div>
    </div>
  );
}

// ---- Navbar ----
function Navbar({ onMenuToggle, onCartToggle, searchValue, onSearchChange, searchFocused, onSearchFocus, user, onAuthClick }: {
  onMenuToggle: () => void; onCartToggle: () => void; searchValue: string; onSearchChange: (v: string) => void; searchFocused: boolean; onSearchFocus: () => void; user: AuthUser | null; onAuthClick: () => void;
}) {
  const cartItems = useCartStore((s) => s.getTotalItems());
  return (
    <header className="w-full relative bg-transparent">
      <div className="flex sm:hidden items-center justify-between gap-2 px-3 py-2 relative z-[3] min-w-0">
        <div className="min-w-0 flex-shrink"><WrapLabLogo className="scale-[0.55] origin-left -ml-3" /></div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button className="cursor-pointer flex items-center px-0 py-1 rounded-full transition-colors duration-200"><div className="flex items-center justify-center w-9 h-9 rounded-full"><MapPin className="w-5 h-5 text-gray-700" /></div></button>
          <a href="tel:03127777067" className="flex items-center justify-center w-9 h-9 cursor-pointer"><Phone className="w-5 h-5 text-gray-700" /></a>
          <button onClick={onCartToggle} className="w-9 h-9 flex justify-center items-center relative flex-shrink-0 p-1 rounded-full cursor-pointer transition-colors duration-200">
            <ShoppingBag className="w-5 h-5" style={{ color: "#d7b51a" }} />
            {cartItems > 0 && <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center leading-none">{cartItems}</span>}
          </button>
          <button onClick={onMenuToggle} className="w-7 h-7 flex justify-center items-center relative flex-shrink-0 ml-2 cursor-pointer"><Menu className="w-6 h-6 text-gray-700" /></button>
        </div>
      </div>
      <div className="hidden sm:flex items-center justify-between px-6 lg:px-10 max-w-7xl mx-auto relative z-[3] pt-4 pb-2">
        <div className="flex items-center flex-1 min-w-0">
          <button className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-full transition-colors duration-200 hover:bg-gray-100">
            <div className="flex items-center justify-center w-9 h-9 rounded-full"><MapPin className="w-5 h-5 text-gray-700" /></div>
            <div className="flex flex-col text-start">
              <span className="text-sm font-bold text-gray-800 tracking-wide leading-none">Change Location</span>
              <span className="text-xs font-medium text-gray-500 truncate max-w-[180px] leading-tight">Islamabad</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <div className="w-px h-8 bg-gray-300 mx-2 flex-shrink-0" />
          <a href="tel:03127777067" className="flex items-center gap-2 px-2 py-2 rounded-full cursor-pointer transition-colors duration-200 hover:bg-gray-100">
            <div className="flex items-center justify-center w-9 h-9 rounded-full"><Phone className="w-5 h-5 text-gray-700" /></div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-gray-800 tracking-wide leading-none">Contact us</span>
              <span className="text-xs font-medium text-gray-500 leading-tight hover:text-gray-700">03127777067</span>
            </div>
          </a>
        </div>
        <div className="flex flex-col items-center justify-center flex-shrink-0 px-4 gap-1"><a href="/"><WrapLabLogo /></a></div>
        <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
          <button onClick={onAuthClick} className="relative flex items-center gap-2 px-3 py-2 rounded-full cursor-pointer transition-all duration-200 hover:bg-gray-100">
            <div className="relative"><User className="w-5 h-5 text-gray-600" /></div>
            <span className="text-sm font-medium text-gray-700 hidden lg:inline">{user ? user.name : "Login"}</span>
          </button>
          <button onClick={onCartToggle} className="relative flex items-center gap-2 px-3 py-2 rounded-full cursor-pointer transition-all duration-200 hover:bg-gray-100">
            <div className="relative">
              <ShoppingBag className="w-6 h-6" style={{ color: "#d7b51a" }} />
              {cartItems > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[11px] font-bold rounded-full min-w-[19px] h-[19px] flex items-center justify-center leading-none">{cartItems}</span>}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden lg:inline">Cart</span>
          </button>
          <button onClick={onMenuToggle} className="w-11 h-11 flex justify-center items-center relative flex-shrink-0 rounded-full cursor-pointer transition-colors duration-200 hover:bg-gray-100"><Menu className="w-6 h-6 text-gray-700" /></button>
        </div>
      </div>
      <div className="hidden sm:block px-6 lg:px-10 pb-3 max-w-7xl mx-auto">
        <SearchBar value={searchValue} onChange={onSearchChange} onFocus={onSearchFocus} isFocused={searchFocused} />
      </div>
    </header>
  );
}

// ---- Hero Banner ----
function HeroBanner({ onCtaClick }: { onCtaClick: (cta: string) => void }) {
  const [current, setCurrent] = useState(0);
  const total = BANNER_DATA.length;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startAuto = useCallback(() => { intervalRef.current = setInterval(() => setCurrent((p) => (p + 1) % total), 4000); }, [total]);
  useEffect(() => { startAuto(); return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; }, [startAuto]);
  const goTo = (i: number) => { setCurrent(i); if (intervalRef.current) clearInterval(intervalRef.current); startAuto(); };
  return (
    <div className="relative z-[1] w-[94%] sm:w-[96%] mx-auto overflow-hidden bg-gray-100 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] animate-fade-in-up my-1 md:my-6 md:mt-2 lg:my-3 lg:mt-2 border border-gray-300/40 touch-pan-y select-none">
      <div className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]" style={{ transform: `translateX(-${current * 100}%)` }}>
        {BANNER_DATA.map((b, i) => (
          <div key={i} className="w-full shrink-0 relative overflow-hidden">
            <div className={"relative w-full aspect-[1920/500] bg-gradient-to-r " + b.bg}>
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white px-4">
                  <p className="text-xs sm:text-sm uppercase tracking-[0.3em] mb-2 opacity-80">Islamabad&apos;s Favorite</p>
                  <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">{b.title}</h2>
                  <p className="text-sm sm:text-lg mt-2 opacity-70">{b.subtitle}</p>
                  <button onClick={() => onCtaClick(b.cta)} className="mt-4 sm:mt-6 px-6 sm:px-8 py-2.5 sm:py-3 bg-[#d7b51a] text-black font-bold text-sm sm:text-base rounded-full hover:bg-[#c4a517] transition-colors duration-200 cursor-pointer">{b.cta}</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => goTo((current - 1 + total) % total)} className="group absolute cursor-pointer top-1/2 -translate-y-1/2 bg-white/80 text-gray-500 rounded-full transition-all duration-300 z-20 p-1 sm:p-1.5 md:p-2 lg:p-2.5 left-1 sm:left-2 md:left-3 lg:left-4 hover:bg-white" aria-label="Previous slide"><ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6 group-hover:-translate-x-0.5 transition-transform duration-200" /></button>
      <button onClick={() => goTo((current + 1) % total)} className="group absolute cursor-pointer top-1/2 -translate-y-1/2 bg-white/80 text-gray-500 rounded-full transition-all duration-300 z-20 p-1 sm:p-1.5 md:p-2 lg:p-2.5 right-1 sm:right-2 md:right-3 lg:right-4 hover:bg-white" aria-label="Next slide"><ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6 group-hover:translate-x-0.5 transition-transform duration-200" /></button>
      <div className="absolute bottom-1.5 sm:bottom-2 md:bottom-4 lg:bottom-6 left-1/2 -translate-x-1/2 flex space-x-1 sm:space-x-1.5 md:space-x-2 lg:space-x-2.5 z-20">
        {BANNER_DATA.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} className={"transition-all duration-300 rounded-full shadow-md " + (i === current ? "w-10 h-2.5 bg-white" : "w-2.5 h-2.5 bg-black/60 hover:bg-black/80")} aria-label={"Go to slide " + (i + 1)} />
        ))}
      </div>
    </div>
  );
}

// ---- Offers Section ----
function OffersSection({ offers, onOfferClick }: { offers: Offer[]; onOfferClick: (code: string) => void }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2">
        {offers.map((o) => (
          <button key={o.id} onClick={() => onOfferClick(o.code)} className="flex-shrink-0 flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl hover:shadow-md transition-all duration-200 cursor-pointer group min-w-[200px] sm:min-w-[260px]">
            <span className="text-2xl sm:text-3xl">{o.icon}</span>
            <div className="text-left">
              <p className="font-bold text-sm sm:text-base text-gray-800 group-hover:text-amber-700 transition-colors">{o.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{o.description}</p>
              <p className="text-xs font-bold text-[#d7b51a] mt-1">Code: {o.code}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

// ---- Category Navigation ----
function CategoryNav({ categories, activeCategory, onSelect }: { categories: Category[]; activeCategory: string; onSelect: (cat: string) => void }) {
  return (
    <nav className="w-full sticky z-40 top-0 bg-white shadow-sm transition-all duration-500">
      <div className="w-full sm:px-8 md:px-10">
        <div className="max-w-7xl mx-auto relative w-full">
          <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 overflow-x-auto scrollbar-hide py-2.5 sm:py-3 px-4 sm:px-8 md:px-10" style={{ justifyContent: "center" }}>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => onSelect(cat.name)} className={"flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer " + (activeCategory === cat.name ? "bg-[#333333] text-[#d7b51a] shadow-md" : "bg-white text-[#333333] hover:bg-gray-100 border border-gray-200")}>
                <span className="text-base">{cat.icon}</span><span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

// ---- Menu Item Card ----
function MenuItemCard({ item, onOpenDetail, onQuickAdd }: { item: Product; onOpenDetail: (item: Product) => void; onQuickAdd: (item: Product) => void }) {
  const qty = useCartStore((s) => s.getItemQuantity(item.id));
  const badgeColors: Record<string, string> = {
    Bestseller: "bg-amber-400 text-black", New: "bg-green-500 text-white", Popular: "bg-orange-500 text-white",
    Premium: "bg-purple-600 text-white", Veg: "bg-green-600 text-white", "Save 20%": "bg-red-500 text-white",
  };
  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} whileHover={{ y: -4 }} transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300 group">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 cursor-pointer" onClick={() => onOpenDetail(item)}>
        <div className={"absolute inset-0 bg-gradient-to-br " + (item.category.name === "Wraps" ? "from-amber-50 to-orange-100" : item.category.name === "Shawarma" ? "from-red-50 to-orange-50" : item.category.name === "Mandi" ? "from-yellow-50 to-amber-100" : item.category.name === "Madbi" ? "from-orange-50 to-red-50" : item.category.name === "Beverages" ? "from-cyan-50 to-blue-50" : item.category.name === "Sides" ? "from-yellow-50 to-amber-50" : item.category.name === "Desserts" ? "from-pink-50 to-rose-50" : "from-amber-50 to-yellow-50")} />
        <div className="absolute inset-0 flex items-center justify-center text-6xl select-none">{getCategoryEmoji(item.category.name)}</div>
        {item.badge && (
          <div className="absolute top-2 left-2">
            <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold " + (badgeColors[item.badge] || "bg-red-500 text-white")}>
              {item.badge === "Bestseller" && <Flame className="w-3 h-3" />}{item.badge === "Save 20%" && <Star className="w-3 h-3" />}{item.badge}
            </span>
          </div>
        )}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <button className="w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-white" aria-label="View details"><Eye className="w-4 h-4 text-gray-700" /></button>
        </div>
      </div>
      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm sm:text-base text-gray-800 leading-tight cursor-pointer hover:text-[#d7b51a] transition-colors" onClick={() => onOpenDetail(item)}>{item.name}</h3>
          <div className="flex items-center gap-0.5 flex-shrink-0"><Star className="w-3.5 h-3.5 fill-[#d7b51a] text-[#d7b51a]" /><span className="text-xs font-medium text-gray-600">{item.rating}</span></div>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-base sm:text-lg text-gray-900">Rs. {item.price}</span>
          {qty > 0 ? (
            <div className="flex items-center gap-1">
              <button onClick={() => onQuickAdd(item)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-colors"><Minus className="w-3.5 h-3.5" /></button>
              <span className="w-6 text-center text-sm font-bold">{qty}</span>
              <button onClick={() => onQuickAdd(item)} className="w-7 h-7 rounded-full bg-[#d7b51a] hover:bg-[#c4a517] text-black flex items-center justify-center cursor-pointer transition-colors"><Plus className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <button onClick={() => onQuickAdd(item)} className="px-3 py-1.5 bg-[#ffd400] text-black text-xs sm:text-sm font-bold rounded-full hover:bg-[#e6c000] transition-colors duration-200 cursor-pointer">Add to Cart</button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---- Product Detail Modal ----
function ProductDetailModal({ item, onClose, isOpen }: { item: Product | null; onClose: () => void; isOpen: boolean }) {
  const [qty, setQty] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const { addItem } = useCartStore();
  const { toast } = useToast();
  const toggleAddon = (idx: number) => setSelectedAddons((p) => p.includes(idx) ? p.filter((x) => x !== idx) : [...p, idx]);
  if (!item) return null;
  const addonTotal = (item.addons || []).filter((_, i) => selectedAddons.includes(i)).reduce((s, a) => s + a.price, 0);
  const totalPrice = (item.price + addonTotal) * qty;
  const handleAdd = () => {
    const names = (item.addons || []).filter((_, i) => selectedAddons.includes(i)).map((a) => a.name);
    const fullName = names.length > 0 ? item.name + " (" + names.join(", ") + ")" : item.name;
    for (let i = 0; i < qty; i++) addItem({ productId: item.id, name: fullName, description: item.description, price: item.price + addonTotal, category: item.category.name, rating: item.rating, badge: item.badge });
    toast({ title: "Added to cart", description: qty + "x " + item.name });
    onClose();
  };
  return (
    <AnimatePresence>{isOpen && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000]" onClick={onClose} />
        <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed inset-x-0 bottom-0 z-[1001] max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl shadow-2xl">
          <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-4 border-b border-gray-100 rounded-t-3xl">
            <h2 className="font-bold text-lg text-gray-800">{item.name}</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors"><X className="w-4 h-4 text-gray-600" /></button>
          </div>
          <div className="p-5 space-y-5">
            <div className={"aspect-[16/9] rounded-2xl flex items-center justify-center text-7xl " + (item.category.name === "Wraps" ? "bg-gradient-to-br from-amber-50 to-orange-100" : item.category.name === "Shawarma" ? "bg-gradient-to-br from-red-50 to-orange-50" : item.category.name === "Mandi" ? "bg-gradient-to-br from-yellow-50 to-amber-100" : "bg-gradient-to-br from-orange-50 to-red-50")}>{getCategoryEmoji(item.category.name)}</div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1"><Star className="w-5 h-5 fill-[#d7b51a] text-[#d7b51a]" /><span className="font-semibold text-gray-700">{item.rating}</span></div>
              {item.badge && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">{item.badge}</span>}
              <span className="text-xs text-gray-400">|</span><span className="text-sm text-gray-500">{item.category.name}</span>
            </div>
            <p className="text-gray-600 leading-relaxed">{item.description}</p>
            {item.addons && item.addons.length > 0 && (
              <div>
                <h3 className="font-bold text-sm text-gray-800 mb-3">Add-ons</h3>
                <div className="space-y-2">
                  {item.addons.map((a, i) => (
                    <button key={i} onClick={() => toggleAddon(i)} className={"w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-200 cursor-pointer " + (selectedAddons.includes(i) ? "border-[#d7b51a] bg-amber-50" : "border-gray-100 hover:border-gray-200")}>
                      <div className="flex items-center gap-3"><div className={"w-5 h-5 rounded border-2 flex items-center justify-center transition-colors " + (selectedAddons.includes(i) ? "bg-[#d7b51a] border-[#d7b51a]" : "border-gray-300")}>{selectedAddons.includes(i) && <Check className="w-3 h-3 text-black" />}</div><span className="text-sm font-medium text-gray-700">{a.name}</span></div>
                      <span className="text-sm font-bold text-gray-800">+Rs. {a.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Price</p>
                  <p className="text-2xl font-extrabold text-gray-900">Rs. {totalPrice}</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-100 rounded-full p-1">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"><Minus className="w-4 h-4" /></button>
                  <span className="w-8 text-center font-bold text-lg">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
              <button onClick={handleAdd} className="w-full mt-4 py-3.5 bg-[#d7b51a] text-black font-bold text-base rounded-full hover:bg-[#c4a517] transition-colors duration-200 cursor-pointer flex items-center justify-center gap-2"><ShoppingCart className="w-5 h-5" />Add to Cart - Rs. {totalPrice}</button>
            </div>
          </div>
        </motion.div>
      </>
    )}</AnimatePresence>
  );
}

// ---- Cart Drawer ----
function CartDrawer({ onCheckout }: { onCheckout: () => void }) {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore();
  const { toast } = useToast();
  const total = getTotalPrice();
  const deliveryFee = total >= 1500 ? 0 : 150;
  const grandTotal = total + deliveryFee;
  return (
    <AnimatePresence>{isOpen && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]" onClick={closeCart} />
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.3, ease: "easeOut" }} className="fixed top-0 right-0 h-screen w-full sm:w-96 max-w-[100vw] sm:max-w-[400px] z-[9999] bg-white shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-gray-700" /><h2 className="font-bold text-lg text-gray-800">Your Cart</h2><span className="text-sm text-gray-400">({items.length} items)</span></div>
            <button onClick={closeCart} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors"><X className="w-4 h-4 text-gray-600" /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4"><ShoppingBag className="w-10 h-10 text-gray-300" /></div>
                <p className="text-gray-500 font-medium">Your cart is empty</p>
                <p className="text-gray-400 text-sm mt-1">Add some delicious items!</p>
                <button onClick={closeCart} className="mt-4 px-6 py-2 bg-[#d7b51a] text-black font-bold text-sm rounded-full hover:bg-[#c4a517] transition-colors cursor-pointer">Browse Menu</button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {items.map((item) => (
                  <motion.div key={item.productId} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-3 p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">{getCategoryEmoji(item.category)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                      <p className="text-sm font-bold text-gray-700 mt-0.5">Rs. {item.price * item.quantity}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-colors"><Minus className="w-3 h-3" /></button>
                        <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-6 h-6 rounded-full bg-[#d7b51a] hover:bg-[#c4a517] text-black flex items-center justify-center cursor-pointer transition-colors"><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                    <button onClick={() => { removeItem(item.productId); toast({ title: "Removed", description: item.name + " removed from cart" }); }} className="p-1.5 rounded-full hover:bg-red-50 cursor-pointer transition-colors flex-shrink-0" aria-label="Remove"><Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" /></button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          {items.length > 0 && (
            <div className="border-t border-gray-100 px-5 py-4 space-y-3 bg-white">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>Rs. {total}</span></div>
                <div className="flex justify-between text-gray-500"><span>Delivery Fee</span><span className={deliveryFee === 0 ? "text-green-600 font-semibold" : ""}>{deliveryFee === 0 ? "FREE" : "Rs. " + deliveryFee}</span></div>
                {deliveryFee > 0 && <p className="text-xs text-gray-400">Free delivery on orders above Rs. 1500</p>}
                <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-100"><span>Total</span><span>Rs. {grandTotal}</span></div>
              </div>
              <button onClick={onCheckout} className="w-full py-3.5 bg-[#d7b51a] text-black font-bold text-base rounded-full hover:bg-[#c4a517] transition-colors duration-200 cursor-pointer flex items-center justify-center gap-2">Proceed to Checkout</button>
              <button onClick={() => { clearCart(); toast({ title: "Cart cleared" }); }} className="w-full py-2 text-sm text-gray-500 hover:text-red-500 transition-colors cursor-pointer">Clear Cart</button>
            </div>
          )}
        </motion.div>
      </>
    )}</AnimatePresence>
  );
}

// ---- Checkout Modal ----
function CheckoutModal({ onClose, isOpen }: { onClose: () => void; isOpen: boolean }) {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmt, setDiscountAmt] = useState(0);
  const [discountError, setDiscountError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "", payment: "cod" as string });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const subtotal = getTotalPrice();
  const deliveryFee = subtotal >= 1500 ? 0 : 150;
  const grandTotal = subtotal - discountAmt + deliveryFee;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim() || form.phone.length < 10) e.phone = "Valid phone number required";
    if (!form.address.trim()) e.address = "Delivery address is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setDiscountError("");
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountCode, subtotal }),
      });
      const data = await res.json();
      if (data.success) {
        setDiscountAmt(data.data.discountAmount);
        toast({ title: "Discount applied!", description: data.data.title });
      } else {
        setDiscountError(data.error);
        setDiscountAmt(0);
      }
    } catch {
      setDiscountError("Failed to apply discount");
    }
  };

  const handleSubmit = () => { if (!validate()) return; setStep(1); };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name,
          customerPhone: form.phone,
          deliveryAddr: form.address,
          notes: form.notes,
          paymentMethod: form.payment,
          discountCode: discountCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        clearCart();
        setOrderNumber(data.data.orderNumber);
        setStep(2);
        toast({ title: "Order placed!", description: "Order " + data.data.orderNumber });
      } else {
        toast({ title: "Order failed", description: data.error });
      }
    } catch {
      toast({ title: "Error", description: "Failed to place order" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: string) => "w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-colors duration-200 bg-white " + (errors[field] ? "border-red-400 bg-red-50/50" : "border-gray-200 focus:border-[#d7b51a]");

  return (
    <AnimatePresence>{isOpen && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1002]" onClick={step === 2 ? onClose : undefined} />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg z-[1003] bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {step < 2 && (
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-lg text-gray-800">{step === 0 ? "Checkout" : "Order Summary"}</h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors"><X className="w-4 h-4 text-gray-600" /></button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            {step === 0 && (
              <div className="p-5 space-y-4">
                <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Full Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter your full name" className={inputClass("name")} />{errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}</div>
                <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Phone Number *</label><input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03XX-XXXXXXX" className={inputClass("phone")} />{errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}</div>
                <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Delivery Address *</label><textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="House/Flat #, Street, Sector, Islamabad" rows={3} className={inputClass("address") + " resize-none"} />{errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}</div>
                <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Special Instructions</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any special requests..." rows={2} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-[#d7b51a] transition-colors duration-200 bg-white resize-none" /></div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2.5 block">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setForm({ ...form, payment: "cod" })} className={"flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 cursor-pointer " + (form.payment === "cod" ? "border-[#d7b51a] bg-amber-50" : "border-gray-200 hover:border-gray-300")}>
                      <Banknote className={"w-5 h-5 " + (form.payment === "cod" ? "text-[#d7b51a]" : "text-gray-400")} /><span className={"text-sm font-medium " + (form.payment === "cod" ? "text-amber-800" : "text-gray-600")}>Cash on Delivery</span>
                    </button>
                    <button onClick={() => setForm({ ...form, payment: "card" })} className={"flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 cursor-pointer " + (form.payment === "card" ? "border-[#d7b51a] bg-amber-50" : "border-gray-200 hover:border-gray-300")}>
                      <CreditCard className={"w-5 h-5 " + (form.payment === "card" ? "text-[#d7b51a]" : "text-gray-400")} /><span className={"text-sm font-medium " + (form.payment === "card" ? "text-amber-800" : "text-gray-600")}>Card Payment</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Discount Code</label>
                  <div className="flex gap-2">
                    <input type="text" value={discountCode} onChange={(e) => setDiscountCode(e.target.value.toUpperCase())} placeholder="Enter code" className={"flex-1 px-4 py-3 rounded-xl border-2 text-sm outline-none transition-colors duration-200 bg-white border-gray-200 focus:border-[#d7b51a]"} />
                    <button onClick={handleApplyDiscount} className="px-4 py-3 bg-gray-800 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition-colors cursor-pointer">Apply</button>
                  </div>
                  {discountError && <p className="text-xs text-red-500 mt-1">{discountError}</p>}
                  {discountAmt > 0 && <p className="text-xs text-green-600 mt-1 font-medium">Rs. {discountAmt} discount applied!</p>}
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="p-5 space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{form.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium">{form.phone}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="font-medium text-right max-w-[60%]">{form.address}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="font-medium">{form.payment === "cod" ? "Cash on Delivery" : "Card"}</span></div>
                  {form.notes && <div className="flex justify-between"><span className="text-gray-500">Notes</span><span className="font-medium text-right max-w-[60%]">{form.notes}</span></div>}
                </div>
                <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                  <p className="font-semibold text-gray-700">Order Items:</p>
                  {items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-gray-600"><span>{item.quantity}x {item.name}</span><span>Rs. {item.price * item.quantity}</span></div>
                  ))}
                  <div className="border-t border-gray-100 pt-2 space-y-1">
                    <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>Rs. {subtotal}</span></div>
                    {discountAmt > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-Rs. {discountAmt}</span></div>}
                    <div className="flex justify-between text-gray-500"><span>Delivery</span><span className={deliveryFee === 0 ? "text-green-600 font-semibold" : ""}>{deliveryFee === 0 ? "FREE" : "Rs. " + deliveryFee}</span></div>
                    <div className="flex justify-between font-bold text-base text-gray-900 pt-1"><span>Total</span><span>Rs. {grandTotal}</span></div>
                  </div>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="flex flex-col items-center justify-center p-10 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5"><Check className="w-10 h-10 text-green-600" /></div>
                <h3 className="text-xl font-bold text-gray-800">Order Placed!</h3>
                {orderNumber && <p className="text-sm font-mono text-[#d7b51a] mt-1">{orderNumber}</p>}
                <p className="text-gray-500 mt-2 max-w-xs">Your order has been confirmed. You will receive a confirmation call shortly.</p>
                <p className="text-sm text-gray-400 mt-1">Estimated delivery: 30-45 minutes</p>
                <button onClick={onClose} className="mt-6 px-8 py-3 bg-[#d7b51a] text-black font-bold rounded-full hover:bg-[#c4a517] transition-colors cursor-pointer">Back to Menu</button>
              </div>
            )}
          </div>
          {step < 2 && (
            <div className="border-t border-gray-100 px-5 py-4 space-y-2">
              {step === 0 && (
                <>
                  <div className="flex justify-between text-sm text-gray-500"><span>Subtotal ({items.length} items)</span><span>Rs. {subtotal}</span></div>
                  {discountAmt > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-Rs. {discountAmt}</span></div>}
                  <div className="flex justify-between font-bold text-lg text-gray-900"><span>Total</span><span>Rs. {grandTotal}</span></div>
                  <button onClick={handleSubmit} className="w-full py-3.5 bg-[#d7b51a] text-black font-bold text-base rounded-full hover:bg-[#c4a517] transition-colors duration-200 cursor-pointer">Continue</button>
                </>
              )}
              {step === 1 && (
                <div className="flex gap-3">
                  <button onClick={() => setStep(0)} className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-bold text-sm rounded-full hover:bg-gray-50 transition-colors cursor-pointer">Back</button>
                  <button onClick={handleConfirm} disabled={isSubmitting} className="flex-1 py-3 bg-[#d7b51a] text-black font-bold text-sm rounded-full hover:bg-[#c4a517] transition-colors duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Place Order - Rs. {grandTotal}
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </>
    )}</AnimatePresence>
  );
}

// ---- Auth Modal ----
function AuthModal({ isOpen, onClose, user, onUserChange }: { isOpen: boolean; onClose: () => void; user: AuthUser | null; onUserChange: (u: AuthUser | null) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, phone: form.phone, password: form.password };
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) {
        onUserChange(data.data);
        toast({ title: isLogin ? "Welcome back!" : "Account created!", description: data.data.name });
        onClose();
      } else {
        setError(data.error);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      onUserChange(null);
      toast({ title: "Logged out" });
      onClose();
    } catch { /* ignore */ }
  };

  return (
    <AnimatePresence>{isOpen && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1004]" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-[1005] bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-lg text-gray-800">{user ? "Account" : isLogin ? "Login" : "Create Account"}</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors"><X className="w-4 h-4 text-gray-600" /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {user ? (
              <div className="p-6 space-y-4">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-[#d7b51a]/10 rounded-full flex items-center justify-center mb-3"><User className="w-8 h-8 text-[#d7b51a]" /></div>
                  <h3 className="font-bold text-lg">{user.name}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
                </div>
                <button onClick={handleLogout} className="w-full py-3 border-2 border-red-200 text-red-600 font-bold text-sm rounded-full hover:bg-red-50 transition-colors cursor-pointer flex items-center justify-center gap-2"><LogIn className="w-4 h-4" />Logout</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}
                {!isLogin && <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Full Name</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-[#d7b51a] transition-colors bg-white" /></div>}
                <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-[#d7b51a] transition-colors bg-white" /></div>
                {!isLogin && <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Phone (optional)</label><input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03XX-XXXXXXX" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-[#d7b51a] transition-colors bg-white" /></div>}
                <div><label className="text-sm font-semibold text-gray-700 mb-1.5 block">Password</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={isLogin ? "Your password" : "Min 6 characters"} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-[#d7b51a] transition-colors bg-white" /></div>
                <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-[#d7b51a] text-black font-bold text-base rounded-full hover:bg-[#c4a517] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                  {isLogin ? "Login" : "Create Account"}
                </button>
                <p className="text-center text-sm text-gray-500">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button type="button" onClick={() => { setIsLogin(!isLogin); setError(""); }} className="text-[#d7b51a] font-semibold hover:underline cursor-pointer">{isLogin ? "Sign Up" : "Login"}</button>
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </>
    )}</AnimatePresence>
  );
}

// ---- Menu Section ----
function MenuSection({ products, activeCategory, searchQuery, onOpenDetail, onQuickAdd, onSearchChange, isLoading }: {
  products: Product[]; activeCategory: string; searchQuery: string; onOpenDetail: (item: Product) => void; onQuickAdd: (item: Product) => void; onSearchChange: (v: string) => void; isLoading: boolean;
}) {
  const filtered = useMemo(() => {
    let items = products;
    if (activeCategory !== "All") items = items.filter((i) => i.category.name === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.category.name.toLowerCase().includes(q));
    }
    return items;
  }, [products, activeCategory, searchQuery]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <div className="sm:hidden mb-4">
        <SearchBar value={searchQuery} onChange={onSearchChange} onFocus={() => {}} isFocused={false} />
      </div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{activeCategory === "All" ? (searchQuery ? "Search Results" : "Our Menu") : activeCategory}</h2>
        <span className="text-sm text-gray-500">{filtered.length} items</span>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-4 space-y-3"><div className="h-4 bg-gray-200 rounded w-3/4" /><div className="h-3 bg-gray-200 rounded w-full" /><div className="h-4 bg-gray-200 rounded w-1/3" /></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-gray-500 text-lg font-medium">No items found</p>
          <p className="text-gray-400 text-sm mt-1">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((item) => <MenuItemCard key={item.id} item={item} onOpenDetail={onOpenDetail} onQuickAdd={onQuickAdd} />)}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

// ---- Footer ----
function Footer() {
  const [showMore, setShowMore] = useState(false);
  return (
    <footer className="w-full">
      <div className="text-white" style={{ background: "#2e2e2e" }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-10 sm:py-14 lg:py-16">
          <div className="flex justify-center mb-10 sm:mb-12"><WrapLabLogo className="scale-110" /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12 items-start justify-items-center lg:justify-items-stretch w-full">
            <div className="flex flex-col items-center text-center w-full max-w-lg mx-auto lg:max-w-none lg:mx-0 lg:items-start lg:text-left">
              <div className="w-full">
                <div className="space-y-3 text-sm sm:text-base leading-relaxed">
                  <h1 className="text-lg sm:text-xl font-bold text-white">Get the Best of Wrap Lab Delivered to Your Door in Islamabad</h1>
                  <p className="text-gray-300">Welcome to Wrap Lab in Islamabad where we offer authentic Arabic-style dishes. Try our wide range of mouth-watering Wraps, Shawarma, Mandi, Madbi, and more. Whether you are looking for a quick lunch or a satisfying dinner, Wrap Lab has you covered.</p>
                </div>
                {showMore && <p className="mt-3 text-sm sm:text-base text-gray-300 leading-relaxed">At Wrap Lab, we take pride in using only the freshest ingredients and traditional recipes passed down through generations. Our chefs bring years of culinary expertise to every dish, ensuring an authentic dining experience.</p>}
                <button onClick={() => setShowMore(!showMore)} className="mt-2 text-sm font-medium transition-colors duration-300 cursor-pointer text-gray-300 hover:opacity-80">
                  <span className="inline-flex items-center gap-1">{showMore ? "Show Less" : "Show More"}{showMore ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
                </button>
              </div>
            </div>
            <div className="flex flex-col items-center text-center w-full max-w-lg mx-auto lg:max-w-none lg:mx-0">
              <h2 className="text-white font-bold text-lg sm:text-xl mb-4">Follow Us</h2>
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-6">
                {[
                  { href: "https://www.facebook.com/wraplabpk/", icon: <Facebook className="w-5 h-5 text-white" />, label: "Facebook" },
                  { href: "https://www.instagram.com/wraplab.pk/?hl=en", icon: <Instagram className="w-5 h-5 text-white" />, label: "Instagram" },
                  { href: "https://www.linkedin.com/company/wraplab-islamabad", icon: <Linkedin className="w-5 h-5 text-white" />, label: "LinkedIn" },
                  { href: "https://www.youtube.com/@wraplabisb", icon: <Youtube className="w-5 h-5 text-white" />, label: "YouTube" },
                  { href: "https://www.tiktok.com/@wraplab.pk", icon: <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15z"/></svg>, label: "TikTok" },
                ].map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity bg-white/10 hover:bg-white/20">{s.icon}</a>
                ))}
              </div>
              <div className="mt-2">
                <h3 className="text-white font-bold text-xs sm:text-sm uppercase tracking-wider mb-3">Download Our App</h3>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <a href="https://apps.apple.com/pk/app/wrap-lab/id1668736276" target="_blank" rel="noopener noreferrer" className="transition-transform hover:-translate-y-0.5 duration-200">
                    <div className="bg-white rounded-lg px-4 py-2 flex items-center gap-2"><div className="text-xl">🍎</div><div className="text-left"><div className="text-[8px] leading-none text-gray-500">Download on the</div><div className="text-sm font-semibold leading-tight">App Store</div></div></div>
                  </a>
                  <a href="https://play.google.com/store/apps/details?id=com.blink.wraplab&hl=en" target="_blank" rel="noopener noreferrer" className="transition-transform hover:-translate-y-0.5 duration-200">
                    <div className="bg-white rounded-lg px-4 py-2 flex items-center gap-2"><div className="text-xl">▶️</div><div className="text-left"><div className="text-[8px] leading-none text-gray-500">GET IT ON</div><div className="text-sm font-semibold leading-tight">Google Play</div></div></div>
                  </a>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center text-center w-full max-w-lg mx-auto lg:max-w-none lg:mx-0 lg:items-start lg:text-left">
              <h2 className="text-white font-bold text-lg sm:text-xl mb-4 text-center lg:text-left">Contact Us</h2>
              <div className="space-y-2 sm:space-y-3 text-sm sm:text-base w-full">
                <div className="flex items-center justify-center gap-2 flex-wrap lg:justify-start"><span className="font-bold text-white shrink-0">Phone:</span><a href="tel:03155008056" className="text-white hover:opacity-80 transition-colors">03155008056</a></div>
                <div className="flex items-center justify-center gap-2 flex-wrap lg:justify-start"><span className="font-bold text-white shrink-0">Email:</span><a href="mailto:wraplab.pk@gmail.com" className="text-white hover:opacity-80 transition-colors break-all">wraplab.pk@gmail.com</a></div>
                <div className="flex flex-col items-center gap-1 sm:flex-row sm:items-start sm:gap-2 justify-center lg:flex-row lg:justify-start">
                  <span className="font-bold text-white shrink-0">Address:</span>
                  <a href="https://www.google.com/maps?q=33.667787207028,73.07441314907656" target="_blank" rel="noopener noreferrer" className="text-white leading-relaxed">Ground Floor, Pakland Vista, I-8 Markaz, Islamabad</a>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-5 lg:justify-start">
                {["Privacy Policy", "Faqs", "Our Locations"].map((t) => (
                  <a key={t} className="text-white text-sm sm:text-base underline underline-offset-2 decoration-white/40 hover:opacity-80 transition-colors" href="#">{t}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/25">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-5 sm:py-6">
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] sm:text-sm text-white">
              <span className="flex items-center gap-1.5"><span className="font-bold">© 2026 Powered by</span><span className="font-bold text-[#d7b51a]">Indolj</span></span>
              <span className="mx-0.5 opacity-60">|</span>
              <a className="underline transition-colors hover:opacity-80" href="#">Privacy Policy</a>
              <span className="mx-0.5 opacity-60">|</span>
              <a className="underline transition-colors hover:opacity-80" href="#">Faqs</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
// ---- Side Menu ----
function SideMenu({ isOpen, onClose, user, onAuthClick }: { isOpen: boolean; onClose: () => void; user: AuthUser | null; onAuthClick: () => void }) {
  const cartCount = useCartStore((s) => s.getTotalItems());
  return (
    <AnimatePresence>{isOpen && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]" onClick={onClose} />
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.3, ease: "easeOut" }} className="fixed top-0 right-0 h-screen w-72 max-w-[80vw] z-[9999] overflow-hidden bg-[#fafafa] shadow-2xl">
          <div className="relative flex items-center justify-between px-3.5 py-3.5 border-b border-gray-200">
            <span className="font-semibold text-sm text-gray-800">Wrap Lab</span>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full cursor-pointer transition-all duration-200"><X className="w-4 h-4 text-gray-600" /></button>
          </div>
          <div className="py-3 overflow-y-auto">
            <button onClick={() => { onAuthClick(); onClose(); }} className="flex items-center gap-3 mx-2.5 mb-1.5 px-3.5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 hover:scale-[1.01] hover:shadow-sm w-full">
              <User className="w-[18px] h-[18px] text-gray-500" /><span className="font-medium text-sm flex-1 text-left">{user ? user.name : "Login / Sign Up"}</span>
            </button>
            {[
              { icon: <MapPin className="w-[18px] h-[18px] text-gray-500" />, label: "Our Locations", href: "#" },
              { icon: <Phone className="w-[18px] h-[18px] text-gray-500" />, label: "Call Us", href: "tel:03127777067" },
              { icon: <ShoppingCart className="w-[18px] h-[18px] text-gray-500" />, label: "Cart (" + cartCount + ")", href: "#" },
            ].map((item) => (
              <a key={item.label} href={item.href} onClick={onClose} className="flex items-center gap-3 mx-2.5 mb-1.5 px-3.5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 hover:scale-[1.01] hover:shadow-sm">
                {item.icon}<span className="font-medium text-sm flex-1">{item.label}</span>
              </a>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 px-3 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500"><span className="font-medium">Powered By</span><span className="font-bold text-[#d7b51a]">Indolj</span></div>
          </div>
        </motion.div>
      </>
    )}</AnimatePresence>
  );
}

// ---- WhatsApp Button ----
function WhatsAppButton() {
  return (
    <a href="https://wa.me/923127777067" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 left-[10%] sm:left-[10%] z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 hover:scale-110 transition-all duration-300" aria-label="Chat on WhatsApp">
      <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    </a>
  );
}

// ============ MAIN PAGE ============
export default function HomePage() {
  const [showAppBanner, setShowAppBanner] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchValue, setSearchValue] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [detailItem, setDetailItem] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Data from backend
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const { openCart, closeCart, openCheckout, closeCheckout, addItem, setItems } = useCartStore();
  const { toast } = useToast();

  // ---- Data fetching ----
  useEffect(() => {
    async function loadData() {
      setDataLoading(true);
      try {
        const [catRes, prodRes, offerRes, userRes] = await Promise.all([
          fetch("/api/categories").then((r) => r.json()),
          fetch("/api/products").then((r) => r.json()),
          fetch("/api/offers").then((r) => r.json()),
          fetch("/api/auth/me").then((r) => r.json()).catch(() => ({ success: false })),
        ]);
        if (catRes.success) setCategories(catRes.data);
        if (prodRes.success) setProducts(prodRes.data);
        if (offerRes.success) setOffers(offerRes.data);
        if (userRes.success) setUser(userRes.data);
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setDataLoading(false);
      }
    }
    loadData();
  }, []);

  // Sync cart with backend on mount
  useEffect(() => {
    fetch("/api/cart")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data.items) {
          setItems(
            data.data.items.map((ci: { id: number; productId: number; quantity: number; product: { name: string; description: string; price: number; badge: string | null; rating: number; category: { name: string } } }) => ({
              id: ci.id,
              productId: ci.productId,
              name: ci.product.name,
              description: ci.product.description,
              price: ci.product.price,
              category: ci.product.category.name,
              rating: ci.product.rating,
              badge: ci.product.badge,
              quantity: ci.quantity,
            }))
          );
        }
      })
      .catch(() => { /* guest cart empty */ });
  }, [setItems]);

  const handleQuickAdd = useCallback((item: Product) => {
    addItem({ productId: item.id, name: item.name, description: item.description, price: item.price, category: item.category.name, rating: item.rating, badge: item.badge });
    toast({ title: "Added to cart", description: item.name + " - Rs. " + item.price });
    // Sync to backend
    fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: item.id, quantity: 1 }) }).catch(() => {});
  }, [addItem, toast]);

  const [detailKey, setDetailKey] = useState(0);
  const handleOpenDetail = useCallback((item: Product) => {
    setDetailItem(item);
    setDetailKey((k) => k + 1);
    setDetailOpen(true);
  }, []);

  const handleOfferClick = useCallback((code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    toast({ title: "Offer code copied!", description: code + " - Apply at checkout" });
  }, [toast]);

  const handleBannerCta = useCallback((cta: string) => {
    if (cta === "View Deals") setActiveCategory("Deals");
    else setActiveCategory("All");
    window.scrollTo({ top: 600, behavior: "smooth" });
  }, []);

  const [checkoutKey, setCheckoutKey] = useState(0);
  const handleOpenCheckout = useCallback(() => { setCheckoutKey((k) => k + 1); openCheckout(); }, [openCheckout]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AnimatePresence>{showAppBanner && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}><AppDownloadBanner onClose={() => setShowAppBanner(false)} /></motion.div>}</AnimatePresence>
      <div className="w-full relative z-[10]">
        <Navbar onMenuToggle={() => setMenuOpen(true)} onCartToggle={openCart} searchValue={searchValue} onSearchChange={setSearchValue} searchFocused={searchFocused} onSearchFocus={() => setSearchFocused(true)} user={user} onAuthClick={() => setAuthOpen(true)} />
      </div>
      <main className="flex-1">
        <HeroBanner onCtaClick={handleBannerCta} />
        <OffersSection offers={offers} onOfferClick={handleOfferClick} />
        <CategoryNav categories={categories} activeCategory={activeCategory} onSelect={(cat) => { setActiveCategory(cat); setSearchValue(""); }} />
        <MenuSection products={products} activeCategory={activeCategory} searchQuery={searchValue} onOpenDetail={handleOpenDetail} onQuickAdd={handleQuickAdd} onSearchChange={setSearchValue} isLoading={dataLoading} />
      </main>
      <Footer />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} user={user} onAuthClick={() => setAuthOpen(true)} />
      <CartDrawer onCheckout={handleOpenCheckout} />
      <CheckoutModal key={checkoutKey} onClose={closeCheckout} isOpen={useCartStore((s) => s.checkoutOpen)} />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} user={user} onUserChange={setUser} />
      <ProductDetailModal key={detailKey} item={detailItem} onClose={() => setDetailOpen(false)} isOpen={detailOpen} />
      <WhatsAppButton />
    </div>
  );
}