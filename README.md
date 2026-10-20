# Ahmed & Reem — Wedding Invitation

A one-page, phone-first wedding invitation. It is a static site (HTML, CSS and JavaScript), so it runs on GitHub Pages with no build step.

**Tuesday, 10 November 2026 · 8:00 PM · Porto Diamond**

## What guests see

1. **The door.** A looping closed-door video. Tapping **Open** starts the music and plays the door-opening video.
2. **The verse and the invitation** (in Arabic), shown over the last frame of the door video.
3. **Ahmed & Reem**, *invite you to celebrate our forever*.
4. The couple's first photo.
5. *Two souls, one story, a lifetime together.*
6. **The countdown**, live until 10 Nov 2026, 8:00 PM (Cairo time).
7. **Our story**, with leaves and rose petals falling over the picture.
8. **The big day**: date, time and venue.
9. **The venue**, with a button that opens the location in Google Maps.
10. **Dress code** and the gift note.
11. The couple's second photo.
12. **See you there.**
13. **RSVP**: full name and a message.

The design panels (3, 5–10, 12) recreate the approved design exactly. Each one keeps the design's proportions, and its text sits at the same position and size on every phone.

## Things to fill in

### Family names
Open `index.html`, search for `اكتب أسماء العائلات هنا`, and replace the two `..................` with the family names:

```html
تتشرف عائلة <span class="blank">..................</span><br>
وعائلة <span class="blank">..................</span>
```

### Connect the RSVP form (about 5 minutes)
RSVPs are saved to a Google Sheet. Until this is connected, the form shows "RSVP opens soon."

1. Create a new Google Sheet, for example *Ahmed & Reem RSVP*.
2. Open **Extensions → Apps Script**, delete the sample code, and paste in everything from [`rsvp/Code.gs`](rsvp/Code.gs). Save.
3. Click **Deploy → New deployment** and choose the type **Web app**.
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
4. Click **Deploy**, approve the permissions, and copy the **Web app URL**. It ends in `/exec`.
5. In `js/main.js`, paste the URL into `CONFIG.rsvpEndpoint`:
   ```js
   rsvpEndpoint: 'https://script.google.com/macros/s/XXXX/exec',
   ```
6. Commit and push. Each RSVP becomes a row in the **RSVP** tab: *Time | Full name | Message*.

## Publish with GitHub Pages
In the repository, go to **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, then select **main** and **/ (root)**. The site will be at:

`https://ebrahemmostafa.github.io/ahmed-reem-wedding/`

## Files

| Path | What it is |
| --- | --- |
| `index.html` | All content |
| `css/style.css` | All styling |
| `js/main.js` | Door intro, music, countdown, falling leaves, RSVP |
| `rsvp/Code.gs` | Google Apps Script that writes RSVPs to a Sheet |
| `assets/video/` | `door-idle.mp4` (closed-door loop), `door-open.mp4` (doors opening) |
| `assets/audio/music.mp3` | Background music, looped |
| `assets/img/panels/` | Background pictures from the design, with the text removed |
| `assets/img/ayah.png` | The verse, in the lettering of the image that was sent |
| `assets/img/couple-1.jpg`, `couple-2.jpg` | The couple's photos |

### Sharper panel pictures (optional)
The panel backgrounds were cut out of the design image, which is only 640 × 960 for all nine screens, so they look a little soft on large phones. To sharpen any of them, generate a high-resolution version without text, for example in Google Flow. Keep the same composition and roughly the same tall shape, then save it over the file with the same name in `assets/img/panels/`. No code changes are needed.

## Run it locally
```bash
python -m http.server 5173
```
Then open http://localhost:5173.

## Fonts
They match the design: **Cinzel** for spaced capitals, **Cormorant Garamond** for "AHMED & REEM" and the numbers, **EB Garamond** for body text, and **Corinthia** for the script headings. The A and R swashes were traced from the design. The Arabic invitation uses **Amiri** and **Aref Ruqaa**.
