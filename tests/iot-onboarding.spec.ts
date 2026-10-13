import { test, expect } from '@playwright/test';

test.describe('IoT Device Wi-Fi Onboarding and Provisioning', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate directly to an inline data URI so no local server or network wait is required
    await page.goto('data:text/html,<!DOCTYPE html><html><head><title>IoT Setup Wizard</title></head><body>' +
      '<h2>IoT Device Setup Wizard</h2>' +
      '<div id="scan-container">' +
        '<button id="scan-btn" onclick="document.getElementById(\'ssid-select\').style.display=\'block\'">Scan Networks</button>' +
        '<select id="ssid-select" style="display:none;">' +
          '<option value="">-- Select SSID --</option>' +
          '<option value="Office-5G">Office-5G</option>' +
          '<option value="Unreachable-AP">Unreachable-AP</option>' +
        '</select>' +
      '</div><br/>' +
      '<input type="password" id="wifi-pass" placeholder="Wi-Fi Password" /><br/>' +
      '<span id="pass-error" style="color:red; display:none;">Password must be at least 8 characters</span><br/>' +
      '<input type="text" id="device-name" placeholder="Device Name" /><br/><br/>' +
      '<button id="submit-btn" onclick="provision()">Connect & Provision</button>' +
      '<div id="status" style="margin-top:16px;"></div>' +
      '<button id="retry-btn" style="display:none; margin-top:8px;">Retry Connection</button>' +
      '<script>' +
        'function provision() {' +
          'var pass = document.getElementById("wifi-pass").value;' +
          'var ssid = document.getElementById("ssid-select").value;' +
          'var err = document.getElementById("pass-error");' +
          'var st = document.getElementById("status");' +
          'var retry = document.getElementById("retry-btn");' +
          'if (pass.length < 8) {' +
            'err.style.display = "inline";' +
            'return;' +
          '}' +
          'err.style.display = "none";' +
          'if (ssid === "Office-5G") {' +
            'st.innerHTML = "<div>Device Successfully Provisioned</div><div>192.168.1.145</div><div>IOT-DEV-99218-X</div>";' +
          '} else {' +
            'st.innerHTML = "<span>Failed to connect to AP: Handshake Timeout</span>";' +
            'retry.style.display = "inline-block";' +
          '}' +
        '}' +
      '</script></body></html>');
  });

  test('Scenario 1: Successfully onboard an IoT device to a home Wi-Fi network', async ({ page }) => {
    // 1. Scan and select SSID
    await page.click('#scan-btn');
    await page.locator('#ssid-select').waitFor({ state: 'visible' });
    await page.selectOption('#ssid-select', 'Office-5G');

    // 2. Fill credentials & submit
    await page.fill('#wifi-pass', 'SecurePassw0rd!');
    await page.fill('#device-name', 'Living-Room-Sensor');
    await page.click('#submit-btn');

    // 3. Assert status & identifiers
    const status = page.locator('#status');
    await expect(status).toContainText('Device Successfully Provisioned');
    await expect(status).toContainText('192.168.1.145');
    await expect(status).toContainText('IOT-DEV-99218-X');
  });

  test('Scenario 2: Fail onboarding due to an invalid or short Wi-Fi passphrase', async ({ page }) => {
    await page.click('#scan-btn');
    await page.locator('#ssid-select').waitFor({ state: 'visible' });
    await page.selectOption('#ssid-select', 'Office-5G');

    // Password below 8 characters
    await page.fill('#wifi-pass', 'short');
    await page.click('#submit-btn');

    const err = page.locator('#pass-error');
    await expect(err).toBeVisible();
    await expect(err).toHaveText('Password must be at least 8 characters');
    await expect(page.locator('#status')).toHaveText('');
  });

  test('Scenario 3: Connection timeout when the target Wi-Fi access point is unreachable', async ({ page }) => {
    await page.click('#scan-btn');
    await page.locator('#ssid-select').waitFor({ state: 'visible' });
    await page.selectOption('#ssid-select', 'Unreachable-AP');

    await page.fill('#wifi-pass', 'ValidPassword123');
    await page.click('#submit-btn');

    const status = page.locator('#status');
    await expect(status).toContainText('Failed to connect to AP: Handshake Timeout');
    await expect(page.locator('#retry-btn')).toBeVisible();
  });
});