"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";

export default function BundleModal({ tiers, onClose, onSelectTier }) {
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h2>Paket Bundling</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Tutup">
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 20 }}>
            Beli beberapa preset sekaligus dengan harga jauh lebih hemat.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tiers.map((tier) => {
              const price = typeof tier.price === "number" ? tier.price : Number(tier.price) || 0;
              const origPrice = typeof tier.originalPrice === "number" ? tier.originalPrice : Number(tier.originalPrice) || 0;
              return (
                <div
                  key={tier.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "16px 20px",
                    border: `1px solid ${tier.popular || tier.bestValue ? "var(--accent)" : "var(--border-2)"}`,
                    borderRadius: "var(--radius)",
                    background: tier.bestValue ? "linear-gradient(135deg, #1e1b4b 0%, #15181e 100%)" : "var(--bg-2)",
                    color: "var(--text)",
                    cursor: "pointer",
                    transition: "all var(--transition)",
                    position: "relative",
                  }}
                  onClick={() => onSelectTier(tier)}
                >
                  {(tier.popular || tier.bestValue) && (
                    <span style={{
                      position: "absolute",
                      top: -10,
                      left: 16,
                      background: tier.bestValue ? "var(--bg)" : "var(--accent)",
                      color: tier.bestValue ? "var(--text)" : "white",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 4,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                      {tier.bestValue ? "Terbaik" : "Terlaris"}
                    </span>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{tier.name}</div>
                    <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>{tier.description}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>Rp {price.toLocaleString("id-ID")}</div>
                    <div style={{ fontSize: 12, textDecoration: "line-through", opacity: 0.5 }}>
                      Rp {origPrice.toLocaleString("id-ID")}
                    </div>
                    <div style={{ fontSize: 11, color: tier.bestValue ? "#86efac" : "var(--success)", fontWeight: 700 }}>
                      {tier.discountBadge}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
