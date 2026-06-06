// Extension context check
if (typeof chrome === 'undefined' || !chrome.runtime) {
  console.log('Extension context not available')
} else {

console.log('🔍 Dark Pattern Detector loaded on:', window.location.hostname)

const findings = []
// ─────────────────────────────────────────
// CCPA INDIA 2023 — 13 Banned Dark Patterns
// ─────────────────────────────────────────

const CCPA_MAPPING = {
  'FAKE_URGENCY': {
    ccpaRule: 'Rule 1 — False Urgency',
    ccpaDescription: 'Creating false sense of urgency or scarcity to pressure consumers',
    penalty: 'Punishable under Consumer Protection Act 2019'
  },
  'FAKE_TIMER': {
    ccpaRule: 'Rule 1 — False Urgency',
    ccpaDescription: 'Fake countdown timers that reset — creating artificial deadline pressure',
    penalty: 'Punishable under Consumer Protection Act 2019'
  },
  'HIDDEN_COST': {
    ccpaRule: 'Rule 7 — Drip Pricing',
    ccpaDescription: 'Revealing hidden charges only at final checkout stage',
    penalty: 'Punishable under Consumer Protection Act 2019'
  },
  'HIDDEN_SUB': {
    ccpaRule: 'Rule 7 — Drip Pricing',
    ccpaDescription: 'Hidden subscription charges not disclosed prominently',
    penalty: 'Punishable under Consumer Protection Act 2019'
  },
  'HIDDEN_SUBSCRIPTION': {
    ccpaRule: 'Rule 8 — Subscription Trap',
    ccpaDescription: 'Free trial converting to paid without clear disclosure',
    penalty: 'Punishable under Consumer Protection Act 2019'
  },
  'TRICK_QUESTION': {
    ccpaRule: 'Rule 9 — Trick Questions',
    ccpaDescription: 'Confusing or trick questions to obtain unintended consent',
    penalty: 'Punishable under Consumer Protection Act 2019'
  },
  'ASYMMETRIC_CONSENT': {
    ccpaRule: 'Rule 10 — Interface Interference',
    ccpaDescription: 'UI designed to make rejection harder than acceptance',
    penalty: 'Punishable under Consumer Protection Act 2019'
  },
  'CONFIRM_SHAMING': {
    ccpaRule: 'Rule 11 — Confirm Shaming',
    ccpaDescription: 'Using guilt or shame to manipulate consumer choices',
    penalty: 'Punishable under Consumer Protection Act 2019'
  },
  'SCARCITY': {
    ccpaRule: 'Rule 2 — Scarcity',
    ccpaDescription: 'False or misleading scarcity claims to pressure purchase',
    penalty: 'Punishable under Consumer Protection Act 2019'
  },
  'SOCIAL_PROOF': {
    ccpaRule: 'Rule 3 — Social Proof Manipulation',
    ccpaDescription: 'Unverifiable social proof claims used as pressure tactics',
    penalty: 'Punishable under Consumer Protection Act 2019'
  },
  'NAGGING': {
    ccpaRule: 'Rule 12 — Nagging',
    ccpaDescription: 'Repeatedly interrupting user with same request after dismissal',
    penalty: 'Punishable under Consumer Protection Act 2019'
  },
  'FAKE_URGENCY': {
    ccpaRule: 'Rule 1 — False Urgency',
    ccpaDescription: 'Misleading urgency language to pressure immediate action',
    penalty: 'Punishable under Consumer Protection Act 2019'
  }
}

function getCCPAInfo(patternType) {
  return CCPA_MAPPING[patternType] || null
}

// ─────────────────────────────────────────
// UTILITY — Find label text for a checkbox
// ─────────────────────────────────────────

function getLabelText(input) {
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`)
    if (label) return label.innerText.trim()
  }
  const parent = input.closest('label')
  if (parent) return parent.innerText.trim()
  const labelledBy = input.getAttribute('aria-labelledby')
  if (labelledBy) {
    const el = document.getElementById(labelledBy)
    if (el) return el.innerText.trim()
  }
  const ariaLabel = input.getAttribute('aria-label')
  if (ariaLabel) return ariaLabel.trim()
  return ''
}

// ─────────────────────────────────────────
// UTILITY — Add finding
// ─────────────────────────────────────────

function addFinding(patternType, severity, confidence, evidence, element) {
  findings.push({
    patternType,
    severity,
    confidence,
    evidence,
    element,
    timestamp: Date.now(),
    domain: window.location.hostname,
    url: window.location.href
  })
}

// ─────────────────────────────────────────
// UTILITY — Highlight element
// ─────────────────────────────────────────

function highlightElement(element, message, color = '#ef4444') {
  if (!element) return
  if (element.dataset.dpDetected) return
  element.dataset.dpDetected = 'true'

  element.style.outline = `2px solid ${color}`
  element.style.outlineOffset = '2px'

  const tooltip = document.createElement('div')
  tooltip.style.cssText = `
    position: absolute;
    background: #1a1a1a;
    color: #fff;
    font-size: 12px;
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid ${color};
    z-index: 999999;
    max-width: 260px;
    line-height: 1.4;
    pointer-events: none;
    font-family: -apple-system, sans-serif;
  `
  tooltip.textContent = `⚠️ ${message}`

  element.addEventListener('mouseenter', () => {
    document.body.appendChild(tooltip)
    const rect = element.getBoundingClientRect()
    tooltip.style.top = `${window.scrollY + rect.bottom + 6}px`
    tooltip.style.left = `${window.scrollX + rect.left}px`
  })
  element.addEventListener('mouseleave', () => {
    if (tooltip.parentNode) tooltip.parentNode.removeChild(tooltip)
  })
}

// ─────────────────────────────────────────
// MODULE 1 — Trick Questions
// ─────────────────────────────────────────

function detectTrickQuestions() {
  const checkboxes = document.querySelectorAll(
    'input[type="checkbox"], input[type="radio"]'
  )

  checkboxes.forEach(input => {
    const labelText = getLabelText(input).toLowerCase()
    if (!labelText) return

    const negationWords = [
      'not', 'no ', 'without', 'never',
      'uncheck', 'untick', 'deselect',
      'opt-out', 'opt out', 'remove',
      'decline', 'unsubscribe'
    ]

    let negationCount = 0
    negationWords.forEach(word => {
      if (labelText.includes(word)) negationCount++
    })

    if (negationCount >= 2) {
      const confidence = Math.min(0.9, negationCount * 0.3)
      addFinding('TRICK_QUESTION', 6, confidence,
        `Double negative in label: "${labelText}"`, input)
      highlightElement(input,
        `Confusing language: "${labelText}". Read carefully!`, '#f59e0b')
      console.log('⚠️ Trick Question found:', labelText)
      return
    }

    const optOutWords = [
      'unsubscribe', 'remove', 'opt out',
      'opt-out', 'do not', "don't", 'stop'
    ]
    const hasOptOut = optOutWords.some(word => labelText.includes(word))

    if (input.checked && hasOptOut) {
      addFinding('TRICK_QUESTION', 7, 0.85,
        `Pre-checked opt-out: "${labelText}"`, input)
      highlightElement(input,
        `Pre-checked opt-out! Leaving this checked may mean you AGREE to something unwanted.`,
        '#ef4444')
      console.log('🚨 Pre-checked opt-out found:', labelText)
    }
  })
}

// ─────────────────────────────────────────
// MODULE 2 — Basic Pattern Scanner
// ─────────────────────────────────────────

function scanBasicPatterns() {
  const bodyText = document.body.innerText.toLowerCase()

  const patterns = [
    { phrase: 'only 1 left',        type: 'SCARCITY',     severity: 6 },
    { phrase: 'only 2 left',        type: 'SCARCITY',     severity: 6 },
    { phrase: 'only 3 left',        type: 'SCARCITY',     severity: 5 },
    { phrase: 'hurry',              type: 'FAKE_URGENCY', severity: 4 },
    { phrase: 'offer ends in',      type: 'FAKE_URGENCY', severity: 6 },
    { phrase: 'limited time',       type: 'FAKE_URGENCY', severity: 5 },
    { phrase: 'people viewing',     type: 'SOCIAL_PROOF', severity: 4 },
    { phrase: 'people are viewing', type: 'SOCIAL_PROOF', severity: 4 },
    { phrase: 'last purchased',     type: 'SOCIAL_PROOF', severity: 4 },
    { phrase: 'free trial',         type: 'HIDDEN_SUB',   severity: 7 },
    { phrase: 'convenience fee',    type: 'HIDDEN_COST',  severity: 8 },
    { phrase: 'handling charge',    type: 'HIDDEN_COST',  severity: 8 },
  ]

  patterns.forEach(pattern => {
    if (bodyText.includes(pattern.phrase)) {
      addFinding(pattern.type, pattern.severity, 0.7, pattern.phrase, null)
    }
  })
}

// ─────────────────────────────────────────
// MODULE 3 — Hidden Costs
// ─────────────────────────────────────────

function extractPrice() {
  const schemaMeta = document.querySelector('meta[itemprop="price"]')
  if (schemaMeta) {
    const price = parseFloat(schemaMeta.getAttribute('content'))
    if (!isNaN(price)) return price
  }

  const jsonLd = document.querySelector('script[type="application/ld+json"]')
  if (jsonLd) {
    try {
      const data = JSON.parse(jsonLd.textContent)
      if (data.offers && data.offers.price) {
        return parseFloat(data.offers.price)
      }
    } catch (e) {}
  }

  const priceSelectors = [
    '.price', '#price', '[class*="price"]',
    '[class*="total"]', '[class*="amount"]',
    '.a-price .a-offscreen',
    '.woocommerce-Price-amount',
    '[data-price]'
  ]

  for (const selector of priceSelectors) {
    const el = document.querySelector(selector)
    if (el) {
      const text = el.textContent || el.getAttribute('data-price') || ''
      const cleaned = text.replace(/[^0-9.]/g, '')
      const price = parseFloat(cleaned)
      if (!isNaN(price) && price > 0) return price
    }
  }
  return null
}

function isCheckoutPage() {
  const url = window.location.href.toLowerCase()
  const checkoutUrls = ['/checkout', '/cart', '/order', '/payment', '/billing', '/buy']
  const isCheckoutUrl = checkoutUrls.some(path => url.includes(path))
  const hasPaymentForm = !!(
    document.querySelector('input[type="credit-card"]') ||
    document.querySelector('[class*="payment"]') ||
    document.querySelector('[class*="checkout"]') ||
    document.querySelector('[id*="checkout"]')
  )
  return isCheckoutUrl || hasPaymentForm
}

function detectHiddenCosts() {
  const currentPrice = extractPrice()
  if (!currentPrice) return

  const storageKey = `dp_price_${window.location.hostname}`

  if (isCheckoutPage()) {
    chrome.storage.local.get([storageKey], (result) => {
      const stored = result[storageKey]
      if (!stored) return

      const originalPrice = stored.price
      const difference = currentPrice - originalPrice
      const percentageIncrease = (difference / originalPrice) * 100

      console.log(`💰 Price: ₹${originalPrice} → ₹${currentPrice} (${percentageIncrease.toFixed(1)}%)`)

      if (percentageIncrease > 5) {
        addFinding('HIDDEN_COST', 9, 0.95,
          `Price up from ₹${originalPrice} to ₹${currentPrice} (+${percentageIncrease.toFixed(1)}%)`,
          null)
        showHiddenCostAlert(originalPrice, currentPrice, difference, percentageIncrease)
        console.log(`🚨 Hidden cost! +₹${difference.toFixed(2)}`)
      }
    })
  } else {
    chrome.storage.local.set({
      [storageKey]: {
        price: currentPrice,
        url: window.location.href,
        timestamp: Date.now()
      }
    })
    console.log(`💾 Price stored: ₹${currentPrice}`)
  }
}

function showHiddenCostAlert(original, current, difference, percentage) {
  if (document.getElementById('dp-cost-alert')) return

  const alert = document.createElement('div')
  alert.id = 'dp-cost-alert'
  alert.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    background: #1a1a1a;
    color: #fff;
    border: 2px solid #ef4444;
    border-radius: 10px;
    padding: 14px 18px;
    z-index: 999999;
    max-width: 300px;
    font-family: -apple-system, sans-serif;
    font-size: 13px;
    line-height: 1.5;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  `
  alert.innerHTML = `
    <div style="font-weight:600;color:#ef4444;margin-bottom:8px;">
      🚨 Hidden Cost Detected!
    </div>
    <div>Original price: <b>₹${original}</b></div>
    <div>Current total: <b>₹${current}</b></div>
    <div style="color:#ef4444;margin-top:6px;">
      ⬆️ +₹${difference.toFixed(2)} (+${percentage.toFixed(1)}%)
    </div>
    <div style="color:#888;font-size:11px;margin-top:8px;">
      Extra charges not shown on product page
    </div>
    <button onclick="this.parentNode.remove()" style="
      margin-top:10px;background:#333;border:none;
      color:#fff;padding:4px 10px;border-radius:4px;
      cursor:pointer;font-size:11px;">Dismiss</button>
  `
  document.body.appendChild(alert)
}

// ─────────────────────────────────────────
// MODULE 4 — Asymmetric Consent UI
// ─────────────────────────────────────────

function detectAsymmetricConsent() {
  const cmpSelectors = [
    '#onetrust-banner-sdk',
    '#CybotCookiebotDialog',
    '#truste-consent-track',
    '.qc-cmp2-container',
    '#usercentrics-root',
    '[class*="cookie-banner"]',
    '[class*="cookie-consent"]',
    '[id*="cookie-banner"]',
    '[id*="consent-banner"]',
    '.h-cookie-consent-wrapper'
  ]

  let consentBanner = null
  for (const selector of cmpSelectors) {
    const el = document.querySelector(selector)
    if (el) { consentBanner = el; break }
  }

  if (!consentBanner) {
    const dialogs = document.querySelectorAll('[role="dialog"], [role="alertdialog"]')
    dialogs.forEach(dialog => {
      const text = dialog.innerText.toLowerCase()
      if (text.includes('cookie') || text.includes('consent') || text.includes('privacy')) {
        consentBanner = dialog
      }
    })
  }

  if (!consentBanner) return
  console.log('🍪 Consent banner found:', consentBanner)

  const acceptWords = ['accept all', 'accept', 'allow all', 'allow', 'agree', 'ok', 'got it', 'i agree']
  const rejectWords = ['reject all', 'reject', 'decline', 'necessary only', 'manage', 'preferences', 'settings', 'manage preferences']

  let acceptButton = null
  let rejectButton = null

  const allButtons = consentBanner.querySelectorAll('button, a, [role="button"]')
  allButtons.forEach(btn => {
    const text = btn.innerText.toLowerCase().trim()
    if (!acceptButton && acceptWords.some(w => text.includes(w))) acceptButton = btn
    if (!rejectButton && rejectWords.some(w => text.includes(w))) rejectButton = btn
  })

  if (acceptButton && !rejectButton) {
    addFinding('ASYMMETRIC_CONSENT', 8, 0.9,
      'Reject option missing from consent banner', consentBanner)
    highlightElement(acceptButton,
      'No Reject All option visible. Accepting is the only easy choice.', '#ef4444')
    console.log('🚨 Reject button missing!')
    return
  }

  if (!acceptButton || !rejectButton) return

  const acceptRect = acceptButton.getBoundingClientRect()
  const rejectRect = rejectButton.getBoundingClientRect()
  const acceptArea = acceptRect.width * acceptRect.height
  const rejectArea = rejectRect.width * rejectRect.height

  if (acceptArea > 0 && rejectArea > 0) {
    const ratio = rejectArea / acceptArea
    if (ratio < 0.6) {
      addFinding('ASYMMETRIC_CONSENT', 7, 0.85,
        `Reject button is ${(ratio * 100).toFixed(0)}% size of Accept`, rejectButton)
      highlightElement(rejectButton,
        'Reject button is much smaller than Accept — rejection is harder.', '#f59e0b')
      console.log('⚠️ Asymmetric button sizes')
    }
  }

  const rejectParent = rejectButton.closest('[style*="display:none"], [style*="display: none"], [hidden]')
  if (rejectParent) {
    addFinding('ASYMMETRIC_CONSENT', 9, 0.95,
      'Reject button hidden — requires extra clicks', consentBanner)
    highlightElement(acceptButton,
      'Rejecting cookies requires more steps than accepting.', '#ef4444')
    console.log('🚨 Reject hidden in nested panel!')
  }
}

// ─────────────────────────────────────────
// MODULE 5 — Countdown Timer
// ─────────────────────────────────────────

function detectCountdownTimers() {
  const timerSelectors = [
    '[class*="countdown"]', '[class*="timer"]',
    '[class*="clock"]', '[id*="countdown"]',
    '[id*="timer"]', '[data-countdown]',
    '[data-timer]', '[data-expiry]'
  ]

  const timerElements = []
  timerSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      if (!timerElements.includes(el)) timerElements.push(el)
    })
  })

  document.querySelectorAll('span, div, p').forEach(el => {
    const text = el.innerText || ''
    if (/\d{1,2}:\d{2}(:\d{2})?/.test(text) && el.children.length === 0) {
      if (!timerElements.includes(el)) timerElements.push(el)
    }
  })

  timerElements.forEach(el => observeTimer(el))
}

function getOfferContext() {
  let context = ''
  const selectors = ['h1', 'h2', '.price', '[class*="price"]', '[class*="offer"]']
  selectors.forEach(sel => {
    const el = document.querySelector(sel)
    if (el) context += el.innerText.trim()
  })
  return context
}

function observeTimer(timerEl) {
  const initialText = timerEl.innerText.trim()
  if (!initialText) return

  const offerText = getOfferContext()
  console.log(`⏱️ Timer found: "${initialText}"`)

  const interval = setInterval(() => {
    const currentText = timerEl.innerText.trim()

    if (/^0+:0+(:0+)?$/.test(currentText.replace(/\s/g, ''))) {
      setTimeout(() => {
        const afterText = timerEl.innerText.trim()
        const newOfferText = getOfferContext()

        if (afterText === initialText) {
          addFinding('FAKE_TIMER', 8, 0.95,
            `Timer reset after expiring — deadline is not real`, timerEl)
          highlightElement(timerEl,
            'This timer reset after expiring — the deadline is FAKE.', '#ef4444')
          console.log('🚨 Fake timer — reset detected!')
          clearInterval(interval)
        } else if (newOfferText === offerText) {
          addFinding('FAKE_TIMER', 7, 0.80,
            `Timer expired but offer unchanged`, timerEl)
          highlightElement(timerEl,
            'Timer expired but nothing changed — possibly fake urgency.', '#f59e0b')
          console.log('⚠️ Timer expired, offer unchanged')
          clearInterval(interval)
        }
      }, 3000)
    }
  }, 500)

  setTimeout(() => clearInterval(interval), 600000)
}

// ─────────────────────────────────────────
// MODULE 6 — Nagging Detector
// ─────────────────────────────────────────

function getModalFingerprint(el) {
  const heading = el.querySelector('h1, h2, h3, p')
  if (!heading) return null
  return heading.innerText
    .toLowerCase()
    .replace(/[0-9]/g, '')
    .replace(/[^a-z\s]/g, '')
    .trim()
    .substring(0, 50)
}

function handleModalSeen(modal, domain) {
  const fingerprint = getModalFingerprint(modal)
  if (!fingerprint) return

  const key = `dp_nag_${domain}_${fingerprint}`
  chrome.storage.local.get([key], (result) => {
    const data = result[key] || { appearances: 0, dismissals: 0 }
    data.appearances++
    chrome.storage.local.set({ [key]: data })
    console.log(`👁️ Modal seen ${data.appearances}x: "${fingerprint}"`)
  })
}

function handleModalDismissed(modal, domain) {
  const fingerprint = getModalFingerprint(modal)
  if (!fingerprint) return

  const key = `dp_nag_${domain}_${fingerprint}`
  chrome.storage.local.get([key], (result) => {
    const data = result[key] || { appearances: 0, dismissals: 0 }
    data.dismissals++
    chrome.storage.local.set({ [key]: data })
    console.log(`❌ Modal dismissed ${data.dismissals}x: "${fingerprint}"`)

    if (data.dismissals >= 2) {
      addFinding('NAGGING', 4, 0.85,
        `Same popup dismissed ${data.dismissals} times this session`, modal)
      showNaggingNotice(fingerprint, data.dismissals)
    }
  })
}

function showNaggingNotice(fingerprint, count) {
  if (document.getElementById('dp-nag-notice')) return

  const notice = document.createElement('div')
  notice.id = 'dp-nag-notice'
  notice.style.cssText = `
    position: fixed;
    bottom: 16px;
    right: 16px;
    background: #1a1a1a;
    color: #fff;
    border: 1px solid #f59e0b;
    border-radius: 8px;
    padding: 10px 14px;
    z-index: 999999;
    font-family: -apple-system, sans-serif;
    font-size: 12px;
    max-width: 260px;
    line-height: 1.5;
  `
  notice.innerHTML = `
    <div style="color:#f59e0b;font-weight:600;margin-bottom:4px;">
      ⚠️ Nagging Detected
    </div>
    <div>This popup dismissed <b>${count} times</b> this session.</div>
    <button onclick="this.parentNode.remove()" style="
      margin-top:8px;background:#333;border:none;
      color:#fff;padding:3px 8px;border-radius:4px;
      cursor:pointer;font-size:11px;">OK</button>
  `
  document.body.appendChild(notice)
}

function detectNagging() {
  const domain = window.location.hostname

  function isModal(el) {
    const style = window.getComputedStyle(el)
    const zIndex = parseInt(style.zIndex) || 0
    const hasClose = !!(
      el.querySelector('[aria-label*="close" i]') ||
      el.querySelector('[aria-label*="dismiss" i]') ||
      el.querySelector('button')
    )
    return (style.position === 'fixed' || style.position === 'sticky') &&
           zIndex > 100 && hasClose
  }

  const nagObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return
        if (isModal(node)) handleModalSeen(node, domain)
      })
    })
  })

  nagObserver.observe(document.body, { childList: true, subtree: true })

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button, [aria-label*="close" i], [aria-label*="dismiss" i]')
    if (!btn) return
    const modal = btn.closest('[style*="position: fixed"], [style*="position:fixed"]')
    if (modal) handleModalDismissed(modal, domain)
  })
}
// ─────────────────────────────────────────
// MODULE 7 — Confirm Shaming (NLP Upgraded)
// ─────────────────────────────────────────

async function detectConfirmShaming() {
  const buttons = document.querySelectorAll(
    'button, a, [role="button"], span[onclick], div[onclick]'
  )

  buttons.forEach(btn => {
    const text = btn.innerText.toLowerCase().trim()
    if (!text || text.length > 120 || text.length < 5) return

    const shamingPhrases = [
      "no thanks, i don't want",
      "no thanks, i like paying",
      "no thanks, i prefer paying",
      "i'll pay full price",
      "i like paying more",
      "i'd rather pay more",
      "i don't want to save",
      "i don't want discounts",
      "i don't want offers",
      "i don't want free",
      "no thanks, i hate saving",
      "i'm not interested in saving",
      "no thanks, i enjoy paying full",
      "i'll figure it out myself",
      "i don't need help",
      "i don't need this",
      "i know what i'm doing",
      "i'll manage on my own",
      "no thanks, i have enough money",
      "i prefer to spend more",
      "i enjoy overpaying",
      "i like wasting money",
      "i'll skip the savings",
      "no thanks, i'll miss out",
      "i don't mind missing deals",
      "i'm ok with paying more",
      "i'll pass on the discount",
      "no thanks, i don't like deals",
      "i'll skip the offer",
      "no thanks, i don't like saving",
      "no, i don't care about saving",
      "i don't care about deals",
      "i'm fine paying full price",
      "no thanks, i'm not interested"
    ]

    const isShaming = shamingPhrases.some(phrase => text.includes(phrase))

    if (isShaming) {
      addFinding('CONFIRM_SHAMING', 5, 0.9,
        `Guilt-tripping decline: "${btn.innerText.trim()}"`, btn)
      highlightElement(btn,
        'Confirm shaming! Guilt used to stop you from declining.', '#f59e0b')
      console.log('⚠️ Confirm shaming:', btn.innerText.trim())
    }
  })
}
// ─────────────────────────────────────────
// MODULE 8 — Hidden Subscription
// ─────────────────────────────────────────

function detectHiddenSubscription() {
  if (!isCheckoutPage()) return

  const trialPhrases = [
    'free trial', 'try for free', 'first month free',
    'days free', 'no charge today', 'start free',
    'free for', 'try free'
  ]

  const billingPhrases = [
    'per month', 'per year', 'then ₹', 'then $',
    'recurring', 'billed', 'after trial',
    'cancel anytime', 'auto-renew', 'subscription'
  ]

  const allElements = document.querySelectorAll('*')
  let trialElement = null

  allElements.forEach(el => {
    if (el.children.length > 0) return
    const text = el.innerText.toLowerCase().trim()
    if (trialPhrases.some(phrase => text.includes(phrase))) {
      trialElement = el
    }
  })

  if (!trialElement) return

  const trialFontSize = parseFloat(window.getComputedStyle(trialElement).fontSize)
  console.log(`🔍 Trial language found: "${trialElement.innerText}" (${trialFontSize}px)`)

  let billingElement = null
  allElements.forEach(el => {
    if (el.children.length > 0) return
    const text = el.innerText.toLowerCase().trim()
    if (billingPhrases.some(phrase => text.includes(phrase))) {
      billingElement = el
    }
  })

  if (!billingElement) return

  const billingFontSize = parseFloat(window.getComputedStyle(billingElement).fontSize)
  const fontDiff = trialFontSize - billingFontSize

  console.log(`💳 Billing terms: "${billingElement.innerText}" (${billingFontSize}px)`)

  if (fontDiff > 4) {
    addFinding('HIDDEN_SUBSCRIPTION', 8, 0.85,
      `Trial text is ${fontDiff.toFixed(0)}px larger than billing terms — asymmetric disclosure`,
      billingElement)
    highlightElement(billingElement,
      `Subscription terms are in much smaller text than the free trial offer. Read carefully!`,
      '#ef4444')
    console.log(`🚨 Hidden subscription asymmetry! Font diff: ${fontDiff}px`)
  }
}

// ─────────────────────────────────────────
// MODULE 9 — Social Proof Manipulation
// ─────────────────────────────────────────

function detectSocialProof() {
  const patterns = [
    /\d+\s*people (are\s*)?viewing/i,
    /\d+\s*people bought/i,
    /\d+\s*watching/i,
    /last purchased\s*\d+/i,
    /\d+\s*sold in last/i,
    /only \d+ left/i,
    /\d+\s*people have this/i,
    /in \d+\s*people's carts/i,
    /selling fast/i,
    /flying off (the )?shelves/i,
    /everyone('s)? (buying|grabbing)/i,
  ]

  const allTextNodes = document.querySelectorAll('span, div, p, strong')

  allTextNodes.forEach(el => {
    if (el.children.length > 0) return
    const text = el.innerText.trim()
    if (!text) return

    const matched = patterns.some(pattern => pattern.test(text))
    if (matched) {
      addFinding('SOCIAL_PROOF', 4, 0.75,
        `Unverifiable social proof: "${text}"`, el)
      highlightElement(el,
        `Unverifiable claim: "${text}" — this cannot be confirmed and is a common pressure tactic.`,
        '#f59e0b')
      console.log('⚠️ Social proof manipulation:', text)
    }
  })
}
// ─────────────────────────────────────────
// MODULE 10 — Basket Sneaking (CCPA Rule 4)
// ─────────────────────────────────────────

function detectBasketSneaking() {
  // Cart items store karo jab user product page pe ho
  const storageKey = `dp_cart_${window.location.hostname}`

  // Known sneaked items — jo companies silently add karti hain
  const sneakedItems = [
    // Insurance
    'travel insurance', 'trip insurance', 'cancellation protection',
    'travel protection', 'insurance', 'protect your trip',
    // Donations
    'donate', 'donation', 'contribute', 'charity',
    // Extended warranty
    'extended warranty', 'protection plan', 'care plan',
    // Subscriptions
    'prime membership', 'club membership', 'loyalty program',
    // Express delivery
    'express delivery', 'priority delivery', 'fast track'
  ]

  // Cart/checkout page pe scan karo
  const bodyText = document.body.innerText.toLowerCase()

  sneakedItems.forEach(item => {
    if (bodyText.includes(item)) {
      // Check karo — kya ye user ne explicitly select kiya?
      const checkboxes = document.querySelectorAll('input[type="checkbox"]')
      let isPreChecked = false

      checkboxes.forEach(cb => {
        const label = cb.closest('label')?.innerText?.toLowerCase() || ''
        if (label.includes(item) && cb.checked) {
          isPreChecked = true
          addFinding('BASKET_SNEAKING', 9, 0.9,
            `Pre-selected item found: "${item}" — was this your choice?`,
            cb)
          highlightElement(cb,
            `🚨 Basket Sneaking! "${item}" was silently added. Did you choose this?`,
            '#ef4444')
          console.log('🚨 Basket sneaking detected:', item)
        }
      })

      // Agar checkbox nahi hai but item mention hai — still flag
      if (!isPreChecked && isCheckoutPage()) {
        addFinding('BASKET_SNEAKING', 7, 0.75,
          `Potentially sneaked item: "${item}"`,
          null)
        console.log('⚠️ Potential basket sneaking:', item)
      }
    }
  })
}

// ─────────────────────────────────────────
// MODULE 11 — Forced Action (CCPA Rule 5)
// ─────────────────────────────────────────

function detectForcedAction() {
  const forcedPatterns = [
    // App download force
    { text: 'download the app', type: 'App Download Gate' },
    { text: 'get the app', type: 'App Download Gate' },
    { text: 'use our app', type: 'App Download Gate' },
    { text: 'app only deal', type: 'App Download Gate' },
    { text: 'app exclusive', type: 'App Download Gate' },
    { text: 'only on app', type: 'App Download Gate' },
    // Account creation force
    { text: 'create account to continue', type: 'Forced Registration' },
    { text: 'sign up to see price', type: 'Forced Registration' },
    { text: 'login to continue', type: 'Forced Registration' },
    { text: 'register to checkout', type: 'Forced Registration' },
    // Social share force
    { text: 'share to unlock', type: 'Forced Social Share' },
    { text: 'share to get discount', type: 'Forced Social Share' },
    { text: 'invite friends to continue', type: 'Forced Social Share' },
    // Permission force
    { text: 'allow notifications to continue', type: 'Forced Permission' },
    { text: 'enable location to see price', type: 'Forced Permission' }
  ]

  const bodyText = document.body.innerText.toLowerCase()

  forcedPatterns.forEach(pattern => {
    if (bodyText.includes(pattern.text)) {

      // Element dhundo
      const allElements = document.querySelectorAll('p, span, div, h1, h2, h3, button, a')
      allElements.forEach(el => {
        if (el.children.length > 0) return
        const text = el.innerText.toLowerCase().trim()
        if (text.includes(pattern.text)) {
          addFinding('FORCED_ACTION', 8, 0.85,
            `Forced action detected: "${pattern.type}" — "${el.innerText.trim()}"`,
            el)
          highlightElement(el,
            `⚠️ Forced Action! You are being required to "${pattern.type}" to continue.`,
            '#ef4444')
          console.log('🚨 Forced action:', pattern.type, el.innerText.trim())
        }
      })
    }
  })
}

// ─────────────────────────────────────────
// MODULE 12 — SaaS Billing (CCPA Rule 13)
// ─────────────────────────────────────────

function detectSaaSBilling() {
  if (!isCheckoutPage()) return

  const saasPatterns = [
    // Auto renewal
    'auto-renew', 'auto renew', 'automatically renew',
    'automatically billed', 'automatically charged',
    // Annual billing trap
    'billed annually', 'annual plan', 'yearly plan',
    'charged yearly', 'annual subscription',
    // Hidden upgrade
    'upgrades automatically', 'auto upgrade',
    'plan will upgrade',
    // Cancellation difficulty
    'cancel anytime', 'no cancellation fee',
    'pause or cancel', 'cancel subscription'
  ]

  const allElements = document.querySelectorAll('p, span, div, small, label')

  allElements.forEach(el => {
    if (el.children.length > 0) return
    const text = el.innerText.toLowerCase().trim()
    if (!text) return

    const matched = saasPatterns.some(pattern => text.includes(pattern))
    if (!matched) return

    const fontSize = parseFloat(window.getComputedStyle(el).fontSize)
    const color = window.getComputedStyle(el).color

    // Small text mein hidden = dark pattern
    if (fontSize < 13) {
      addFinding('SAAS_BILLING', 8, 0.85,
        `SaaS billing term hidden in small text (${fontSize}px): "${text}"`,
        el)
      highlightElement(el,
        `⚠️ SaaS Billing trap! Subscription term hidden in tiny text. Read carefully.`,
        '#ef4444')
      console.log('🚨 SaaS billing hidden:', text)
    } else {
      // Even if normal size — still flag as informational
      addFinding('SAAS_BILLING', 5, 0.7,
        `SaaS billing term: "${text}"`,
        el)
      console.log('ℹ️ SaaS billing term found:', text)
    }
  })
}

// ─────────────────────────────────────────
// MODULE 13 — Hindi Language Dark Patterns
// ─────────────────────────────────────────

function detectHindiDarkPatterns() {
  const hindiPatterns = [
    // Scarcity
    { text: 'सिर्फ', type: 'SCARCITY', severity: 6,
      msg: 'Sirf X bache hain — artificial scarcity' },
    { text: 'केवल', type: 'SCARCITY', severity: 6,
      msg: 'Keval X units — fake scarcity claim' },
    { text: 'स्टॉक खत्म', type: 'SCARCITY', severity: 7,
      msg: 'Stock khatam — urgency pressure' },
    { text: 'जल्दी करें', type: 'FAKE_URGENCY', severity: 7,
      msg: 'Jaldi karo — fake urgency' },
    { text: 'अभी खरीदें', type: 'FAKE_URGENCY', severity: 5,
      msg: 'Abhi kharido — urgency pressure' },
    { text: 'सीमित समय', type: 'FAKE_URGENCY', severity: 6,
      msg: 'Seemit samay — limited time pressure' },
    { text: 'ऑफर खत्म', type: 'FAKE_URGENCY', severity: 6,
      msg: 'Offer khatam — expiry pressure' },
    // Social proof
    { text: 'लोग देख रहे', type: 'SOCIAL_PROOF', severity: 4,
      msg: 'Log dekh rahe hain — unverifiable social proof' },
    { text: 'लोगों ने खरीदा', type: 'SOCIAL_PROOF', severity: 4,
      msg: 'Logon ne kharida — unverifiable claim' },
    // Hidden cost
    { text: 'सुविधा शुल्क', type: 'HIDDEN_COST', severity: 8,
      msg: 'Convenience fee — hidden charge' },
    { text: 'प्रसंस्करण शुल्क', type: 'HIDDEN_COST', severity: 8,
      msg: 'Processing fee — hidden charge' },
    // Confirm shaming
    { text: 'नहीं, मुझे बचत नहीं चाहिए', type: 'CONFIRM_SHAMING', severity: 5,
      msg: 'Confirm shaming in Hindi' },
    { text: 'मैं पूरी कीमत चुकाऊंगा', type: 'CONFIRM_SHAMING', severity: 5,
      msg: 'Confirm shaming — full price guilt trip' }
  ]

  const bodyText = document.body.innerText

  hindiPatterns.forEach(pattern => {
    if (bodyText.includes(pattern.text)) {
      // Element dhundo
      const allElements = document.querySelectorAll('*')
      allElements.forEach(el => {
        if (el.children.length > 0) return
        const text = el.innerText?.trim() || ''
        if (text.includes(pattern.text)) {
          addFinding(pattern.type, pattern.severity, 0.85,
            `Hindi dark pattern: "${text}" — ${pattern.msg}`,
            el)
          highlightElement(el,
            `⚠️ Dark Pattern (Hindi): ${pattern.msg}`,
            '#ef4444')
          console.log('🚨 Hindi dark pattern:', pattern.text)
        }
      })
    }
  })
}

// ─────────────────────────────────────────
// MODULE 14 — Third Party Dark Pattern Services
// (Mathur et al. 2019 — 22 known providers)
// ─────────────────────────────────────────

function detectThirdPartyServices() {
  // Mathur 2019 paper se — known dark pattern service providers
  const knownProviders = [
    // Popups & overlays
    { script: 'optinmonster', name: 'OptinMonster', type: 'Popup/Overlay Service' },
    { script: 'sumo', name: 'Sumo', type: 'Popup Service' },
    { script: 'privy', name: 'Privy', type: 'Popup/Email Capture' },
    { script: 'justuno', name: 'Justuno', type: 'Conversion Optimization' },
    { script: 'wheelio', name: 'Wheelio', type: 'Gamified Popup' },
    { script: 'sleeknote', name: 'Sleeknote', type: 'Popup Service' },
    // Countdown timers
    { script: 'provesource', name: 'ProveSource', type: 'Social Proof Service' },
    { script: 'fomo', name: 'FOMO', type: 'Social Proof/Urgency' },
    { script: 'useproof', name: 'UseProof', type: 'Social Proof' },
    { script: 'nudgify', name: 'Nudgify', type: 'Social Proof/FOMO' },
    { script: 'trustpulse', name: 'TrustPulse', type: 'Social Proof' },
    // Scarcity tools
    { script: 'hurrify', name: 'Hurrify', type: 'Fake Scarcity Timer' },
    { script: 'countdown-timer', name: 'Countdown Timer', type: 'Urgency Timer' },
    // Exit intent
    { script: 'exitbee', name: 'ExitBee', type: 'Exit Intent Popup' },
    { script: 'picreel', name: 'Picreel', type: 'Exit Intent' },
    // Cart recovery
    { script: 'recart', name: 'Recart', type: 'Cart Abandonment' },
    { script: 'klaviyo', name: 'Klaviyo', type: 'Email/SMS Marketing' }
  ]

  // Page ke scripts check karo
  const scripts = document.querySelectorAll('script[src]')
  const scriptSrcs = Array.from(scripts).map(s =>
    s.src.toLowerCase()
  )

  // Inline scripts bhi check karo
  const inlineScripts = Array.from(
    document.querySelectorAll('script:not([src])')
  ).map(s => s.textContent.toLowerCase())

  knownProviders.forEach(provider => {
    const foundInSrc = scriptSrcs.some(src =>
      src.includes(provider.script)
    )
    const foundInline = inlineScripts.some(script =>
      script.includes(provider.script)
    )

    if (foundInSrc || foundInline) {
      addFinding('THIRD_PARTY_SERVICE', 6, 0.95,
        `Third-party dark pattern service detected: ${provider.name} (${provider.type})`,
        null)
      console.log(`🔍 Third-party service: ${provider.name} — ${provider.type}`)
    }
  })
}
// ─────────────────────────────────────────
// MAIN — Run all detectors
// ─────────────────────────────────────────
async function runAllDetectors() {
  findings.length = 0

  scanBasicPatterns()
  detectTrickQuestions()
  detectHiddenCosts()
  detectAsymmetricConsent()
  detectCountdownTimers()
  detectNagging()
  detectConfirmShaming()
  detectHiddenSubscription()
  detectSocialProof()
  detectBasketSneaking()
  detectForcedAction()
  detectSaaSBilling()
  detectHindiDarkPatterns()
  detectThirdPartyServices()

  chrome.runtime.sendMessage({
    type: 'FINDING_DETECTED',
    findings: findings
  })

  if (findings.length > 0) {
    addHeatmapButton()
  }

  console.log(`🔍 Scan complete — ${findings.length} pattern(s) found`)
}

// Run on page load
runAllDetectors()

// Re-run on DOM changes
const observer = new MutationObserver(() => {
  clearTimeout(window._dpTimer)
  window._dpTimer = setTimeout(runAllDetectors, 2000) // 1000 → 2000
})

observer.observe(document.body, {
  childList: true,
  subtree: true
})
// ─────────────────────────────────────────
// HEATMAP — Visual overlay
// ─────────────────────────────────────────

function createHeatmap() {
  // Purana heatmap remove karo
  const existing = document.getElementById('dp-heatmap-overlay')
  if (existing) {
    existing.remove()
    document.getElementById('dp-heatmap-btn').textContent = '🗺️ Show Heatmap'
    return
  }

  // Findings with elements filter karo
  const findingsWithElements = findings.filter(f => f.element)

  if (findingsWithElements.length === 0) {
    alert('No specific elements to highlight on this page.')
    return
  }

  // Overlay container
  const overlay = document.createElement('div')
  overlay.id = 'dp-heatmap-overlay'
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none;
    z-index: 999998;
  `

  findingsWithElements.forEach((f, i) => {
    if (!f.element || !f.element.getBoundingClientRect) return

    const rect = f.element.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) return

    // Colored overlay on element
    const highlight = document.createElement('div')
    highlight.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      background: ${f.severity >= 7 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'};
      border: 2px solid ${f.severity >= 7 ? '#ef4444' : '#f59e0b'};
      border-radius: 4px;
      pointer-events: none;
      z-index: 999998;
    `

    // Number marker
    const marker = document.createElement('div')
    marker.style.cssText = `
      position: fixed;
      top: ${rect.top - 10}px;
      left: ${rect.left - 10}px;
      width: 20px;
      height: 20px;
      background: ${f.severity >= 7 ? '#ef4444' : '#f59e0b'};
      color: white;
      font-size: 11px;
      font-weight: 700;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, sans-serif;
      pointer-events: none;
      z-index: 999999;
    `
    marker.textContent = i + 1

    overlay.appendChild(highlight)
    overlay.appendChild(marker)
  })

  document.body.appendChild(overlay)
  document.getElementById('dp-heatmap-btn').textContent = '✕ Hide Heatmap'
}

function addHeatmapButton() {
  if (document.getElementById('dp-heatmap-btn')) return

  const btn = document.createElement('button')
  btn.id = 'dp-heatmap-btn'
  btn.textContent = '🗺️ Show Heatmap'
  btn.style.cssText = `
    position: fixed;
    bottom: 70px;
    right: 16px;
    background: #1a1a1a;
    color: #fff;
    border: 1px solid #333;
    border-radius: 20px;
    padding: 8px 14px;
    font-size: 12px;
    cursor: pointer;
    z-index: 999997;
    font-family: -apple-system, sans-serif;
    box-shadow: 0 2px 10px rgba(0,0,0,0.5);
  `
  btn.addEventListener('click', createHeatmap)
  document.body.appendChild(btn)
}
}