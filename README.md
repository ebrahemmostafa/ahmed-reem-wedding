# Ahmed & Reem — Wedding Invitation

A one-page, phone-first wedding invitation. It is a static site (HTML, CSS and JavaScript), so it runs on GitHub Pages with no build step.

**Tuesday, 10 November 2026 · 8:00 PM · Porto Diamond**

## What guests see

1. **The door.** The design's door with rose petals falling. Tapping **Open** starts the music and plays the door-opening video, which ends on the names page.
2. **Ahmed & Reem**, *invite you to celebrate our forever*.
3. **Our story**, with leaves and rose petals falling over the picture.
4. The couple's first photo.
5. *Two souls, one story, a lifetime together.*
6. **The countdown**, live until 10 Nov 2026, 8:00 PM (Cairo time).
7. **The big day**: date, time and venue.
8. **The venue**, with a button that opens the location in Google Maps.
9. **Dress code** and the gift note.
10. The couple's second photo.
11. **See you there.**
12. **RSVP**: full name and a message.

The design panels (2, 3, 5–9, 11) recreate the approved design exactly. Each one keeps the design's proportions, and its text sits at the same position and size on every phone.

## Things to fill in

### Connect the RSVP form to Supabase (about 5 minutes)
RSVPs are saved in a Supabase table and listed on **`ahmed-reem-rsvp.html`**, which opens with a passcode. Until this is connected, the form shows "RSVP opens soon."

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste everything from [`supabase/setup.sql`](supabase/setup.sql), replace `CHANGE-ME` with the passcode for the RSVP page, and click **Run**. Don't commit a copy with the real passcode, because this repository is public. Files named `supabase/*.local.sql` are ignored by git for that reason.
3. Go to **Project Settings → API** and copy the **Project URL** and the **anon / publishable** key into [`js/supabase-config.js`](js/supabase-config.js).
4. Commit and push.

**Who can see what:** guests can only *add* an RSVP. The table can't be read directly. The RSVP page asks Supabase for the list with the passcode, which is checked on the server against a bcrypt hash. After 10 wrong tries in 15 minutes it stops answering for 15 minutes. The anon key in the code can't read anyone's message.

To change the passcode later, run this in the SQL Editor:
```sql
update public.rsvp_secret
set passcode_hash = extensions.crypt('NEW-PASSCODE', extensions.gen_salt('bf'))
where id = 1;
```

### The RSVP page
Open `ahmed-reem-rsvp.html` (on GitHub Pages: `https://ebrahemmostafa.github.io/ahmed-reem-wedding/ahmed-reem-rsvp.html`) and enter the passcode. It shows every reply, newest first, with the time (Cairo), totals, a search box, a **Download CSV** button (opens correctly in Excel, Arabic included), and **Delete** for spam or duplicates. It refreshes every 30 seconds and stays unlocked until you tap **Lock** or close the tab.

## Publish with GitHub Pages
In the repository, go to **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, then select **main** and **/ (root)**. The site will be at:

`https://ebrahemmostafa.github.io/ahmed-reem-wedding/`

## Files

| Path | What it is |
| --- | --- |
| `index.html` | All content |
| `css/style.css` | All styling |
| `js/main.js` | Door intro, music, countdown, falling leaves, RSVP form |
| `js/supabase-config.js` | Supabase project URL and anon key (shared by both pages) |
| `ahmed-reem-rsvp.html`, `js/rsvp-admin.js`, `css/rsvp.css` | The RSVP list page (passcode) |
| `supabase/setup.sql` | Creates the RSVP table, the passcode check and the access rules |
| `assets/video/door-open.mp4` | The design's door opening onto the names page (Veo 3.1 in Google Flow) |
| `assets/img/door.jpg`, `monogram.png` | The closed door (the video's first frame) and the swash "AR" monogram |
| `assets/audio/music.mp3` | Background music, looped |
| `assets/img/panels/` | HD background pictures, regenerated in Google Flow from the design's panels. `names.jpg` is the video's last frame and includes the AHMED & REEM lettering |
| `assets/img/couple-1.jpg`, `couple-2.jpg` | The couple's photos |

### Replacing a panel picture
Each panel background is an HD image (Nano Banana in Google Flow), generated from the matching panel of the design and cropped to that panel's shape. To swap one, save the new picture over the file with the same name in `assets/img/panels/`. Keep the same composition, because the text is placed to match it.

## Run it locally
```bash
python -m http.server 5173
```
Then open http://localhost:5173.

## Fonts
They match the design: **Cinzel** for spaced capitals, **Cormorant Garamond** for "AHMED & REEM" and the numbers, **EB Garamond** for body text, and **Corinthia** for the script headings. The AHMED & REEM lettering and the AR monogram come from the regenerated design artwork. The Arabic RSVP labels use **Amiri**.
