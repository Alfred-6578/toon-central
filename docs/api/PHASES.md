# Connecting the real API: phases

The site was built on a data snapshot and browser mocks. We switch it to the real backend one area at a
time. Each area has its own switch (`TOON_API_LIVE` in `.env.local`), so a problem in one area can be
switched back to mock without touching the rest.

- API: `TOON_API_BASE_URL` in `.env.local` (not committed). The project now uses the **production** API.
  Areas that write data (accounts, reader actions, money, studio) will create real accounts, likes and
  payments there, so each one is tested with dedicated test accounts and agreed with the backend first.
- Endpoint list: `src/lib/api/endpoints.ts`, generated from the backend's Postman collection
  (`docs/api/toon-central.postman.json`, with passwords, tokens, emails and phone numbers removed)
- Live check: open `/dev/api` while running the dev server

| Phase | Area switch | What becomes real | Status |
|---|---|---|---|
| 0. Foundations | none | Plumbing only, nothing visible changes | Done |
| 1. Public reading | `reading` | Home, Discover, comics, episodes, genres, originals, New & Popular, search, shorts, creator pages | **Ready for review** (episode lists and pages wait on the backend) |
| 2. Accounts | `accounts` | Register, verify, sign in/out, reset password, profile, avatar | **In progress** (sign in/out, join, reset request done) |
| 3. Reader actions | `readerActions` | Likes, subscribe, library (favourites), follow, comments, view counts | **Ready for review** on staging (subscribe waits on the backend) |
| 4. Money | `money` | Wallet, plans, credit packs, checkout, unlocks, transaction history | |
| 5. Creator Studio | `studio` | Comics, chapters and shorts: create, edit, publish, real uploads | |
| 6. Waiting on backend | none | Notifications feed, referrals, MTN pass, earnings/payouts, Creator Rewards views, trailers, per-Mafiki monetization, panel locks, ad offers, Creator of the Month | Needs endpoints |
| 7. Launch hardening | none | Remove mocks and demo toggles, empty/error states, speed and security pass, deploy | |

## Phase 0: Foundations

**What was built**

- `src/lib/api/config.ts`: the API address and the per-area live switches.
- `src/lib/api/http.ts`: one request function for every call. It handles the backend's
  `{ status, message, data }` wrapper, form errors (`errors: { field: [...] }`), timeouts (15 s) and
  "server unreachable", and never throws. Public reads are cached for 5 minutes; anything signed in is never cached.
- `src/lib/api/token.ts`: keeps the signed-in user's access token in an httpOnly cookie on our server,
  so the browser's scripts can't read it, and sends it as `Authorization: Bearer …` (the scheme the
  Postman collection uses). Used from Phase 2.
- `src/lib/api/client.ts` now goes through the new layer, and only uses the API when `reading` is live.
- `/dev/api`: developer status page (hidden in production builds).

**How to review**

1. Run the dev server and open `/dev/api`.
2. Check: the API address is right; "Sign-in guard" says *Working*; public reading endpoints show
   **OK** with response times; every area shows **Mock**.
3. Click around the site: nothing should look different (no area is live yet).

**Done when**: the review above passes and the questions below are answered.

**Questions for the backend team**

1. ~~Staging or production?~~ Answered 31 Oct: there's a staging server (test data) and a production one
   (same `/api/v1` paths and responses; 49 real Mafiki vs 24 test ones). We now develop against production.
2. Two test accounts on it: a reader (with some credits) and a creator.
3. What `onboard/login` returns (no saved example), and how the access token expires and refreshes.
4. Payments on this server: test mode or real?
5. Several endpoints have no saved example response (see "Missing" on `/dev/api`); one real response each, please.
6. Like, subscribe, add-to-favourite, follow and view are GET requests that change data; they should be POST.
7. From the first `/dev/api` check (27 Oct 2026):
   - `genres/pull/list/paginate` and `selectables/credit-points` return 404 (route not found) on this server.
   - `unlock-tasks` needs sign-in (401), though the Postman request sends no token.
   - `welcome` doesn't return JSON.
   - Empty lists come back as HTTP 200 with `status: false` ("no record found"); a plain empty list would be clearer.
   - Responses take about 2 seconds each (the first is faster when cached). Is that just this server? Production needs to be quicker; we cache public reads for 5 minutes either way.

## Phase 1: Public reading

**What changed**

- `reading` is switched on in `.env.local` (pointing at production). Every public page now uses the API: home, Discover,
  New & Popular, originals, genres (with real counts), shorts, creator pages, comic pages and search.
- The catalogue comes from `trending/new-and-trending` (every published comic) plus the home lists.
- Empty lists ("no record found") count as empty, not as errors.
- Comics with no cover or banner show a placeholder instead of a broken image.

**Episode lists and pages (added 31 Oct)**

Both endpoints with episodes add a view on every call (checked on staging: `comics/:uuid/view` 21 → 22 → 23,
`comics/:uuid/episode/:id/get` 25 → 27), so neither is called while the server builds pages:

- **Comic page:** the real episode list (titles, dates, page counts, thumbnails) is fetched by the browser
  once the reader opens the page, through `/api/comics/:uuid/open`, which keeps only those fields (no page
  images, lock flags, emails or phones). One view per visit; paging through episodes doesn't count again.
- **Reader:** real pages come from `comics/:uuid/episode/:id/get`, called once when an episode opens.
  It needs the episode's id, so links from the comic page's list carry `?id=`; reader links are never
  prefetched. Signed out, the backend only serves episode 1; later episodes keep stand-in pages until
  sign-in (Phase 2) passes the reader's token. Locked pages still go out blurred only.

**How to review**

1. Open the site on your dev server and click through: home, Discover, a comic, a genre, originals,
   New & Popular, shorts, a creator page, and search (try "black").
2. Check that the comics, covers and counts match the test server (expect its test comics, e.g. "knnkn,").
3. `/dev/api` shows **Public reading: Live**.
4. Covers can take a few seconds the first time: Cloudinary makes each resized copy on first request.

**For the backend team (Phase 1 findings)**

1. A read-only comic details endpoint (e.g. `GET comics/:uuid`) that returns the comic and its episodes
   **without** counting a view, and an episode by its number (`comics/:uuid/episode/:number`). Count views
   with a separate POST when someone actually opens the comic or episode.
2. **Paywall:** each page in an episode comes with its full image link plus `is_lock`. Locked pages must not
   include the real image link (send a blurred preview, or nothing, until the reader has unlocked it).
   Otherwise anyone can read paid pages. Fix before Phase 4.
3. Image links contain creators' email addresses (e.g. `.../Reader/someone%40gmail.com/...`), and comic
   responses include the creator's email and phone. Both should be removed from public responses.

## Phase 2: Accounts

**What we know (checked on staging, 3 Nov, without creating anything)**

- Sign-in: `POST onboard/login` with `email` and `password`. Errors come back as HTTP 422
  `{ header: "Form Error", status: false, message }`, one message at a time. What a successful sign-in
  returns (where the token is, how long it lasts) still has no example.
- Sign-up is the full form ("New Registration"): `username`, `firstName`, `lastName` and `email` are
  required (in that order); the example also sends `password`, `confirmedPassword`, `countryId`,
  `mobileOperatorId`, `telephone` and `referralCode`. Success sends an email with a link to `onboard/verify`.
- Countries (193), mobile operators (MTN, Glo, Airtel, "T-Mobile NG") and user types (Creator, Reader) are
  public lists under `selectables/`.
- Forgot password sends an email; there's no endpoint for choosing the new password except `set-password`.

**What was built (3 Nov)**

- Sign in, join (the full form: first and last name, username, email, Nigerian phone number, network with
  MTN first, password, terms), forgot password, and resending the verification email, all through our
  server (`src/lib/api/account.ts`, `src/app/auth/actions.ts`). "Continue with Google" is hidden while
  accounts are live (no endpoint).
- The token is kept in the httpOnly `tc-access` cookie for as long as it lasts (92 days); the browser
  only learns who's signed in from `/api/session`. Signing out forgets the token (there's no sign-out
  endpoint, so it stays valid on the backend until it expires).
- Every component that used the demo reader now gets the real one when `accounts` is live; liking,
  following or saving while signed out sends the reader to sign in and back.
- Signed-in readers get real pages for episodes after the first (the reader sends their token).
- Tested on staging with a test reader (login in `.env.local`, git-ignored): wrong password, sign-in,
  session, token cookie not readable by page scripts, episode 2 real pages, sign-out.

**How to try it**: in `.env.local`, point `TOON_API_BASE_URL` at the staging server and set
`TOON_API_LIVE=reading,accounts`, restart the dev server, and sign in with the test reader.
Don't switch `accounts` on against production until the backend findings below are fixed.

**Settings (built 3 Nov)**: with accounts live, Settings saves first and last name, username, bio,
date of birth, phone and network to the account (`PATCH profile/update`), uploads a photo (shrunk to
512×512 in the browser first) and changes the password. Our server checks the current password by signing
in with it before changing anything (the backend doesn't ask for it). Email is shown but can't be changed
(no endpoint). Invite links carry the reader's referral code and the join form passes it on. Tested on
staging with the test reader: profile save, date-of-birth check, phone check, wrong current password,
password change and back. The photo upload fails on staging (finding 10).

**Not built yet**: the page the verification and reset email links open (we don't know where they point),
choosing a new password after a reset (waits on finding 2), Google sign-in, and real follower and
referral counts on `/me`.

**For the backend team (Phase 2 findings)**

1. **Sign-up returns the verification code** in its response (`data`). Anyone can then verify an email
   address they don't own. The code must only go out by email.
2. **`set-password` takes only an email** and the new password, with no code or token. If it works on an
   existing account, anyone can take over any account by its email. It needs the reset code from the email.
3. Sign-in and forgot password answer "This email address does not exists", which tells anyone whether an
   email has an account. Use one message for wrong email or password, and "If that email has an account,
   we've sent a link" for resets. Sign-in also needs rate limiting.
4. One example of a successful sign-in response, and how the token expires and is refreshed.
5. Which page the verify and reset email links open (ours, so we can build it), and Google sign-in, if wanted.
6. "T-Mobile NG" in the mobile operators list is probably meant to be 9mobile.
7. **Reset emails don't arrive** (same on the live site). `onboard/forgot-password` answers 200 "A mail has
   been sent…", so the request works; the email isn't delivered. Check the mail queue worker, mail settings
   and spam (SPF/DKIM for the sending domain). Worth checking the sign-up verification email too.
8. Forgot password also returns a code in `data`, like sign-up. If that's the reset code, anyone can reset any
   account without the email. It must only go out by email.
9. `profile/change-password` doesn't ask for the current password, so anyone holding a signed-in device can
   lock the owner out.
10. **Photo upload fails** on staging: `profile/upload-image` answers 500 "Server Error" for a normal
    400×400 JPEG (a non-image gets a proper 422). Probably the image storage settings on that server.
11. **One session per account**: every sign-in cancels the previous token, so signing in on a phone signs
    the reader out on their laptop. Intended? Most readers use more than one device.
12. Profile saves **require a date of birth and refuse anyone under 18**, though sign-up doesn't ask for
    one. Is Toon Central 18+ only? If not, younger readers can never edit their profile.
13. Profile update **doesn't validate**: it accepted "x" as a username and "123" as a phone number. (Our
    forms check, but the API should too.)
14. A failed sign-in answers **HTTP 200** with `status: false`. Use 401/422 so clients can't mistake it
    for success.

## Phase 3: Reader actions

**What the endpoints do (checked on staging with the test reader, 3 Nov)**

| Action | Endpoint | Behaviour |
|---|---|---|
| Like a comic | `GET comics/:uuid/like` | Toggles; the message says "liked" or "unliked" |
| Liked comics | `GET user-likes` | The reader's liked comics; 404 "no likes found" when none |
| Save to library | `GET comics/:uuid/add-to-favourite` | Adds only; calling it again changes nothing |
| Library | `GET comics/favourites` | The reader's saved comics, paged |
| Follow / unfollow | `GET profile/:id/follow`, `/unfollow` | Safe to repeat; needs the creator's user id |
| Follow status | `GET profile/:id/check-follow-status` | `true` / `false` |
| Like a short | `GET shorts/:uuid/like` (and `/dislike`) | Toggles, like comics |
| Short comments | `GET short-comments/:uuid`, `POST short-comments/:uuid/add-comment` | By the short's uuid; public to read; newest first; empty comment refused (422) |
| Comic comments | `GET comments/:id`, `POST comments/:id/add-comment` | By the comic's number id (the uuid gives 500) |
| Episode comments | `GET episode-comments/:id`, `POST episode-comments/:id/add-episode-comment` | By the episode id |
| Subscribe | `GET comics/:uuid/subscribe` | **500 Server Error** |

**What was built (3 Nov)**

- Switch: `readerActions` in `TOON_API_LIVE` (needs `accounts` too). Off, everything stays in the browser
  as before.
- Comic likes and the library load from the account once per page (`user-likes` and `comics/favourites`)
  and every like, save and follow goes to the backend (`src/lib/api/readerActions.ts`,
  `src/app/actions/reader.ts`). Buttons change straight away and go back if the backend refuses.
- Follow buttons ask the backend whether the reader follows that creator, so the state is right on any device.
- The comic page's like count comes from opening the comic (not the 5-minute cached catalogue), so it
  includes the reader's latest like.
- Shorts: likes go to the backend; the comments drawer shows the real comments (name and photo only)
  and posts new ones. Anyone can read them; posting needs sign-in.
- Signed out with live actions, the buttons send the reader to sign in. Signing out wipes the copy of
  the reader's likes, library and follows kept in the browser.
- Tested in a browser on staging: like, save, follow, then wipe the browser's copy and reload (the
  state came back from the backend), undo all three, short comments read and post, short like and unlike,
  sign-out.

**Views (4 Nov)**: the backend counts a view on `comics/:uuid/view` and on the episode endpoint (every
call when signed out, once per reader when signed in), and on `shorts/:uuid/view` (`infinite-view` counts
nothing). We count: opening a comic page (once per visit, from the browser), opening an episode
(episode 1 now for signed-out readers too, with real pages; never for crawlers), and a short once it
has played for 3 seconds (once per short per visit). List endpoints show counts the backend has cached,
so new views take a while to appear there.

**Still in the browser only**: subscribing (finding 15), saved shorts and comment likes (no endpoints).
Taking a comic out of the library only hides it in that browser (finding 16).

**Not built yet**: comment sections for comics and episodes (the endpoints work; the site has no
comment UI there yet).

**For the backend team (Phase 3 findings)**

15. **Subscribe fails**: `comics/:uuid/subscribe` answers 500 every time.
16. **No way to remove a comic from favourites.** `add-to-favourite` only adds. Please add a remove (or
    make it toggle, like `like`), otherwise the library only grows.
17. **`comics/subscribed` lists every reader's subscriptions**, with their email, date of birth and phone,
    and works with no token. It should return only the signed-in reader's.
18. **Comments expose commenters' private details**: each comment (comic, episode and short) carries the
    commenter's whole account (email, phone, date of birth). Our server strips them, but anyone can call
    the API directly. Send only username and photo.
19. No list of the creators a reader follows (we check one creator at a time), and no list of liked
    shorts. Both are needed for the library's Following tab and the shorts feed on a new device.
20. Like, follow, favourite and subscribe are GET requests that change data (also question 6 above).
    Browsers, crawlers and link previews can trigger them. They should be POST.
21. Signed-out views count on every call, so one visitor refreshing can inflate a comic's or short's
    views. Counting once per visitor (by IP or a device id) per day would match how signed-in views work.
