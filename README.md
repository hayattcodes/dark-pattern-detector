# Dark Pattern Detector

A Chrome extension that detects manipulative UI design called dark patterns on Indian e-commerce websites in real time. Built from scratch using vanilla JavaScript, Chrome Extension APIs (Manifest V3), and a rule based NLP classifier trained on Princeton's labeled dark pattern dataset.

## Overview

Dark patterns are interface design choices that trick users into doing things they didn't intend paying hidden fees, accepting cookie tracking, or subscribing to services they never chose. This extension silently scans every page you visit, flags these patterns with visual highlights and tooltips, and generates a manipulation score alongside a downloadable CCPA India 2023 compliance report.

```
User visits website
       |
       v
  content.js injects into page
       |
       v
  DOM Analysis + MutationObserver
       |
       v
  14 Pattern Detectors run in parallel
       |
       v
  Severity Scoring Engine
       |
       v
  Visual Highlights + Tooltip overlays
       |
       v
  Popup badge + Side Panel Report + PDF Export
```

## Project Structure

```
dark-pattern-detector/
├── extension/
│   ├── manifest.json              # MV3 extension config
│   ├── content.js                 # Main scanner — injected into every page
│   ├── background.js              # Service worker — badge + history
│   ├── config.js                  # API config (gitignored)
│   ├── popup.html                 # Extension popup UI
│   ├── popup.js                   # Popup logic
│   ├── popup.css                  # Popup styles
│   ├── sidepanel.html             # Full report side panel
│   ├── sidepanel.js               # Side panel logic + PDF export
│   ├── jspdf.min.js               # PDF generation (local, no CDN)
│   └── test-pages/
│       ├── test-trick.html        # Trick questions test
│       ├── test-confirmshaming.html
│       ├── test-hiddencost.html
│       ├── test-checkout.html
│       ├── test-consent.html
│       ├── test-countdown.html
│       └── test-nagging.html
└── .gitignore
```

## Detectors

The extension runs 14 independent detection modules on every page load and DOM mutation.

### Rule-Based Detectors

| Detector | CCPA Rule | Method | Severity |
|---|---|---|---|
| Fake Countdown Timer | Rule 1 — False Urgency | MutationObserver + behavioral polling | 7–8 |
| Scarcity Manipulation | Rule 2 — Scarcity | Lexical pattern matching | 5–6 |
| Social Proof Manipulation | Rule 3 — Social Proof | Regex on text nodes | 4 |
| Basket Sneaking | Rule 4 — Basket Sneaking | Pre-checked item detection | 7–9 |
| Forced Action | Rule 5 — Forced Action | Phrase matching on CTAs | 8 |
| Hidden Costs | Rule 7 — Drip Pricing | Price state machine across pages | 9 |
| Hidden Subscription | Rule 8 — Subscription Trap | Font-size asymmetry via getComputedStyle | 8 |
| Trick Questions | Rule 9 — Trick Questions | Double-negative detection + pre-check mismatch | 6–7 |
| Asymmetric Consent UI | Rule 10 — Interface Interference | CMP fingerprinting + click-depth analysis | 7–9 |
| Confirm Shaming | Rule 11 — Confirm Shaming | Lexical classifier on CTA buttons | 5 |
| Nagging | Rule 12 — Nagging | Modal fingerprinting + dismissal counter | 4 |
| SaaS Billing | Rule 13 — SaaS Billing | Billing term detection + font-size check | 5–8 |
| Hindi Dark Patterns | India-specific | Devanagari script phrase matching | 5–7 |
| Third-Party Services | Mathur et al. 2019 | Script source fingerprinting | 6 |

### Detection Architecture

**Fake Timer** uses a two-pass behavioral approach — discovery pass on page load, then a 500ms polling interval watching for post-expiry resets. If the timer reaches `00:00` and resets to its original value within 3 seconds, it is flagged with 95% confidence. If the offer text is unchanged after expiry, it flags at 80% confidence. This mirrors the checkout crawler behavioral observation pattern from Mathur et al. 2019.

**Hidden Costs** implements a three-state machine per domain stored in `chrome.storage.local`:
```
IDLE → PRICE_OBSERVED (product page) → CHECKOUT → FLAGGED / CLEAR
```
Price is extracted via schema.org `itemprop="price"`, JSON-LD Product markup, then a fallback chain of platform-specific CSS selectors (`.a-price` for Amazon, `.woocommerce-Price-amount` for WooCommerce). A price increase above 5% at checkout that was not disclosed at the product page stage triggers a red alert banner.

**Asymmetric Consent** uses CMP fingerprinting derived from the CookieBlock ETH Zürich consent crawler — recognising OneTrust, Cookiebot, TrustArc, Quantcast, Usercentrics, and Hostinger's custom wrapper by DOM selector. It then maps buttons to ACCEPT_PATH and REJECT_PATH, estimates click depth without clicking, and flags when the depth differential exceeds 2 or when no reject option is visible on the first screen.

**Trick Questions** resolves label text using four methods in order — `for` attribute → wrapping `label` → `aria-labelledby` → `aria-label` — then runs negation token counting and pre-check mismatch detection. Two or more negation signals in a single label trigger a yellow flag with confidence proportional to negation count.

**Confirm Shaming** uses a lexical classifier built from Princeton's labeled dataset and Harry Brignull's deceptive.design catalog — covering self-deprecation, financial self-harm framing, knowledge insults, and FOMO framing — applied to all interactive elements under 120 characters.

**Third-Party Services** checks all `<script src>` attributes and inline script content against 17 known dark pattern service providers documented in Mathur et al. 2019 — including OptinMonster, ProveSource, FOMO, Hurrify, Klaviyo, and others.

## Severity Scoring

Each finding carries a base severity and a confidence score. The page-level score is:

```
page_score = max_finding_severity + floor(log2(finding_count))
```

This rewards pages with many patterns without letting low-severity floods overwhelm a single serious finding. A page with one severity-8 finding scores 8. A page with six severity-5 findings scores `5 + floor(log2(6)) = 7`.

| Score | Risk Level | Badge Color |
|---|---|---|
| 1–3 | Low Risk | 🟢 Green |
| 4–6 | Moderate | 🟡 Yellow |
| 7–10 | High Manipulation | 🔴 Red |

## Research Basis

Every detector traces back to a published paper or dataset.

| Component | Source |
|---|---|
| Pattern taxonomy | AidUI unified 27-class taxonomy (Gray et al. 2024) |
| Training corpus | yamanalab/ec-darkpattern (2,356 samples) + Mathur et al. Princeton 2019 (1,818 samples) |
| Confirm shaming patterns | deceptive.design catalog (Brignull) + annthegran.com examples |
| CMP fingerprints | CookieBlock consent crawler (ETH Zürich) |
| Third-party service list | Mathur et al. 2019 — 22 known dark pattern providers |
| Checkout behavioral logic | Mathur et al. 2019 checkout crawler architecture |
| Severity weighting | AidUI taxonomy harm classifications |
| CCPA compliance mapping | Central Consumer Protection Authority India, Guidelines 2023 |

## CCPA India 2023 Coverage

The extension covers 12 of the 13 officially banned dark patterns under India's CCPA Guidelines (30 November 2023).

| Rule | Pattern | Covered |
|---|---|---|
| Rule 1 | False Urgency | ✅ |
| Rule 2 | Scarcity | ✅ |
| Rule 3 | Social Proof Manipulation | ✅ |
| Rule 4 | Basket Sneaking | ✅ |
| Rule 5 | Forced Action | ✅ |
| Rule 6 | Bait and Switch | ❌ Post-purchase, outside extension scope |
| Rule 7 | Drip Pricing | ✅ |
| Rule 8 | Subscription Trap | ✅ |
| Rule 9 | Trick Questions | ✅ |
| Rule 10 | Interface Interference | ✅ |
| Rule 11 | Confirm Shaming | ✅ |
| Rule 12 | Nagging | ✅ |
| Rule 13 | SaaS Billing | ✅ |

## Features

**Visual Heatmap** — A floating `🗺️ Show Heatmap` button appears on pages where patterns are detected. Clicking it overlays numbered, color-coded markers directly on flagged elements — red for high-severity, yellow for moderate.

**PDF Compliance Report** — The side panel generates a downloadable PDF containing the site's risk score, all findings with severity and confidence, CCPA rule violations, and research citations — using jsPDF running entirely in-browser.

**Site History Tracking** — The extension records each site visit's score and pattern count in `chrome.storage.local`. The side panel displays the last 5 visits with a trend indicator — whether the site is getting worse, better, or staying the same.

**Hindi Language Detection** — Detects dark pattern phrases written in Devanagari script — scarcity claims like `सिर्फ 2 बचे हैं`, urgency phrases like `जल्दी करें`, hidden fees like `सुविधा शुल्क`, and confirm shaming like `नहीं, मुझे बचत नहीं चाहिए`.

**On-Device Processing** — No data leaves the browser. No server calls, no analytics, no tracking.

## Installation (Developer Mode)

**Prerequisites**
- Chrome 114+ (for Side Panel API)
- No build step required — plain JavaScript, no bundler

**Steps**
```
1. Clone the repository
   git clone https://github.com/hayattcodes/dark-pattern-detector.git

2. Open Chrome and go to
   chrome://extensions

3. Enable Developer Mode (top right toggle)

4. Click Load Unpacked

5. Select the extension/ folder

6. Visit any Indian e-commerce site
```

## Test Pages

Seven local HTML test pages are included in `extension/test-pages/` — one for each major detector. Load them via `File → Open File` in Chrome after installing the extension.

| File | Tests |
|---|---|
| `test-trick.html` | Double negative checkbox, pre-checked opt-out |
| `test-confirmshaming.html` | Guilt-tripping decline buttons |
| `test-hiddencost.html` | Product page price baseline |
| `test-checkout.html` | Hidden fee detection at checkout |
| `test-consent.html` | Asymmetric accept/reject cookie banner |
| `test-countdown.html` | Fake timer that resets at zero |
| `test-nagging.html` | Modal that reappears after dismissal |

## Verified On

| Site | Patterns Detected |
|---|---|
| amazon.in | Scarcity, Social Proof, Asymmetric Consent |
| hostinger.com | Asymmetric Consent (reject hidden) |
| bookmyshow.com | Hidden Cost (convenience fee), Basket Sneaking |
| nykaa.com | Nagging |
| makemytrip.com | Basket Sneaking (travel insurance) |

## Limitations

- Bait and Switch (CCPA Rule 6) is post-purchase and cannot be detected by a browser extension
- Visual dark patterns (small cancel buttons, low-contrast reject options) require computer vision — not currently implemented
- NLP confirm shaming classifier is rule-based — a fine-tuned transformer would improve recall on novel phrasing
- Hindi detector covers common patterns only — regional language coverage is incomplete

## References

- Mathur, A. et al. (2019). Dark Patterns at Scale: Findings from a Crawl of 11K Shopping Websites. *Princeton University*. https://arxiv.org/abs/1907.07032
- Gray, C. et al. (2018). The Dark (Patterns) Side of UX Design. *CHI Conference, Cornell*. https://dl.acm.org/doi/10.1145/3173574.3174108
- Gray, C. et al. (2024). Towards an Ontology of Dark Patterns. *AidUI Unified Taxonomy*.
- Mathur, A. et al. (2021). What Makes a Dark Pattern Dark? *Princeton*. https://dl.acm.org/doi/10.1145/3411764.3445610
- Central Consumer Protection Authority. (2023). Guidelines for Prevention and Regulation of Dark Patterns. *Government of India*. https://consumeraffairs.nic.in
- arxiv.org/abs/2604.02257 — Dark Patterns in Indian Quick Commerce Apps (2026)
- CookieBlock Consent Crawler — ETH Zürich. https://github.com/dibollinger/CookieBlock

## Author

**Hayatt Khan**
Computer Science and Engineering
Father Conceicao Rodrigues College of Engineering, Bandra, Mumbai
GitHub: https://github.com/hayattcodes/dark-pattern-detector
