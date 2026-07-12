const PAIR_URL =
  "https://api.dexscreener.com/latest/dex/pairs/robinhood/0x056022d4208bfbce18209a00fe81e6877a9de284";

function showToast(message) {
  const toast = document.getElementById("copy-toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2200);
}

function initCopyButtons() {
  document.querySelectorAll("[data-address]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const address = btn.getAttribute("data-address");
      try {
        await navigator.clipboard.writeText(address);
        btn.classList.add("copied");
        const label = btn.querySelector("span");
        if (label) {
          const prev = label.textContent;
          label.textContent = "Copied!";
          setTimeout(() => {
            btn.classList.remove("copied");
            label.textContent = prev;
          }, 2000);
        }
        showToast("Contract address copied!");
      } catch {
        showToast("Copy failed — select and copy manually.");
      }
    });
  });
}

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  const header = document.querySelector(".site-header");
  if (!toggle || !links || !header) return;

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function initReveals() {
  const nodes = document.querySelectorAll(".reveal");
  if (!nodes.length) return;

  if (!("IntersectionObserver" in window)) {
    nodes.forEach((el) => el.classList.add("in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
  );

  nodes.forEach((el) => io.observe(el));
}

function formatUsd(value) {
  if (value == null || Number.isNaN(Number(value))) return "$0";
  const n = Number(value);
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n > 0) return `$${n.toPrecision(4)}`;
  return "$0";
}

function formatPrice(value) {
  if (value == null || Number.isNaN(Number(value))) return "$0.00";
  const n = Number(value);
  if (n >= 1) return `$${n.toFixed(4)}`;
  if (n >= 0.0001) return `$${n.toFixed(6)}`;
  if (n > 0) return `$${n.toPrecision(4)}`;
  return "$0.00";
}

function formatChange(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

async function fetchStats() {
  const note = document.getElementById("stats-note");
  try {
    const res = await fetch(PAIR_URL);
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();
    const pair = data.pair || (Array.isArray(data.pairs) ? data.pairs[0] : null);
    if (!pair) throw new Error("no pair");

    const priceEl = document.getElementById("stat-price");
    const changeEl = document.getElementById("stat-change");
    const mcapEl = document.getElementById("stat-mcap");
    const volumeEl = document.getElementById("stat-volume");
    const liquidityEl = document.getElementById("stat-liquidity");
    const tradesEl = document.getElementById("stat-trades");

    if (priceEl) priceEl.textContent = formatPrice(pair.priceUsd);
    if (changeEl) {
      changeEl.textContent = formatChange(pair.priceChange?.h24);
      const ch = Number(pair.priceChange?.h24);
      changeEl.style.color = ch > 0 ? "#7dff6a" : ch < 0 ? "#ff6b6b" : "";
    }
    if (mcapEl) mcapEl.textContent = formatUsd(pair.marketCap || pair.fdv);
    if (volumeEl) volumeEl.textContent = formatUsd(pair.volume?.h24);
    if (liquidityEl) liquidityEl.textContent = formatUsd(pair.liquidity?.usd);
    if (tradesEl) {
      const buys = pair.txns?.h24?.buys || 0;
      const sells = pair.txns?.h24?.sells || 0;
      const total = buys + sells;
      tradesEl.textContent = total ? total.toLocaleString() : "—";
    }
    if (note) note.textContent = "Live · refreshed every 30s via Dexscreener.";
  } catch {
    if (note) {
      note.textContent = "Live data will populate once the pair is indexed on Dexscreener.";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initCopyButtons();
  initReveals();
  fetchStats();
  setInterval(fetchStats, 30_000);
});
