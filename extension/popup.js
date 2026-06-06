document.addEventListener('DOMContentLoaded', () => {

  // Domain dikhao
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    try {
      const url = new URL(tabs[0].url)
      document.getElementById('domain').textContent = url.hostname
    } catch(e) {}
  })

  // Findings lo
  chrome.runtime.sendMessage({ type: 'GET_FINDINGS' }, (response) => {
    if (response && response.findings) {
      displayFindings(response.findings)
    }
  })

  // View Full Report button — Side Panel kholo
  document.getElementById('viewAll').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.sidePanel.open({ tabId: tabs[0].id })
      window.close()
    })
  })

  // Rescan button
  document.getElementById('rescan').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.reload(tabs[0].id)
      window.close()
    })
  })

})

function displayFindings(findings) {
  const list = document.getElementById('findingsList')
  const scoreBadge = document.getElementById('scoreBadge')
  const scoreNumber = document.getElementById('scoreNumber')
  const scoreText = document.getElementById('scoreText')

  if (findings.length === 0) {
    scoreNumber.textContent = '0'
    scoreText.textContent = 'No dark patterns found'
    scoreBadge.classList.add('green')
    return
  }

  const maxSeverity = Math.max(...findings.map(f => f.severity))
  const bonus = Math.floor(Math.log2(findings.length))
  const pageScore = Math.min(10, maxSeverity + bonus)

  scoreNumber.textContent = pageScore
  if (pageScore <= 3) {
    scoreBadge.classList.add('green')
    scoreText.textContent = 'Low risk page'
  } else if (pageScore <= 6) {
    scoreBadge.classList.add('yellow')
    scoreText.textContent = 'Moderate manipulation detected'
  } else {
    scoreBadge.classList.add('red')
    scoreText.textContent = 'High manipulation detected!'
  }

  list.innerHTML = ''
  findings.slice(0, 5).forEach(finding => {
    const li = document.createElement('li')
    li.className = `finding-item ${getSeverityColor(finding.severity)}`
    li.innerHTML = `
      <span class="finding-name">${finding.patternType}</span>
      <span class="finding-score">${finding.severity}/10</span>
    `
    list.appendChild(li)
  })
}

function getSeverityColor(severity) {
  if (severity <= 3) return 'green'
  if (severity <= 6) return 'yellow'
  return 'red'
}