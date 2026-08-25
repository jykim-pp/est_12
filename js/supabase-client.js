(function () {
  "use strict";

  const SUPABASE_URL = "https://jnnvoxigfbxtiwunnztk.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_HVH7L7gL2q-JKZ2P-vCELQ_gXPUl5sW";

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.warn("Supabase CDN을 불러오지 못해 Mock Data 모드로 실행합니다.");
    window.supabaseClient = null;
    return;
  }

  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    }
  );
})();
