Markdown
# CBU TAAS BDD Specification & Playwright Automation - Lab 2

- **Name:** Jayapriya Subramanian
- **Track:** Agentic AI
- **Lab Name:** Lab 2 — BDD Feature Specification & Playwright Automation

---

## What It Does
An end-to-end automated testing solution for an IoT/Smart Device Wi-Fi Onboarding Portal. It translates human-readable BDD/Gherkin acceptance criteria into an executable Playwright test suite to validate device provisioning:
1. Simulates network discovery and selection of target Wi-Fi access points.
2. Validates credential security rules by enforcing minimum passphrase length requirements.
3. Tests connection handshake timeouts and verifies successful cloud device provisioning (allocated IP and Cloud Device ID).

---

## Tools Used
- `@playwright/test`: Browser automation, fixture orchestration, and web assertion engine.
- `TypeScript`: Strongly typed test execution scripting.
- `Gherkin / BDD`: Domain-specific language for business requirement specification (`Given-When-Then`).

---

## How to Run
1. Clone the repository and navigate into the project directory:
   ```bash
   git clone [https://github.com/jppriya95/lab2-iot-onboarding.git](https://github.com/jppriya95/lab2-iot-onboarding.git)
   cd thinkpalm-agentai-Jayapriya-Lab2
Install dependencies and browser binaries:

Bash
npm install
npx playwright install
Run the test suite:

Bash
# Execute Playwright tests
npx playwright test src/tests/iot_onboarding.spec.ts

# Generate and open visual HTML test report
npx playwright test src/tests/iot_onboarding.spec.ts --reporter=html
npx playwright show-report
Observations & Output Trace
All 3 BDD scenarios executed cleanly with 100% pass rate:

Scenario 1 (Valid Flow): Connected to Office-5G, validated provisioning success message, IP 192.168.1.145, and Cloud ID IOT-DEV-99218-X.

Scenario 2 (Validation Guard): Prevented short passphrase submission and asserted the inline validation error.

Scenario 3 (Timeout Handling): Verified handshake timeout alert and confirmation of the retry button for unreachable access points.
