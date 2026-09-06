# Birthday Wish

A free, no-sign-up website where anyone can make a birthday card with 3 photos and a message, then share it as a single link.

**How it works:** there's no server and no database. When someone fills out the form, the photos and message are compressed and packed directly into the URL itself. Opening that link decodes the message back out and shows the card. This means:

- It costs nothing to run — GitHub Pages hosts static files for free, forever.
- Nobody's data touches a server. Everything happens in the visitor's browser.
- Links can get long if the photos are large (this is normal — see below).

## Deploy it to GitHub Pages (free)

1. Create a new GitHub repository (public or private both work), e.g. `birthday-wish`.
2. Upload these three files to the repo root: `index.html`, `style.css`, `script.js`.
   - On github.com: open the repo → **Add file → Upload files** → drag in the three files → **Commit changes**.
3. Go to the repo's **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
5. Set **Branch** to `main` (or whichever branch you uploaded to) and folder to `/ (root)`. Save.
6. Wait about a minute, then refresh the page — GitHub shows your live URL at the top, something like:
   `https://yourusername.github.io/birthday-wish/`

That's it. Anyone who visits that URL can create a wish and get a shareable link back.

## A note on link length

Because the photos live inside the link (not on a server), a card with photos usually makes a link somewhere around 3,000–15,000 characters. You'll never actually see that messy text by default — the "Copy link to send" button just puts it on your clipboard, ready to paste into a text, WhatsApp, or email. If you want to see the raw link, there's a small "Show full link" toggle.

A few things worth knowing:

- Browsers, email, WhatsApp, iMessage, and most messaging apps handle links that long without a problem.
- A few platforms with strict character limits (like an SMS text on some carriers) may cut it off. If that happens, try smaller/fewer photos.
- On a phone, the "Share…" button (when available) opens your device's native share sheet, so you can send straight to an app without copying anything.

## Customizing

- **Colors, fonts:** edit the CSS variables at the top of `style.css` (`--pink`, `--yellow`, `--teal`, fonts in `index.html`'s `<head>`).
- **Site name:** change "Birthday Wish" in `index.html` (the `.brand` link and the `<title>`).
- **Max photo size / quality:** adjust `MAX_DIMENSION` and `JPEG_QUALITY` at the top of `script.js` — smaller numbers make shorter links but lower-quality photos.

## Files

```
index.html   the page markup (compose form + wish view)
style.css    all styling
script.js    photo resizing, link generation, and rendering the wish
```

No build step, no dependencies to install — it's ready to upload as-is.
