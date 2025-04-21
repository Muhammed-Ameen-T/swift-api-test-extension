document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('api-form');
    const toggleThemeBtn = document.getElementById('toggle-theme');
    const historyList = document.getElementById('history-list');
    const responseBody = document.getElementById('response-body');
    const statusCode = document.getElementById('status-code');
    const copyResponseBtn = document.getElementById('copy-response');
    const exportResponseBtn = document.getElementById('export-response');
  
    // Load theme
    const isDark = localStorage.getItem('theme') === 'dark';
    document.body.classList.toggle('dark', isDark);
    document.body.classList.toggle('light', !isDark);
  
    // Toggle theme
    toggleThemeBtn.addEventListener('click', () => {
      const isDark = document.body.classList.contains('dark');
      document.body.classList.toggle('dark', !isDark);
      document.body.classList.toggle('light', isDark);
      localStorage.setItem('theme', isDark ? 'light' : 'dark');
    });
  
    // Load request history
    chrome.storage.local.get(['requests'], ({ requests = [] }) => {
      requests.forEach((req, index) => addToHistory(req, index));
    });
  
    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const method = document.getElementById('method').value;
      const url = document.getElementById('url').value;
      let headers = document.getElementById('headers').value;
      let body = document.getElementById('body').value;
  
      // Validate and parse headers
      try {
        headers = headers ? JSON.parse(headers) : {};
      } catch {
        statusCode.textContent = 'Error: Invalid headers JSON';
        return;
      }
  
      // Prepare request
      const request = { method, url, headers, body };
      statusCode.textContent = 'Sending...';
      responseBody.textContent = '';
  
      try {
        const response = await fetch(url, {
          method,
          headers,
          body: method !== 'GET' && body ? body : undefined,
        });
  
        const responseText = await response.text();
        statusCode.textContent = `Status: ${response.status} ${response.statusText}`;
  
        // Format JSON response if possible
        try {
          const json = JSON.parse(responseText);
          responseBody.textContent = JSON.stringify(json, null, 2);
        } catch {
          responseBody.textContent = responseText;
        }
  
        // Save to history
        chrome.storage.local.get(['requests'], ({ requests = [] }) => {
          requests.unshift(request);
          if (requests.length > 50) requests.pop(); // Limit history
          chrome.storage.local.set({ requests }, () => {
            addToHistory(request, 0);
          });
        });
      } catch (error) {
        statusCode.textContent = 'Error';
        responseBody.textContent = error.message;
      }
    });
  
    // Add request to history UI
    function addToHistory(req, index) {
      const li = document.createElement('li');
      li.textContent = `${req.method} ${req.url}`;
      li.addEventListener('click', () => {
        document.getElementById('method').value = req.method;
        document.getElementById('url').value = req.url;
        document.getElementById('headers').value = JSON.stringify(req.headers, null, 2);
        document.getElementById('body').value = req.body || '';
      });
      historyList.insertBefore(li, historyList.firstChild);
    }
  
    // Copy response
    copyResponseBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(responseBody.textContent);
      copyResponseBtn.textContent = 'Copied!';
      setTimeout(() => (copyResponseBtn.textContent = 'Copy Response'), 1000);
    });
  
    // Export response
    exportResponseBtn.addEventListener('click', () => {
      const blob = new Blob([responseBody.textContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'api-response.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  });