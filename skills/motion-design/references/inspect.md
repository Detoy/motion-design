# Inspect

Decide the input type, then gather only what the film needs. Do not plan before this page is answered.

## Input types

| Input | How to recognize | Material comes from |
|---|---|---|
| Project | No URL, current dir is an app or site | Source code, styles, README, routes |
| Website | `http(s)://` or a bare domain | Live rendered page |
| Brand kit | Logo, colors, screenshots, copy deck | Files the user attached |
| Product brief | Description + maybe one URL | Brief plus any public page you can fetch |
| Reference | Frame, video, "make it feel like X" | Attached media plus named look |

Mix freely. A URL plus three screenshots plus "tone of Linear's launch" is a normal job.

## Project

Read in this order:

1. The main page / hero route — title, headline, tagline, section heads, CTA, nav
2. Stylesheets — `:root` tokens, exact hex/rgb, font families
3. README / PRODUCT / marketing copy — claims you are allowed to make
4. App surfaces — the 2–3 beats of *using* it (entry → key action → result)
5. Existing motion — if the product already animates, steal its easing personality

Reuse real components, stylesheets, fonts, and images in the composition when you can import them. Do not redraw a dashboard that you can screenshot or render.

## Website

Load the live page in a headless browser. A raw HTML fetch is often an empty shell.

- Dismiss cookie banners and promo modals
- Scroll section by section — scroll-animated content is blank in a single full-page shot
- Capture at the *target aspect ratio*, not a random desktop width
- Pull computed colors and loaded font families, not just the stylesheet text
- Download logo, og:image, product shots, and demo posters into `work/source/`
- Prefer demo videos / docs GIFs / app screenshots over the marketing illustration

In the film, animate real markup and assets. Do not Ken Burns a full-page JPEG unless that is the only artifact that exists.

## Brand kit / attachments

Inventory every file. Note format, transparency, and whether type is already outlined. Sample a 6-color palette from the logo if tokens are missing. Never recolor a logo "to make it pop".

## Reference handling

When a look is named or a frame is attached:

- Steal — palette, type treatment, grain/texture, camera speed, how often cuts land
- Do not steal — subject, copy, logo, any recognizable composition that would make this a clone
- If a reference *video* is given, extract 8–12 frames with ffmpeg and write a shot-by-shot pacing note before coding
- If a folder of prior work is given, write `work/style-notes.md` from it first

Naming a look beats describing one. "Playdate meets Stripe atlas" is more useful than three paragraphs of adjectives.

## Inspect rubric (answer all)

1. What is it, in one sentence a stranger would accept?
2. Who is it for, and what does it do for them?
3. What is the most impressive, specific, or funny claim that is actually true?
4. What is the visual hook — the image that earns the next 20 seconds?
5. What real UI or flow must appear on screen?
6. Exact colors (background, text, accent) and fonts.
7. Which tone preset fits, and what freeform direction sharpens it?
8. What should we refuse to show (old logo, deprecated feature, competitor, private data)?
9. One-line share caption draft.

If you cannot answer 1, 5, and 6, you are not ready to plan.
