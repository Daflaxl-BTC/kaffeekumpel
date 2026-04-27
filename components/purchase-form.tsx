"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addPurchase } from "@/app/g/[slug]/actions";

interface Props {
  slug: string;
  products: { id: string; name: string }[];
  currency: string;
}

export function PurchaseForm({ slug, products, currency }: Props) {
  const [pending, startTransition] = useTransition();
  const [productName, setProductName] = useState(products[0]?.name ?? "");
  const [customProduct, setCustomProduct] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalProduct = customProduct.trim() || productName.trim();
    if (!finalProduct) return toast.error("Produkt fehlt");
    const amt = parseFloat(amount.replace(",", "."));
    if (!Number.isFinite(amt) || amt <= 0)
      return toast.error("Betrag ungültig");

    const fd = new FormData();
    fd.set("slug", slug);
    fd.set("productName", finalProduct);
    fd.set("amountEuro", amt.toString());
    if (note.trim()) fd.set("note", note.trim());

    startTransition(async () => {
      try {
        await addPurchase(fd);
        toast.success(`${finalProduct} (${amt.toFixed(2)} ${currency}) gebucht`);
        setCustomProduct("");
        setAmount("");
        setNote("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Fehler");
      }
    });
  };

  return (
    <form
      onSubmit={submit}
      className="grid gap-2 bg-white/80 rounded-2xl p-4 border border-kaffee-100"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <select
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          disabled={customProduct.length > 0}
          className="w-full min-w-0 rounded-xl border border-kaffee-100 bg-white px-3 py-2 text-sm disabled:opacity-50"
        >
          {products.length === 0 && <option value="">— noch keins —</option>}
          {products.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={customProduct}
          onChange={(e) => setCustomProduct(e.target.value)}
          placeholder="oder neu: z.B. Bohnen"
          maxLength={60}
          className="w-full min-w-0 rounded-xl border border-kaffee-100 bg-white px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-[1fr_2fr] gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="12,99"
          className="col-span-1 w-full min-w-0 rounded-xl border border-kaffee-100 bg-white px-3 py-2 text-sm"
        />
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Notiz (optional)"
          maxLength={200}
          className="col-span-2 sm:col-span-1 w-full min-w-0 rounded-xl border border-kaffee-100 bg-white px-3 py-2 text-sm"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending} className="w-full">
        {pending ? "…" : "+ Eintragen"}
      </Button>
    </form>
  );
}
