Feature: IoT Device Wi-Fi Onboarding and Provisioning
  As a network administrator or smart device owner
  I want to provision my IoT device with local Wi-Fi credentials
  So that the device can connect to the Internet and register with the cloud

  Background:
    Given the user navigates to the IoT onboarding portal
    And the device setup wizard is loaded

  Scenario: Successfully onboard an IoT device to a home Wi-Fi network
    When the user scans for available Wi-Fi networks
    And the user selects SSID "Office-5G" from the network list
    And the user enters the Wi-Fi password "SecurePassw0rd!"
    And the user sets the device name to "Living-Room-Sensor"
    And the user clicks the "Connect & Provision" button
    Then the onboarding status should update to "Device Successfully Provisioned"
    And the portal should display the allocated IP address and Cloud Device ID

  Scenario: Fail onboarding due to an invalid or short Wi-Fi passphrase
    When the user scans for available Wi-Fi networks
    And the user selects SSID "Office-5G" from the network list
    And the user enters the Wi-Fi password "short"
    And the user clicks the "Connect & Provision" button
    Then an error message "Password must be at least 8 characters" should be displayed

  Scenario: Connection timeout when the target Wi-Fi access point is unreachable
    When the user scans for available Wi-Fi networks
    And the user selects SSID "Unreachable-AP" from the network list
    And the user enters the Wi-Fi password "ValidPassword123"
    And the user clicks the "Connect & Provision" button
    Then the portal should display an error alert "Failed to connect to AP: Handshake Timeout"
    And a "Retry Connection" button should be visible