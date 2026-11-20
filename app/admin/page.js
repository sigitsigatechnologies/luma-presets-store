"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import styles from "./page.module.css";
import BulkUploadModal from "../components/BulkUploadModal";

const API = "";

export default function AdminPage() {
  const [auth, setAuth] = useState(null); // null=loading, false=unauth, {token}=auth
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => {
          if (d.authenticated) setAuth({ token });
          else { localStorage.removeItem("admin_token"); setAuth(false); }
        })
        .catch(() => setAuth(false));
    } else {
      setAuth(false);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) { setLoginError(data.error || "Login gagal"); return; }
      localStorage.setItem("admin_token", data.token);
      setAuth({ token: data.token });
    } catch {
      setLoginError("Tidak bisa terhubung ke server.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    const token = auth?.token;
    if (token) {
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem("admin_token");
    setAuth(false);
  };

  if (auth === null) {
    return (
      <div className={styles.loadingPage}>
        <span className="spinner spinner-dark" />
      </div>
    );
  }

  if (!auth) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <h1 className={styles.loginTitle}>LUMA Admin</h1>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-group">
              <label>Username</label>
              <input
                className="form-control"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                placeholder="admin"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            {loginError && <div className="alert alert-error">{loginError}</div>}
            <button type="submit" className="btn btn-primary" disabled={loginLoading}>
              {loginLoading ? <span className="spinner" /> : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <AdminDashboard token={auth.token} onLogout={handleLogout} />;
}

function AdminDashboard({ token, onLogout }) {
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [notification, setNotification] = useState(null);

  // Filters for Products
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("All");
  const [productStatusFilter, setProductStatusFilter] = useState("All");

  // Filters for Orders
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");

  // Manual Code Generation State
  const [showCodeGen, setShowCodeGen] = useState(false);
  const [codeGenProduct, setCodeGenProduct] = useState("");
  const [generatedCodeResult, setGeneratedCodeResult] = useState(null);
  const [codeGenLoading, setCodeGenLoading] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/products`, { headers });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/admin/orders`, { headers });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadProducts(), loadOrders()]).finally(() => setLoading(false));
  }, [loadProducts, loadOrders]);

  const deleteProduct = async (id, name) => {
    if (!confirm(`Hapus preset "${name}"?`)) return;
    try {
      const res = await fetch(`${API}/api/products/${id}`, { method: "DELETE", headers });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { notify(`Preset "${name}" berhasil dihapus`); loadProducts(); }
      else notify(data.error || "Gagal menghapus", "error");
    } catch {
      notify("Gagal menghapus", "error");
    }
  };

  const toggleProductStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API}/api/products/${id}/toggle`, { method: "POST", headers });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        notify("Status produk berhasil diperbarui");
        loadProducts();
      } else {
        notify(data.error || "Gagal mengubah status", "error");
      }
    } catch {
      notify("Gagal mengubah status", "error");
    }
  };

  const markOrderPaid = async (orderId) => {
    if (!confirm(`Tandai pesanan ${orderId} sebagai LUNAS? Kode akses akan dibuat dan pesan WhatsApp akan dikirim ke pembeli.`)) return;
    try {
      const res = await fetch(`${API}/api/admin/orders/${orderId}/mark-paid`, { method: "POST", headers });
      const data = await res.json();
      if (res.ok) {
        notify(`Pesanan ${orderId} berhasil ditandai LUNAS! (Kode: ${data.accessCode})`);
        loadOrders();
      } else {
        notify(data.error || "Gagal memproses", "error");
      }
    } catch {
      notify("Gagal memproses pesanan", "error");
    }
  };

  const resendWhatsApp = async (orderId) => {
    try {
      const res = await fetch(`${API}/api/admin/orders/${orderId}/resend-whatsapp`, { method: "POST", headers });
      const data = await res.json();
      if (res.ok) {
        notify(`Pesan WhatsApp berhasil dikirim ulang ke ${data.phone}`);
      } else {
        notify(data.error || "Gagal mengirim WhatsApp", "error");
      }
    } catch {
      notify("Gagal mengirim WhatsApp", "error");
    }
  };

  const handleGenerateManualCode = async (e) => {
    e.preventDefault();
    if (!codeGenProduct) return;
    setCodeGenLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ productId: codeGenProduct }),
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedCodeResult(data);
        notify("Kode akses berhasil dibuat!");
      } else {
        notify(data.error || "Gagal membuat kode", "error");
      }
    } catch {
      notify("Gagal membuat kode", "error");
    } finally {
      setCodeGenLoading(false);
    }
  };

  // Categories list for filter
  const categoriesList = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category.trim());
    });
    return Array.from(set);
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = productCategoryFilter === "All" || p.category === productCategoryFilter;
      const matchStatus =
        productStatusFilter === "All" ||
        (productStatusFilter === "Active" ? p.available : !p.available);
      const query = productSearch.trim().toLowerCase();
      const matchQuery =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.code.toLowerCase().includes(query) ||
        (p.subtitle && p.subtitle.toLowerCase().includes(query));
      return matchCat && matchStatus && matchQuery;
    });
  }, [products, productCategoryFilter, productStatusFilter, productSearch]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = orderStatusFilter === "All" || o.status === orderStatusFilter;
      const query = orderSearch.trim().toLowerCase();
      const matchQuery =
        !query ||
        o.id.toLowerCase().includes(query) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(query)) ||
        (o.customer_phone && o.customer_phone.includes(query)) ||
        (o.customer_email && o.customer_email.toLowerCase().includes(query)) ||
        (o.access_code && o.access_code.toLowerCase().includes(query));
      return matchStatus && matchQuery;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const paidCount = orders.filter((o) => o.status === "PAID").length;
  const revenue = orders.filter((o) => o.status === "PAID").reduce((s, o) => s + (Number(o.amount) || 0), 0);

  return (
    <div className={styles.dashboardPage}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <span>LUMA</span>
          <span style={{ fontSize: 11, background: "var(--accent-glow)", color: "#818cf8", padding: "2px 6px", borderRadius: 4 }}>
            Control Hub
          </span>
        </div>
        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.sidebarItem} ${tab === "products" ? styles.sidebarItemActive : ""}`}
            onClick={() => setTab("products")}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            Kelola Preset
            <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}>{products.length}</span>
          </button>
          <button
            className={`${styles.sidebarItem} ${tab === "orders" ? styles.sidebarItemActive : ""}`}
            onClick={() => setTab("orders")}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            Transaksi
            {pendingCount > 0 && <span className={styles.badge}>{pendingCount}</span>}
          </button>
          <button
            className={`${styles.sidebarItem} ${tab === "codes" ? styles.sidebarItemActive : ""}`}
            onClick={() => setTab("codes")}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            Generate Kode
          </button>
          <button
            className={`${styles.sidebarItem} ${tab === "stats" ? styles.sidebarItemActive : ""}`}
            onClick={() => setTab("stats")}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Statistik Toko
          </button>
        </nav>
        <div className={styles.sidebarFooter}>
          <a href="/" target="_blank" className={styles.sidebarItem}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            Buka Storefront ↗
          </a>
          <button className={styles.sidebarItem} onClick={onLogout}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.dashboardMain}>
        {notification && (
          <div className={`${styles.toast} ${notification.type === "error" ? styles.toastError : styles.toastSuccess}`}>
            {notification.msg}
          </div>
        )}

        {loading ? (
          <div className={styles.loadingMain}><span className="spinner spinner-dark" /></div>
        ) : (
          <>
            {/* KPI Stats Row */}
            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Total Preset Aktif</div>
                <div className={styles.statValue}>
                  {products.filter(p => p.available).length} <span style={{ fontSize: 14, color: "var(--text-3)", fontWeight: 400 }}>/ {products.length}</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Total Pesanan</div>
                <div className={styles.statValue}>{orders.length}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Pesanan Lunas</div>
                <div className={styles.statValue} style={{ color: "var(--success)" }}>{paidCount}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Total Pendapatan</div>
                <div className={styles.statValue}>Rp {revenue.toLocaleString("id-ID")}</div>
              </div>
            </div>

            {/* TAB: PRODUCTS */}
            {tab === "products" && (
              <div>
                <div className={styles.tabHeader}>
                  <div>
                    <h2>Manajemen Preset ({products.length})</h2>
                    <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 2 }}>
                      Menampilkan {filteredProducts.length} preset dari filter saat ini
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button className="btn btn-outline" onClick={() => setShowBulkUpload(true)}>
                      Bulk Upload
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowAddProduct(true)}>
                      + Tambah Preset Baru
                    </button>
                  </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div className={styles.toolbar}>
                  <div className={styles.searchBox}>
                    <input
                      className="form-control"
                      placeholder="Cari nama, kode, atau deskripsi preset..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>
                  <select
                    className={styles.filterSelect}
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                  >
                    <option value="All">Semua Kategori</option>
                    {categoriesList.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <select
                    className={styles.filterSelect}
                    value={productStatusFilter}
                    onChange={(e) => setProductStatusFilter(e.target.value)}
                  >
                    <option value="All">Semua Status</option>
                    <option value="Active">Aktif di Toko</option>
                    <option value="Inactive">Non-aktif / Draft</option>
                  </select>
                </div>

                <div className="card">
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: 60 }}>Cover</th>
                          <th>Nama & Subtitle</th>
                          <th>Kode</th>
                          <th>Kategori</th>
                          <th>Harga</th>
                          <th>Status</th>
                          <th>File (.zip/.xmp)</th>
                          <th style={{ textAlign: "right" }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ textAlign: "center", color: "var(--text-3)", padding: "40px" }}>
                              Tidak ada produk yang sesuai dengan filter pencarian.
                            </td>
                          </tr>
                        ) : filteredProducts.map((p) => (
                          <tr key={p.id}>
                            <td>
                              {p.image ? (
                                <img src={p.image} alt={p.name} className={styles.tableImg} />
                              ) : (
                                <div className={styles.tableImg} style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--text-3)" }}>
                                  No Img
                                </div>
                              )}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: "var(--text)" }}>{p.name}</div>
                              {p.subtitle && <div style={{ fontSize: 12, color: "var(--text-3)" }}>{p.subtitle}</div>}
                            </td>
                            <td><code style={{ fontSize: 12, padding: "2px 6px", background: "var(--bg-3)", borderRadius: 4 }}>{p.code}</code></td>
                            <td><span className="badge badge-gray">{p.category}</span></td>
                            <td style={{ fontWeight: 600 }}>Rp {(Number(p.price) || 0).toLocaleString("id-ID")}</td>
                            <td>
                              <button
                                type="button"
                                onClick={() => toggleProductStatus(p.id, p.available)}
                                title="Klik untuk mengubah status"
                                className={`badge ${p.available ? "badge-green" : "badge-gray"}`}
                                style={{ cursor: "pointer", border: "1px dashed" }}
                              >
                                {p.available ? "✓ Aktif" : "✕ Non-aktif"}
                              </button>
                            </td>
                            <td>
                              <span className={`badge ${p.hasFile ? "badge-green" : "badge-yellow"}`}>
                                {p.hasFile ? "Tersedia" : "Belum ada"}
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <div className={styles.actionBtnGroup} style={{ justifyContent: "flex-end" }}>
                                <button className="btn btn-outline btn-sm" onClick={() => setEditProduct(p)}>
                                  Edit
                                </button>
                                <button
                                  className="btn btn-sm"
                                  style={{ color: "var(--error)", background: "rgba(239,68,68,0.1)" }}
                                  onClick={() => deleteProduct(p.id, p.name)}
                                >
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ORDERS */}
            {tab === "orders" && (
              <div>
                <div className={styles.tabHeader}>
                  <div>
                    <h2>Daftar Transaksi ({orders.length})</h2>
                    <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 2 }}>
                      Menampilkan {filteredOrders.length} transaksi
                    </p>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={loadOrders}>
                    ↻ Refresh Transaksi
                  </button>
                </div>

                {/* Search & Filter Toolbar */}
                <div className={styles.toolbar}>
                  <div className={styles.searchBox}>
                    <input
                      className="form-control"
                      placeholder="Cari ID pesanan, nama, nomor WA, atau kode akses..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                    />
                  </div>
                  <select
                    className={styles.filterSelect}
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                  >
                    <option value="All">Semua Status</option>
                    <option value="PAID">LUNAS (Paid)</option>
                    <option value="PENDING">PENDING</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>

                <div className="card">
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>ID Pesanan</th>
                          <th>Pelanggan & WhatsApp</th>
                          <th>Item Pembelian</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th>Kode Akses</th>
                          <th>Tanggal</th>
                          <th style={{ textAlign: "right" }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ textAlign: "center", color: "var(--text-3)", padding: "40px" }}>
                              Tidak ada transaksi yang cocok.
                            </td>
                          </tr>
                        ) : filteredOrders.map((o) => (
                          <tr key={o.id}>
                            <td>
                              <code style={{ fontSize: 12, fontWeight: 700 }}>{o.id}</code>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{o.customer_name}</div>
                              <div style={{ fontSize: 12, color: "var(--text-2)" }}>{o.customer_phone}</div>
                              {o.customer_email && <div style={{ fontSize: 11, color: "var(--text-3)" }}>{o.customer_email}</div>}
                            </td>
                            <td>
                              <div style={{ fontWeight: 500 }}>{o.products?.name || o.product_id}</div>
                              {o.bundle_items && (
                                <span className="badge badge-accent" style={{ marginTop: 2 }}>Paket Bundle</span>
                              )}
                            </td>
                            <td style={{ fontWeight: 700 }}>Rp {(Number(o.amount) || 0).toLocaleString("id-ID")}</td>
                            <td>
                              <span className={`badge ${
                                o.status === "PAID" ? "badge-green" :
                                o.status === "PENDING" ? "badge-yellow" : "badge-red"
                              }`}>
                                {o.status === "PAID" ? "✓ LUNAS" : o.status}
                              </span>
                            </td>
                            <td>
                              {o.access_code ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <code style={{ fontSize: 12, fontWeight: 700, color: "var(--success)" }}>{o.access_code}</code>
                                  <button
                                    className="btn btn-outline btn-sm"
                                    style={{ padding: "2px 6px", fontSize: 11 }}
                                    onClick={() => {
                                      navigator.clipboard.writeText(o.access_code);
                                      notify(`Kode ${o.access_code} disalin ke clipboard!`);
                                    }}
                                  >
                                    Salin
                                  </button>
                                </div>
                              ) : "—"}
                            </td>
                            <td style={{ fontSize: 12, color: "var(--text-3)" }}>
                              {o.created_at ? new Date(o.created_at).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—"}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <div className={styles.actionBtnGroup} style={{ justifyContent: "flex-end" }}>
                                {o.status !== "PAID" && (
                                  <button
                                    className="btn btn-primary btn-sm"
                                    style={{ background: "var(--success)", borderColor: "var(--success)" }}
                                    onClick={() => markOrderPaid(o.id)}
                                  >
                                    Tandai Lunas
                                  </button>
                                )}
                                {o.status === "PAID" && (
                                  <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => resendWhatsApp(o.id)}
                                    title="Kirim ulang detail unduhan ke WhatsApp pembeli"
                                  >
                                    Kirim Ulang WA
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MANUAL CODE GENERATOR */}
            {tab === "codes" && (
              <div style={{ maxWidth: 640 }}>
                <div className={styles.tabHeader}>
                  <div>
                    <h2>Generate Kode Akses Manual</h2>
                    <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 2 }}>
                      Buat kode akses VIP atau giveaway untuk pembeli manual tanpa melalui pembayaran Midtrans.
                    </p>
                  </div>
                </div>

                <div className="card" style={{ padding: "24px" }}>
                  <form onSubmit={handleGenerateManualCode} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="form-group">
                      <label>Pilih Preset / Bundle untuk Diberikan Akses</label>
                      <select
                        className="form-control"
                        value={codeGenProduct}
                        onChange={(e) => setCodeGenProduct(e.target.value)}
                        required
                      >
                        <option value="">-- Pilih Preset atau Paket --</option>
                        <optgroup label="Paket Bundling">
                          <option value="bundle-all">Ultimate All-Access (Semua 76 Preset)</option>
                          <option value="bundle-10">Paket Pro 10 Preset</option>
                          <option value="bundle-5">Paket Populer 5 Preset</option>
                          <option value="bundle-3">Paket Hemat 3 Preset</option>
                        </optgroup>
                        <optgroup label="Preset Satuan">
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.code} - {p.name} ({p.category})</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={codeGenLoading || !codeGenProduct}>
                      {codeGenLoading ? <span className="spinner" /> : "⚡ Generate Kode Akses Baru"}
                    </button>
                  </form>

                  {generatedCodeResult && (
                    <div style={{
                      marginTop: 24,
                      padding: 20,
                      background: "rgba(16, 185, 129, 0.1)",
                      border: "1.5px dashed var(--success)",
                      borderRadius: "var(--radius)",
                      textAlign: "center"
                    }}>
                      <div style={{ fontSize: 12, color: "var(--success)", fontWeight: 700, textTransform: "uppercase" }}>
                        ✓ Kode Akses Berhasil Dibuat
                      </div>
                      <div style={{
                        fontFamily: "monospace",
                        fontSize: 24,
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        margin: "10px 0"
                      }}>
                        {generatedCodeResult.code}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 14 }}>
                        Produk: <strong>{generatedCodeResult.productName}</strong>
                      </div>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedCodeResult.code);
                          notify("Kode disalin ke clipboard!");
                        }}
                      >
                        Salin Kode Akses
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: STATS */}
            {tab === "stats" && (
              <div>
                <div className={styles.tabHeader}><h2>Statistik Penjualan Toko</h2></div>
                <div className={styles.statsGrid}>
                  <div className="card" style={{ padding: "24px" }}>
                    <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 8 }}>Total Omset Sukses</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text)" }}>Rp {revenue.toLocaleString("id-ID")}</div>
                    <div style={{ fontSize: 13, color: "var(--success)", marginTop: 6 }}>{paidCount} transaksi lunas</div>
                  </div>
                  <div className="card" style={{ padding: "24px" }}>
                    <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 8 }}>Tingkat Konversi Pembayaran</div>
                    <div style={{ fontSize: 28, fontWeight: 800 }}>
                      {orders.length > 0 ? Math.round((paidCount / orders.length) * 100) : 0}%
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 6 }}>{paidCount} dari {orders.length} pesanan diselesaikan</div>
                  </div>
                  <div className="card" style={{ padding: "24px" }}>
                    <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 8 }}>Rata-rata Nilai Transaksi</div>
                    <div style={{ fontSize: 28, fontWeight: 800 }}>
                      Rp {paidCount > 0 ? Math.round(revenue / paidCount).toLocaleString("id-ID") : 0}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 6 }}>per pembelian sukses</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Product Form Modal (Add / Edit) */}
      {showAddProduct && (
        <ProductFormModal
          token={token}
          existingCategories={categoriesList}
          onClose={() => setShowAddProduct(false)}
          onSaved={() => { setShowAddProduct(false); loadProducts(); notify("Preset baru berhasil ditambahkan!"); }}
        />
      )}

      {editProduct && (
        <ProductFormModal
          token={token}
          product={editProduct}
          existingCategories={categoriesList}
          onClose={() => setEditProduct(null)}
          onSaved={() => { setEditProduct(null); loadProducts(); notify("Preset berhasil diperbarui!"); }}
        />
      )}

      {showBulkUpload && (
        <BulkUploadModal
          token={token}
          onClose={() => setShowBulkUpload(false)}
          onSaved={() => { loadProducts(); notify("Bulk upload selesai."); }}
        />
      )}
    </div>
  );
}

function ProductFormModal({ token, product, existingCategories = [], onClose, onSaved }) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    code: product?.code || "",
    name: product?.name || "",
    subtitle: product?.subtitle || "",
    category: product?.category || "Aesthetic",
    price: product?.price || 29000,
    description: product?.description || "",
    image: product?.image || "",
    available: product?.available !== false,
    fileData: "",
    fileName: "",
  });
  const [customCategory, setCustomCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(",")[1];
      setForm((f) => ({ ...f, fileData: base64, fileName: file.name }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const finalCategory = customCategory.trim() ? customCategory.trim() : form.category;
      const body = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        subtitle: form.subtitle.trim(),
        category: finalCategory,
        price: Number(form.price) || 0,
        description: form.description.trim(),
        image: form.image.trim(),
        available: form.available,
        status: form.available ? "AVAILABLE" : "INACTIVE",
      };
      if (form.fileData) body.fileData = form.fileData;

      const url = isEdit ? `${API}/api/products/${product.id}` : `${API}/api/products`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gagal menyimpan"); return; }
      onSaved();
    } catch (err) {
      setError("Gagal terhubung ke server.");
    } finally {
      setSaving(false);
    }
  };

  const defaultCats = Array.from(new Set(["Aesthetic", "Cinematic", "Film", "Moody", "Portrait", "Nature", "Urban", "HDR", "Travel", "Lifestyle", ...existingCategories]));

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <h2>{isEdit ? `Edit Preset: ${product.name}` : "Tambah Preset Baru"}</h2>
          <button className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="form-group">
                <label>Kode Preset (Unik)</label>
                <input
                  className="form-control"
                  placeholder="LP77"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Kategori</label>
                <select
                  className="form-control"
                  value={form.category}
                  onChange={(e) => {
                    setForm({ ...form, category: e.target.value });
                    if (e.target.value !== "Custom") setCustomCategory("");
                  }}
                >
                  {defaultCats.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Custom">+ Kategori Baru...</option>
                </select>
              </div>
            </div>

            {form.category === "Custom" && (
              <div className="form-group">
                <label>Nama Kategori Baru</label>
                <input
                  className="form-control"
                  placeholder="Misal: Wedding, Dark Moody..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Nama Preset</label>
              <input
                className="form-control"
                placeholder="Golden Tokyo Street"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Subtitle / Tone Highlight</label>
              <input
                className="form-control"
                placeholder="Warm sunset tones & film look"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="form-group">
                <label>Harga Jual (Rp)</label>
                <input
                  className="form-control"
                  type="number"
                  placeholder="29000"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Status Ketersediaan</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8, height: "100%", paddingTop: 8 }}>
                  <input
                    type="checkbox"
                    id="availableCheck"
                    checked={form.available}
                    onChange={(e) => setForm({ ...form, available: e.target.checked })}
                  />
                  <label htmlFor="availableCheck" style={{ fontSize: 13, cursor: "pointer" }}>
                    Aktif & Siap Dibeli
                  </label>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>URL Gambar Thumbnail / Cover</label>
              <input
                className="form-control"
                placeholder="https://images.unsplash.com/..."
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
              />
              {form.image && (
                <div style={{ marginTop: 8 }}>
                  <img
                    src={form.image}
                    alt="Preview"
                    style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Deskripsi Preset</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Cocok untuk foto outdoor, golden hour, dan street photography..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>File Preset (.zip / .xmp / .dng)</label>
              <input
                ref={fileRef}
                type="file"
                accept=".zip,.xmp,.dng"
                style={{ display: "none" }}
                onChange={handleFile}
              />
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => fileRef.current?.click()}
                >
                  📁 Pilih File dari Komputer
                </button>
                <span style={{ fontSize: 13, color: form.fileName ? "var(--success)" : "var(--text-3)" }}>
                  {form.fileName || (product?.hasFile ? "✓ File sudah tersimpan di database" : "Belum ada file preset")}
                </span>
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : (isEdit ? "Simpan Perubahan" : "Tambahkan Preset")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


