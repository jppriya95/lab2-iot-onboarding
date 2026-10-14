import { test, expect } from '@playwright/test';

test.describe('IoT Device Wi-Fi Onboarding and Provisioning System', () => {

  let handshakeAttempts = 0;

  test.beforeEach(async ({ page }) => {
    handshakeAttempts = 0;

    // 1. Intercept base page navigation so fetch() runs in a valid HTTP origin
    await page.route('http://localhost:3000/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <!DOCTYPE html>
          <html>
          <head><title>IoT Provisioning Portal</title></head>
          <body>
            <h2>IoT Gateway Setup Portal</h2>
            <button id="scan-btn" onclick="startScan()">Scan Networks</button>
            <select id="ssid-select" style="display:none;"></select><br/><br/>
            
            <input type="password" id="wifi-pass" placeholder="Wi-Fi Password" /><br/>
            <span id="pass-error" style="color:red; display:none;">Password must be at least 8 characters</span><br/>
            
            <input type="text" id="device-name" placeholder="Device Name" /><br/><br/>
            <button id="submit-btn" onclick="submitProvisioning()">Connect & Provision</button>
            
            <div id="status" style="margin-top:16px;"></div>
            <button id="retry-btn" style="display:none; margin-top:8px;" onclick="submitProvisioning()">Retry Connection</button>

            <script>
              async function startScan() {
                try {
                  const res = await fetch('/api/v1/wifi/scan');
                  const data = await res.json();
                  const sel = document.getElementById('ssid-select');
                  sel.innerHTML = '<option value="">-- Select SSID --</option>';
                  data.networks.forEach(function(n) {
                    const opt = document.createElement('option');
                    opt.value = n.ssid;
                    opt.textContent = n.ssid;
                    sel.appendChild(opt);
                  });
                  sel.style.display = 'block';
                } catch(e) {
                  console.error(e);
                }
              }

              async function submitProvisioning() {
                const pass = document.getElementById('wifi-pass').value;
                const ssid = document.getElementById('ssid-select').value;
                const devName = document.getElementById('device-name').value;
                const errSpan = document.getElementById('pass-error');
                const statusDiv = document.getElementById('status');
                const retryBtn = document.getElementById('retry-btn');

                if (pass.length < 8) {
                  errSpan.style.display = 'inline';
                  return;
                }
                errSpan.style.display = 'none';
                statusDiv.textContent = 'Connecting...';

                try {
                  const response = await fetch('/api/v1/provision', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ssid: ssid, password: pass, deviceName: devName })
                  });

                  const data = await response.json();
                  if (response.ok) {
                    statusDiv.innerHTML = '<div>' + data.message + '</div><div>IP: ' + data.ip + '</div><div>Device ID: ' + data.deviceId + '</div>';
                  } else {
                    statusDiv.innerHTML = '<span style="color:red;">' + data.error + '</span>';
                    if (data.retryable) retryBtn.style.display = 'inline-block';
                  }
                } catch(e) {
                  console.error(e);
                }
              }
            </script>
          </body>
          </html>
        `
      });
    });

    // 2. Intercept Wi-Fi Scan API
    await page.route('**/api/v1/wifi/scan', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          networks: [{ ssid: 'Office-5G' }, { ssid: 'Unreachable-AP' }]
        })
      });
    });

    // Navigate to the mock portal root
    await page.goto('http://localhost:3000/');
  });

  test('Scenario 1: Successfully onboard an IoT device to target Wi-Fi network (HTTP 200)', async ({ page }) => {
    // Assert incoming POST request body
    await page.route('**/api/v1/provision', async (route) => {
      const payload = route.request().postDataJSON();
      expect(payload.ssid).toBe('Office-5G');
      expect(payload.password).toBe('SecurePassw0rd!');
      expect(payload.deviceName).toBe('Living-Room-Sensor');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: 'Device Successfully Provisioned',
          ip: '192.168.1.145',
          deviceId: 'IOT-DEV-99218-X'
        })
      });
    });

    await page.click('#scan-btn');
    const select = page.locator('#ssid-select');
    await expect(select).toBeVisible();
    await select.selectOption('Office-5G');

    await page.fill('#wifi-pass', 'SecurePassw0rd!');
    await page.fill('#device-name', 'Living-Room-Sensor');

    // Wait for the HTTP 200 response
    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/v1/provision') && res.status() === 200),
      page.click('#submit-btn')
    ]);

    expect(response.status()).toBe(200);

    // Verify UI output
    const status = page.locator('#status');
    await expect(status).toContainText('Device Successfully Provisioned');
    await expect(status).toContainText('192.168.1.145');
    await expect(status).toContainText('IOT-DEV-99218-X');
  });

  test('Scenario 2: Boundary check - reject 7-character password prior to API submission', async ({ page }) => {
    let apiCalled = false;
    await page.route('**/api/v1/provision', async (route) => {
      apiCalled = true;
      await route.fulfill({ status: 422, body: JSON.stringify({ error: 'Validation failed' }) });
    });

    await page.click('#scan-btn');
    const select = page.locator('#ssid-select');
    await expect(select).toBeVisible();
    await select.selectOption('Office-5G');

    // Boundary value: 7 characters (boundary condition < 8)
    await page.fill('#wifi-pass', '1234567');
    await page.click('#submit-btn');

    // Assert validation error displayed
    const passError = page.locator('#pass-error');
    await expect(passError).toBeVisible();
    await expect(passError).toHaveText('Password must be at least 8 characters');

    // Verify client blocked network request from firing
    expect(apiCalled).toBe(false);
  });

  test('Scenario 3: Connection timeout when target AP is unreachable (HTTP 504 & Retry Count)', async ({ page }) => {
    await page.route('**/api/v1/provision', async (route) => {
      const payload = route.request().postDataJSON();
      expect(payload.ssid).toBe('Unreachable-AP');
      handshakeAttempts++;

      await route.fulfill({
        status: 504,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Failed to connect to AP: Handshake Timeout',
          retryable: true,
          attempts: handshakeAttempts
        })
      });
    });

    await page.click('#scan-btn');
    const select = page.locator('#ssid-select');
    await expect(select).toBeVisible();
    await select.selectOption('Unreachable-AP');

    await page.fill('#wifi-pass', 'ValidPassword123');

    // Initial attempt: returns 504
    const [res1] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/v1/provision')),
      page.click('#submit-btn')
    ]);
    expect(res1.status()).toBe(504);

    const retryBtn = page.locator('#retry-btn');
    await expect(retryBtn).toBeVisible();
    await expect(page.locator('#status')).toContainText('Failed to connect to AP: Handshake Timeout');

    // Click retry: verify second request and assert attempt counter
    const [res2] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/v1/provision')),
      retryBtn.click()
    ]);
    expect(res2.status()).toBe(504);
    expect(handshakeAttempts).toBe(2);
  });
});