/* We Help! settings.
 * Leave supabaseUrl / supabaseAnonKey empty to run in LOCAL mode (data stays on each device).
 * Fill them in (Supabase dashboard → Project Settings → API) to sync all iPads and the board.
 * The anon key is meant to be public: every table is protected by row-level security and team sign-in.
 * A device can also be connected from Portal → Setup without editing this file.
 */
window.WEHELP_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  sessionDate: '2026-12-01'
};
(function(){ // per-device connection saved from Portal → Setup (used only when the values above are empty)
  try{ var o = JSON.parse(localStorage.getItem('wehelp-connect:v1') || 'null');
    if(o && !window.WEHELP_CONFIG.supabaseUrl){ window.WEHELP_CONFIG.supabaseUrl = o.url; window.WEHELP_CONFIG.supabaseAnonKey = o.key; } }catch(e){}
})();
