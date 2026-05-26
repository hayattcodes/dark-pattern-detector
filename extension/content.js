console.log('🔍 Dark Pattern Detector loaded on:', window.location.hostname)

const findings = []

// ─────────────────────────────────────────
// UTILITY — Find label text for a checkbox
// ─────────────────────────────────────────

function getLabelText(input) {
  // Method 1 — for attribute
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`)
    if (label) return label.innerText.trim()
  }

  // Method 2 — wrapping label
  const parent = input.closest('label')
  if (parent) return parent.innerText.trim()

  // Method 3 — aria-labelledby
  const labelledBy = input.getAttribute('aria-labelledby')
  if (labelledBy) {
    const el = document.getElementById(labelledBy)
    if (el) return el.innerText.trim()
  }

  // Method 4 — aria-label
  const ariaLabel = input.getAttribute('aria-label')
  if (ariaLabel) return ariaLabel.trim()

  return ''
}

// ─────────────────────────────────────────
// UTILITY — Add finding to list
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
// UTILITY — Highlight flagged element
// ─────────────────────────────────────────

function highlightElement(element, message, color = '#ef4444') {
  if (!element) return

  // Avoid double highlighting
  if (element.dataset.dpDetected) return
  element.dataset.dpDetected = 'true'

  // Red/yellow border
  element.style.outline = `2px solid ${color}`
  element.style.outlineOffset = '2px'

  // Tooltip
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

  // Show tooltip on hover
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
// MODULE 1 — Trick Questions Detector
// ─────────────────────────────────────────

function detectTrickQuestions() {
  const checkboxes = document.querySelectorAll(
    'input[type="checkbox"], input[type="radio"]'
  )

  checkboxes.forEach(input => {
    const labelText = getLabelText(input).toLowerCase()
    if (!labelText) return

    // ── Check 1: Double Negative Detection ──
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
      addFinding(
        'TRICK_QUESTION',
        6,
        confidence,
        `Double negative in label: "${labelText}"`,
        input
      )
      highlightElement(
        input,
        `Confusing language detected: "${labelText}". Read carefully before checking/unchecking.`,
        '#f59e0b'
      )
      console.log('⚠️ Trick Question found:', labelText)
      return
    }

    // ── Check 2: Pre-checked + Opt-out Language ──
    const optOutWords = [
      'unsubscribe', 'remove', 'opt out',
      'opt-out', 'do not', 'don\'t', 'stop'
    ]

    const hasOptOut = optOutWords.some(word => labelText.includes(word))

    if (input.checked && hasOptOut) {
      addFinding(
        'TRICK_QUESTION',
        7,
        0.85,
        `Pre-checked opt-out: "${labelText}"`,
        input
      )
      highlightElement(
        input,
        `This box is pre-checked but says "${labelText}". Leaving it checked may mean you are AGREEING to something unwanted.`,
        '#ef4444'
      )
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
      addFinding(
        pattern.type,
        pattern.severity,
        0.7,
        pattern.phrase,
        null
      )
    }
  })
}

// ─────────────────────────────────────────
// MAIN — Run all detectors
// ─────────────────────────────────────────

function runAllDetectors() {
  findings.length = 0 // reset

  scanBasicPatterns()
  detectTrickQuestions()

  // Send to background
  chrome.runtime.sendMessage({
    type: 'FINDING_DETECTED',
    findings: findings
  })

  console.log(`🔍 Scan complete — ${findings.length} pattern(s) found`)
}

// Run on page load
runAllDetectors()

// Re-run when DOM changes (dynamic pages)
const observer = new MutationObserver(() => {
  clearTimeout(window._dpTimer)
  window._dpTimer = setTimeout(runAllDetectors, 1000)
})

observer.observe(document.body, {
  childList: true,
  subtree: true
})