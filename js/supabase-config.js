/* Supabase connection shared by the invitation and the RSVP list page.
   Both values come from Supabase → Project Settings → API.
   The anon (publishable) key is meant to be public: what it can do is
   limited by the row-level security rules in supabase/setup.sql
   (guests can only add an RSVP; only a signed-in user can read them). */
window.SUPABASE_CONFIG = {
  url: '',      // e.g. 'https://abcdefghijkl.supabase.co'
  anonKey: '',  // the "anon" / "publishable" key
  table: 'rsvps',
};
