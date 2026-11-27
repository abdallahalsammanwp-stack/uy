// Socket.IO connection used by game.js (window.CPBNet.get() -> socket).
// Server URL comes from public/config.js (SERVER_URL, written by build.js from the SERVER_URL env var).
// Empty SERVER_URL = same origin as the page (npm start serves both).
(function () {
  let s = null;
  window.CPBNet = {
    get() {
      if (s) return s;
      if (typeof window.io !== 'function') return null;
      const url = (window.CPB_CONFIG && window.CPB_CONFIG.SERVER_URL) || undefined;
      s = window.io(url, { transports: ['websocket', 'polling'], reconnection: true, reconnectionDelay: 500, reconnectionDelayMax: 3000, timeout: 8000 });
      return s;
    }
  };
})();
