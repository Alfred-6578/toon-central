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
| 2. Accounts | `accounts` | Register, verify, sign in/out, reset password, profile, avatar | |
| 3. Reader actions | `readerActions` | Likes, subscribe, library (favourites), follow, comments, view counts | |
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

**Not real yet, waiting on the backend**

- **Episode lists and episode pages.** The only endpoint with them, `comics/:uuid/view`, adds a view every
  time it's called (checked: 51 → 52), so our server can't use it to build pages. Comic pages keep the
  numbered placeholder list, and the reader keeps its stand-in pages.

**How to review**

1. Open the site on your dev server and click through: home, Discover, a comic, a genre, originals,
   New & Popular, shorts, a creator page, and search (try "black").
2. Check that the comics, covers and counts match the test server (expect its test comics, e.g. "knnkn,").
3. `/dev/api` shows **Public reading: Live**.
4. Covers can take a few seconds the first time: Cloudinary makes each resized copy on first request.

**For the backend team (Phase 1 findings)**

1. A read-only comic details endpoint (e.g. `GET comics/:uuid`) that returns the comic and its episodes
   **without** counting a view. Count views with a separate POST when someone actually opens the comic.
2. **Paywall:** each page in an episode comes with its full image link plus `is_lock`. Locked pages must not
   include the real image link (send a blurred preview, or nothing, until the reader has unlocked it).
   Otherwise anyone can read paid pages. Fix before Phase 4.
3. Image links contain creators' email addresses (e.g. `.../Reader/someone%40gmail.com/...`), and comic
   responses include the creator's email and phone. Both should be removed from public responses.
