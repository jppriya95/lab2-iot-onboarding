Feature: IoT Device Wi-Fi Onboarding and Provisioning
  As a network administrator or smart device owner
  I want to provision an IoT device with local Wi-Fi credentials
  So that the device can securely authenticate and register with the cloud platform

  Background:
    Given the user opens the IoT device setup portal
    And the gateway scan reveals active wireless access points

  Scenario: Successfully onboard an IoT device to target Wi-Fi network
    When the user selects SSID "Office-5G"
    And the user enters a valid Wi-Fi password "SecurePassw0rd!"
    And the user assigns device name "Living-Room-Sensor"
    And the user submits the provisioning request
    Then the system should issue an HTTP POST request to "/api/v1/provision"
    And the server should respond with HTTP status 200
    And the portal displays "Device Successfully Provisioned" with assigned IP and Cloud ID

  Scenario Outline: Validate Wi-Fi passphrase boundary conditions
    When the user selects SSID "Office-5G"
    And the user enters a password "<password>" of length <length>
    And the user submits the provisioning request
    Then the system client validation blocks or server responds with HTTP status <status>
    And the portal should display the validation message "<message>"

    Examples:
      | length | password  | status | message                                |
      | 7      | 1234567   | 422    | Password must be at least 8 characters |
      | 0      |           | 422    | Password must be at least 8 characters |

  Scenario: Connection timeout when target access point is unreachable
    When the user selects SSID "Unreachable-AP"
    And the user enters a valid Wi-Fi password "ValidPassword123"
    And the user submits the provisioning request
    Then the provisioning service attempts 2 handshake retries
    And the server should respond with HTTP status 504
    And the portal displays alert "Failed to connect to AP: Handshake Timeout"
    And a "Retry Connection" button is visible