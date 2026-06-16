/**
 * ComplianceGPT Embeddable Widget
 *
 * Usage:
 *   <script src="https://your-app-url.com/widget.js"
 *           data-key="YOUR_ASSISTANT_WIDGET_KEY"></script>
 *
 * Or with options:
 *   <script>
 *     window.ComplianceGPTWidget = window.ComplianceGPTWidget || [];
 *     window.ComplianceGPTWidget.push({ key: "YOUR_KEY" });
 *   </script>
 *   <script src="https://your-app-url.com/widget.js"></script>
 */

(function () {
  "use strict";

  // Auto-detect the host URL (works when widget.js is served from the same origin)
  const DEFAULT_URL = window.location.origin;
  const BUTTON_COLOR = "#3b82f6"; // blue-500
  const BUTTON_SIZE = 56;

  // ── Read config ──────────────────────────────────────────────────

  function getConfig() {
    // From data attributes on script tag
    const script = document.currentScript || (function () {
      const scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

    const key = script?.getAttribute("data-key") ||
      (window.ComplianceGPTWidget && window.ComplianceGPTWidget[0]?.key);

    if (!key) {
      console.error("ComplianceGPT Widget: missing widget key. Add data-key attribute.");
      return null;
    }

    return {
      key,
      url: script?.getAttribute("data-url") || DEFAULT_URL,
      title: script?.getAttribute("data-title") || "ComplianceGPT",
      color: script?.getAttribute("data-color") || BUTTON_COLOR,
      position: script?.getAttribute("data-position") || "right", // left | right
    };
  }

  // ── Create styles ────────────────────────────────────────────────

  function injectStyles(config) {
    const style = document.createElement("style");
    style.textContent = `
      #cgpt-widget-btn {
        position: fixed;
        bottom: 24px;
        ${config.position}: 24px;
        width: ${BUTTON_SIZE}px;
        height: ${BUTTON_SIZE}px;
        border-radius: 50%;
        background: ${config.color};
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      #cgpt-widget-btn:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 24px rgba(0,0,0,0.3);
      }
      #cgpt-widget-btn svg {
        width: 26px;
        height: 26px;
        fill: white;
      }
      #cgpt-widget-iframe {
        position: fixed;
        bottom: 96px;
        ${config.position}: 24px;
        width: 380px;
        height: 520px;
        border: none;
        border-radius: 16px;
        box-shadow: 0 8px 40px rgba(0,0,0,0.2);
        z-index: 999998;
        display: none;
        background: #fff;
      }
      #cgpt-widget-iframe.open {
        display: block;
        animation: cgpt-slide-up 0.25s ease-out;
      }
      @keyframes cgpt-slide-up {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @media (max-width: 480px) {
        #cgpt-widget-iframe {
          width: calc(100vw - 32px);
          height: 70vh;
          bottom: 88px;
          ${config.position}: 16px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ── Create UI ────────────────────────────────────────────────────

  function createButton() {
    const btn = document.createElement("button");
    btn.id = "cgpt-widget-btn";
    btn.setAttribute("aria-label", "Open ComplianceGPT chat");
    btn.title = "Chat with ComplianceGPT";
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
        <path d="M7 9h10v2H7zM7 13h6v2H7z"/>
      </svg>
    `;
    return btn;
  }

  function createIframe(config) {
    const iframe = document.createElement("iframe");
    iframe.id = "cgpt-widget-iframe";
    iframe.src = `${config.url}/widget?key=${encodeURIComponent(config.key)}`;
    iframe.allow = "clipboard-write";
    iframe.setAttribute("scrolling", "no");
    return iframe;
  }

  // ── Open / Close ─────────────────────────────────────────────────

  function openChat(iframe, btn) {
    iframe.classList.add("open");
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    `;
    iframe.contentWindow?.postMessage({ type: "widget:opened" }, "*");
  }

  function closeChat(iframe, btn) {
    iframe.classList.remove("open");
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
        <path d="M7 9h10v2H7zM7 13h6v2H7z"/>
      </svg>
    `;
  }

  function toggleChat(iframe, btn) {
    if (iframe.classList.contains("open")) {
      closeChat(iframe, btn);
    } else {
      openChat(iframe, btn);
    }
  }

  // ── Init ─────────────────────────────────────────────────────────

  function init() {
    // Don't init if we're inside an iframe already
    if (window.self !== window.top) return;

    const config = getConfig();
    if (!config) return;

    // Clean up any previous instances
    document.getElementById("cgpt-widget-btn")?.remove();
    document.getElementById("cgpt-widget-iframe")?.remove();

    injectStyles(config);

    const btn = createButton();
    const iframe = createIframe(config);

    btn.addEventListener("click", () => toggleChat(iframe, btn));

    // Listen for messages from iframe
    window.addEventListener("message", (e) => {
      if (e.data?.type === "widget:opened") {
        // Widget opened inside iframe — could auto-scroll or track analytics
      }
    });

    document.body.appendChild(btn);
    document.body.appendChild(iframe);
  }

  // Run when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
