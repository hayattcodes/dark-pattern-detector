// Content script - runs on every page
// Phase 1: Basic text scanner - complexity add होगी later

console.log('🔍 Dark Pattern Detector loaded on:', window.location.hostname)

// All findings for this page
const findings = []

// ─── BASIC SCANNER ───────────────────────────────────────

function scanPage() {
  const bodyText = document.body.innerText.toLowerCase()

  // Basic dark pattern phrases - Phase 1 simple version
  const patterns = [
    { phrase: 'only 1 left',      type: 'SCARCITY',       severity: 6 },
    { phrase: 'only 2 left',      type: 'SCARCITY',       severity: 6 },
    { phrase: 'only 3 left',      type: 'SCARCITY',       severity: 5 },
    { phrase: 'hurry',            type: 'FAKE_URGENCY',   severity: 4 },
    { phrase: 'offer ends in',    type: 'FAKE_URGENCY',   severity: 6 },
    { phrase: 'limited time',     type: 'FAKE_URGENCY',   severity: 5 },
    { phrase: 'people viewing',   type: 'SOCIAL_PROOF',   severity: 4 },
    { phrase: 'people are viewing', type: 'SOCIAL_PROOF', severity: 4 },
    { phrase: 'last purchased',   type: 'SOCIAL_PROOF',   severity: 4 },
    { phrase: 'free trial',       type: 'HIDDEN_SUB',     severity: 7 },
    { phrase: 'convenience fee',  type: 'HIDDEN_COST',    severity: 8 },
    { phrase: 'handling charge',  type: 'HIDDEN_COST',    severity: 8 },
  ]

  patterns.forEach(pattern => {
    if (bodyText.includes(pattern.phrase)) {
      findings.push({
        patternType: pattern.type,
        severity: pattern.severity,
        confidence: 0.7,
        evidence: pattern.phrase,
        timestamp: Date.now(),
        domain: window.location.hostname,
        url: window.location.href
      })
    }
  })

  // Send findings to background
  if (findings.length > 0) {
    chrome.runtime.sendMessage({
      type: 'FINDING_DETECTED',
      findings: findings
    })
    console.log('🚨 Dark patterns found:', findings)
  } else {
    console.log('✅ No dark patterns found')
  }
}

// Run scan when page loads
scanPage()