# Ahmed & Reem — Wedding Invitation

A one-page, phone-first wedding invitation. It is a static site (HTML, CSS and JavaScript), so it runs on GitHub Pages with no build step.

**Tuesday, 10 November 2026 · 8:00 PM · Porto Diamond**

## What guests see

1. **The door.** A looping closed-door video. Tapping **Open** starts the music and plays the door-opening video.
2. **Ahmed & Reem**, *invite you to celebrate our forever*.
3. The couple's first photo.
4. *Two souls, one story, a lifetime together.*
5. **The countdown**, live until 10 Nov 2026, 8:00 PM (Cairo time).
6. **Our story**, with leaves and rose petals falling over the picture.
7. **The big day**: date, time and venue.
8. **The venue**, with a button that opens the location in Google Maps.
9. **Dress code** and the gift note.
10. The couple's second photo.
11. **See you there.**
12. **RSVP**: full name and a message.

The design panels (2, 4–9, 11) recreate the approved design exactly. Each one keeps the design's proportions, and its text sits at the same position and size on every phone.

## Things to fill in

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
| `assets/img/panels/` | HD background pictures, regenerated in Google Flow from the design's panels, with no text |
| `assets/img/couple-1.jpg`, `couple-2.jpg` | The couple's photos |

### Replacing a panel picture
Each panel background is an HD image (Nano Banana in Google Flow), generated from the matching panel of the design and cropped to that panel's shape. To swap one, save the new picture over the file with the same name in `assets/img/panels/`. Keep the same composition, because the text is placed to match it.

## Run it locally
```bash
python -m http.server 5173
```
Then open http://localhost:5173.

## Fonts
They match the design: **Cinzel** for spaced capitals, **Cormorant Garamond** for "AHMED & REEM" and the numbers, **EB Garamond** for body text, and **Corinthia** for the script headings. The A and R swashes were traced from the design. The Arabic RSVP labels use **Amiri**.
