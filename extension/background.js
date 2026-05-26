// Background service worker
// Stores findings per tab

const tabFindings = {}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // Content script ne findings bheje
  if (message.type === 'FINDING_DETECTED') {
    const tabId = sender.tab.id
    tabFindings[tabId] = message.findings
    console.log('Findings stored for tab:', tabId, message.findings)
  }

  // Popup ne findings maange
  if (message.type === 'GET_FINDINGS') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id
      const findings = tabFindings[tabId] || []
      sendResponse({ findings: findings })
    })
    return true // async response ke liye zaroori
  }

})