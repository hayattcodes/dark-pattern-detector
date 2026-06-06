const tabFindings = {}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type === 'FINDING_DETECTED') {
    const tabId = sender.tab.id
    tabFindings[tabId] = message.findings
    updateBadge(tabId, message.findings)
  }

  if (message.type === 'GET_FINDINGS') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id
      const findings = tabFindings[tabId] || []
      sendResponse({ findings: findings })
    })
    return true
  }

  if (message.type === 'GET_HISTORY') {
    const key = `dp_history_${message.domain}`
    chrome.storage.local.get([key], (result) => {
      sendResponse({ history: result[key] || [] })
    })
    return true
  }

})

function updateBadge(tabId, findings) {
  if (findings.length === 0) {
    chrome.action.setBadgeText({ text: '', tabId })
    return
  }

  const maxSeverity = Math.max(...findings.map(f => f.severity))
  const bonus = Math.floor(Math.log2(findings.length))
  const score = Math.min(10, maxSeverity + bonus)

  chrome.action.setBadgeText({ text: String(findings.length), tabId })

  if (score <= 3) {
    chrome.action.setBadgeBackgroundColor({ color: '#22c55e', tabId })
  } else if (score <= 6) {
    chrome.action.setBadgeBackgroundColor({ color: '#f59e0b', tabId })
  } else {
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444', tabId })
  }

  // History save karo
  chrome.tabs.get(tabId, (tab) => {
    if (tab?.url) {
      try {
        const domain = new URL(tab.url).hostname
        saveSiteHistory(domain, score, findings.length)
      } catch(e) {}
    }
  })
}

function saveSiteHistory(domain, score, findingCount) {
  const key = `dp_history_${domain}`
  chrome.storage.local.get([key], (result) => {
    const history = result[key] || []
    history.push({
      date: new Date().toLocaleDateString('en-IN'),
      score: score,
      patterns: findingCount,
      timestamp: Date.now()
    })
    // Sirf last 10 entries rakho
    if (history.length > 10) history.shift()
    chrome.storage.local.set({ [key]: history })
  })
}

// Tab close hone pe cleanup
chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabFindings[tabId]
})