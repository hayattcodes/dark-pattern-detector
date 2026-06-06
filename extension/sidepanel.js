// ─────────────────────────────────────────
// CCPA India 2023 Mapping
// ─────────────────────────────────────────

const CCPA_MAPPING = {
  'FAKE_URGENCY': {
    ccpaRule: 'Rule 1 — False Urgency',
    ccpaDescription: 'Creating false sense of urgency to pressure consumers'
  },
  'FAKE_TIMER': {
    ccpaRule: 'Rule 1 — False Urgency',
    ccpaDescription: 'Fake countdown timers that reset after expiry'
  },
  'SCARCITY': {
    ccpaRule: 'Rule 2 — Scarcity',
    ccpaDescription: 'False scarcity claims to pressure purchase decisions'
  },
  'SOCIAL_PROOF': {
    ccpaRule: 'Rule 3 — Social Proof Manipulation',
    ccpaDescription: 'Unverifiable social proof used as pressure tactics'
  },
  'BASKET_SNEAKING': {
    ccpaRule: 'Rule 4 — Basket Sneaking',
    ccpaDescription: 'Items added to cart without explicit user consent'
  },
  'FORCED_ACTION': {
    ccpaRule: 'Rule 5 — Forced Action',
    ccpaDescription: 'User forced to perform unnecessary actions to complete purchase'
  },
  'HIDDEN_COST': {
    ccpaRule: 'Rule 7 — Drip Pricing',
    ccpaDescription: 'Revealing hidden charges only at final checkout'
  },
  'HIDDEN_SUB': {
    ccpaRule: 'Rule 7 — Drip Pricing',
    ccpaDescription: 'Hidden subscription charges not disclosed prominently'
  },
  'HIDDEN_SUBSCRIPTION': {
    ccpaRule: 'Rule 8 — Subscription Trap',
    ccpaDescription: 'Free trial converting to paid without clear disclosure'
  },
  'TRICK_QUESTION': {
    ccpaRule: 'Rule 9 — Trick Questions',
    ccpaDescription: 'Confusing questions to obtain unintended consent'
  },
  'ASYMMETRIC_CONSENT': {
    ccpaRule: 'Rule 10 — Interface Interference',
    ccpaDescription: 'UI designed to make rejection harder than acceptance'
  },
  'CONFIRM_SHAMING': {
    ccpaRule: 'Rule 11 — Confirm Shaming',
    ccpaDescription: 'Using guilt or shame to manipulate consumer choices'
  },
  'NAGGING': {
    ccpaRule: 'Rule 12 — Nagging',
    ccpaDescription: 'Repeatedly interrupting user with same request'
  },
  'SAAS_BILLING': {
    ccpaRule: 'Rule 13 — SaaS Billing',
    ccpaDescription: 'Hidden recurring charges in software subscriptions'
  },
  'THIRD_PARTY_SERVICE': {
    ccpaRule: 'Rule 1 — False Urgency / Rule 3 — Social Proof',
    ccpaDescription: 'Third-party service used to create artificial urgency or social proof'
  }
}

// ─────────────────────────────────────────
// Side Panel — Full Report
// ─────────────────────────────────────────

function loadFindings() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.runtime.sendMessage({ type: 'GET_FINDINGS' }, (response) => {
      if (chrome.runtime.lastError) {
        document.getElementById('content').innerHTML =
          '<p style="color:#888">Reload the page and try again.</p>'
        return
      }
      const findings = response?.findings || []
      renderReport(findings, tabs[0]?.url || '')
    })
  })
}

function renderReport(findings, url) {
  const content = document.getElementById('content')

  let domain = 'Unknown'
  try { domain = new URL(url).hostname } catch(e) {}

  if (findings.length === 0) {
    content.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:#888">
        <div style="font-size:32px;margin-bottom:12px">✅</div>
        <div style="font-size:15px;color:#fff">No dark patterns found</div>
        <div style="font-size:12px;margin-top:8px">${domain}</div>
      </div>
    `
    return
  }

  const maxSeverity = Math.max(...findings.map(f => f.severity))
  const bonus = Math.floor(Math.log2(findings.length))
  const score = Math.min(10, maxSeverity + bonus)
  const scoreColor = score <= 3 ? '#22c55e' : score <= 6 ? '#f59e0b' : '#ef4444'

  const severityLabel = {
    ASYMMETRIC_CONSENT: 'Cookie consent is rigged — rejecting is harder than accepting',
    HIDDEN_COST: 'Extra charges added at checkout without disclosure',
    FAKE_TIMER: 'Countdown timer is fake — resets after expiry',
    TRICK_QUESTION: 'Confusing checkbox — read carefully before submitting',
    CONFIRM_SHAMING: 'Guilt-tripping language used to stop you from declining',
    HIDDEN_SUBSCRIPTION: 'Subscription terms hidden in tiny text',
    SOCIAL_PROOF: 'Unverifiable claim used as pressure tactic',
    SCARCITY: 'Artificial scarcity — may not be accurate',
    FAKE_URGENCY: 'Fake urgency to pressure you into buying',
    NAGGING: 'Same popup keeps appearing after dismissal',
    HIDDEN_SUB: 'Free trial hides recurring subscription charges',
    BASKET_SNEAKING: 'Item was silently added to cart without your consent',
    FORCED_ACTION: 'You are being forced to do something unnecessary',
    SAAS_BILLING: 'Hidden recurring subscription charges detected',
    THIRD_PARTY_SERVICE: 'Third-party manipulation service detected on this page'
  }

  const patternIcons = {
    ASYMMETRIC_CONSENT: '🍪',
    HIDDEN_COST: '💰',
    FAKE_TIMER: '⏱️',
    TRICK_QUESTION: '☑️',
    CONFIRM_SHAMING: '😔',
    HIDDEN_SUBSCRIPTION: '🔁',
    SOCIAL_PROOF: '👥',
    SCARCITY: '📦',
    FAKE_URGENCY: '⚡',
    NAGGING: '🔔',
    HIDDEN_SUB: '🔁',
    BASKET_SNEAKING: '🛒',
    FORCED_ACTION: '🚫',
    SAAS_BILLING: '💳',
    THIRD_PARTY_SERVICE: '🔌'
  }

  const ccpaViolations = findings.filter(f => CCPA_MAPPING[f.patternType]).length

  content.innerHTML = `

    <div style="margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#1a1a1a;border-radius:8px">
        <div style="width:52px;height:52px;border-radius:50%;border:2px solid ${scoreColor};display:flex;align-items:center;justify-content:center;flex-direction:column;flex-shrink:0">
          <span style="font-size:18px;font-weight:700;color:${scoreColor}">${score}</span>
          <span style="font-size:9px;color:#666">/10</span>
        </div>
        <div>
          <div style="font-size:14px;font-weight:600;color:${scoreColor}">
            ${score <= 3 ? 'Low Risk' : score <= 6 ? 'Moderate Risk' : 'High Manipulation!'}
          </div>
          <div style="font-size:11px;color:#888;margin-top:2px">${domain}</div>
          <div style="font-size:11px;color:#666;margin-top:2px">
            ${findings.length} pattern${findings.length > 1 ? 's' : ''} detected
          </div>
        </div>
      </div>
    </div>

    <div style="padding:10px 12px;background:#1a0a0a;border:1px solid #ef444444;border-radius:8px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:12px;font-weight:600;color:#ef4444">
          ⚖️ CCPA India 2023 Violations
        </div>
        <div style="font-size:10px;color:#888;margin-top:2px">
          Consumer Protection Act 2019
        </div>
      </div>
      <div style="font-size:20px;font-weight:700;color:#ef4444">${ccpaViolations}</div>
    </div>

    <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">
      Detected Patterns
    </div>

    ${findings.map((f, i) => {
      const ccpa = CCPA_MAPPING[f.patternType]
      return `
        <div style="background:#1a1a1a;border-radius:8px;padding:12px;margin-bottom:8px;border-left:3px solid ${f.severity >= 7 ? '#ef4444' : f.severity >= 5 ? '#f59e0b' : '#888'};">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <div style="font-size:13px;font-weight:600;color:#fff">
              ${patternIcons[f.patternType] || '⚠️'} ${f.patternType.replace(/_/g, ' ')}
            </div>
            <div style="font-size:11px;color:${f.severity >= 7 ? '#ef4444' : '#f59e0b'}">
              ${f.severity}/10
            </div>
          </div>
          <div style="font-size:12px;color:#aaa;margin-bottom:6px;line-height:1.5">
            ${severityLabel[f.patternType] || f.evidence}
          </div>
          <div style="font-size:11px;color:#666;background:#111;padding:6px 8px;border-radius:4px;font-family:monospace">
            "${f.evidence.length > 80 ? f.evidence.substring(0, 80) + '...' : f.evidence}"
          </div>
          <div style="margin-top:6px">
            <span style="font-size:10px;color:#555">
              Confidence: ${(f.confidence * 100).toFixed(0)}%
            </span>
          </div>
          ${ccpa ? `
            <div style="margin-top:8px;padding:6px 8px;background:#1a0808;border:1px solid #ef444433;border-radius:4px;font-size:10px;color:#ef4444;line-height:1.5;">
              ⚖️ <b>${ccpa.ccpaRule}</b><br/>
              <span style="color:#888">${ccpa.ccpaDescription}</span><br/>
              <span style="color:#666;font-size:9px">Punishable under Consumer Protection Act 2019</span>
            </div>
          ` : ''}
        </div>
      `
    }).join('')}

    <div style="margin-top:16px;" id="historySection">
      <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">
        Site History
      </div>
      <div id="historyContent" style="font-size:12px;color:#666">
        Loading history...
      </div>
    </div>

    <div style="margin-top:16px;padding:12px;background:#1a1a1a;border-radius:8px;font-size:11px;color:#666;line-height:1.6">
      <div style="color:#888;font-weight:600;margin-bottom:4px">ℹ️ Research Basis</div>
      Mathur et al. Princeton (2019) · Gray et al. Cornell (2018) · Cambridge Behavioural Policy (2025) · CCPA India Guidelines (2023)
    </div>
  `

  setTimeout(() => loadSiteHistory(domain), 500)
}

// Load on open
loadFindings()

// Live updates
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'FINDING_DETECTED') {
    loadFindings()
  }
})

// ─────────────────────────────────────────
// Site History
// ─────────────────────────────────────────

function loadSiteHistory(domain) {
  chrome.runtime.sendMessage(
    { type: 'GET_HISTORY', domain: domain },
    (response) => {
      const history = response?.history || []
      const container = document.getElementById('historyContent')
      if (!container) return

      if (history.length <= 1) {
        container.innerHTML = '<span style="color:#555">First visit — no history yet</span>'
        return
      }

      const recent = history.slice(-5).reverse()
      const trend = recent[0].score - recent[recent.length - 1].score

      container.innerHTML = `
        <div style="padding:8px;background:#1a1a1a;border-radius:6px;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:11px;color:#888">Score Trend</span>
            <span style="font-size:11px;color:${trend > 0 ? '#ef4444' : trend < 0 ? '#22c55e' : '#888'}">
              ${trend > 0 ? '📈 Getting worse' : trend < 0 ? '📉 Getting better' : '➡️ No change'}
            </span>
          </div>
          ${recent.map(h => `
            <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #222;font-size:11px;">
              <span style="color:#666">${h.date}</span>
              <span style="color:#888">${h.patterns} patterns</span>
              <span style="color:${h.score >= 7 ? '#ef4444' : h.score >= 4 ? '#f59e0b' : '#22c55e'}">${h.score}/10</span>
            </div>
          `).join('')}
        </div>
      `
    }
  )
}

// ─────────────────────────────────────────
// PDF Export
// ─────────────────────────────────────────

document.getElementById('downloadPdf').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'GET_FINDINGS' }, (response) => {
    const findings = response?.findings || []
    generatePDF(findings)
  })
})

function generatePDF(findings) {
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()

  doc.setFillColor(15, 15, 15)
  doc.rect(0, 0, 210, 40, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.text('Dark Pattern Detector', 14, 18)
  doc.setFontSize(10)
  doc.text('CCPA India 2023 Compliance Report', 14, 28)
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 36)

  const maxSeverity = findings.length > 0
    ? Math.max(...findings.map(f => f.severity)) : 0
  const bonus = findings.length > 0
    ? Math.floor(Math.log2(findings.length)) : 0
  const score = Math.min(10, maxSeverity + bonus)

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.text(`Risk Score: ${score}/10`, 14, 55)
  doc.setFontSize(10)
  doc.text(`Patterns Found: ${findings.length}`, 14, 63)
  doc.setDrawColor(200, 200, 200)
  doc.line(14, 68, 196, 68)

  let y = 78

  findings.forEach((f, i) => {
    if (y > 250) { doc.addPage(); y = 20 }

    doc.setFillColor(245, 245, 245)
    doc.rect(14, y - 4, 182, 32, 'F')

    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    doc.text(`${i + 1}. ${f.patternType.replace(/_/g, ' ')}`, 18, y + 4)

    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(
      `Severity: ${f.severity}/10  |  Confidence: ${(f.confidence * 100).toFixed(0)}%`,
      18, y + 12
    )

    const ccpa = CCPA_MAPPING[f.patternType]
    if (ccpa) {
      doc.setTextColor(180, 0, 0)
      doc.text(`${ccpa.ccpaRule}`, 18, y + 20)
    }

    y += 38
  })

  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(
    'Based on: Mathur et al. Princeton (2019), Gray et al. Cornell (2018), CCPA India 2023',
    14, 285
  )

  doc.save(`dark-pattern-report-${Date.now()}.pdf`)
  console.log('📄 PDF exported!')
}