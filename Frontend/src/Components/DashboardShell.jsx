// =========================================================
// DASHBOARD SHELL — shared layout for Seller and Admin areas
// Pure presentation: sidebar (desktop), off-canvas drawer
// (mobile), top bar and content area. No API or auth logic.
// =========================================================

import { useEffect, useState } from "react";

export default function DashboardShell({
  brand = "ShopMart",
  badge = "",
  groups = [],
  activeId,
  onSelect,
  onExit,
  exitLabel = "Back to store",
  title = "",
  subtitle = "",
  children,
}) {
  const [open, setOpen] = useState(false);

  // Close drawer with Escape and lock page scroll while it is open
  useEffect(() => {
    if (!open) return undefined;

    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.body.classList.add("dash-lock");

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("dash-lock");
    };
  }, [open]);

  const handleSelect = (id) => {
    setOpen(false);
    window.scrollTo({ top: 0 });
    if (onSelect) onSelect(id);
  };

  const activeItem = groups
    .flatMap((group) => group.items)
    .find((item) => item.id === activeId);

  return (
    <div className="dash-layout">
      <div
        className={`dash-overlay ${open ? "visible" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside
        id="dash-sidebar"
        className={`dash-sidebar ${open ? "open" : ""}`}
        aria-label={`${badge || brand} navigation`}
      >
        <div className="dash-brand">
          <div>
            <span className="dash-brand-name">{brand}</span>
            {badge && <span className="dash-brand-badge">{badge}</span>}
          </div>

          <button
            type="button"
            className="dash-close"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            {String.fromCodePoint(0x00D7)}
          </button>
        </div>

        <nav className="dash-nav">
          {groups.map((group) => (
            <div className="dash-nav-group" key={group.label}>
              <span className="dash-nav-label">{group.label}</span>

              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`dash-nav-item ${
                    item.id === activeId ? "active" : ""
                  }`}
                  aria-current={item.id === activeId ? "page" : undefined}
                  onClick={() => handleSelect(item.id)}
                >
                  <span className="dash-nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        {onExit && (
          <button
            type="button"
            className="dash-exit"
            onClick={() => {
              setOpen(false);
              onExit();
            }}
          >
            ← {exitLabel}
          </button>
        )}
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <button
            type="button"
            className="dash-hamburger"
            aria-label="Open navigation"
            aria-expanded={open}
            aria-controls="dash-sidebar"
            onClick={() => setOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>

          <div className="dash-topbar-title">
            <strong>{title || (activeItem && activeItem.label)}</strong>
            {subtitle && <small>{subtitle}</small>}
          </div>

          {onExit && (
            <button
              type="button"
              className="dash-topbar-exit"
              onClick={onExit}
            >
              {exitLabel}
            </button>
          )}
        </header>

        <div className="dash-content">{children}</div>
      </div>
    </div>
  );
}
