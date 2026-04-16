// test_component_persistence.js
// Test to verify component and follow_up data persistence

import {
  getSession,
  appendMessage,
  deleteSession,
} from "./utils/persistentSessionStore.js";

async function test() {
  console.log("=== Testing Component & Follow-up Persistence ===\n");

  const testSessionId = "test-component-" + Date.now();
  console.log(`Test Session ID: ${testSessionId}\n`);

  try {
    // Test 1: Add human message
    console.log("TEST 1: Add human message");
    await appendMessage(testSessionId, "human", "Show me the Nexon");
    let session = await getSession(testSessionId);
    console.log(`  ✓ Messages: ${session.messages.length}`);
    console.log();

    // Test 2: Add assistant message WITH component and follow_up
    console.log("TEST 2: Add assistant message with component & follow_up");
    const mockComponent = {
      required: true,
      name: "car_card",
      content: { model: "Tata Nexon" }
    };
    const mockFollowUp = "Do you want to check pricing?";

    await appendMessage(testSessionId, "assistant", "Here's the Tata Nexon!", {
      component: mockComponent,
      follow_up: mockFollowUp
    });

    session = await getSession(testSessionId);
    console.log(`  ✓ Messages saved: ${session.messages.length}`);
    
    const lastMsg = session.messages[session.messages.length - 1];
    console.log(`  ✓ Last message role: ${lastMsg.role}`);
    console.log(`  ✓ Last message has component: ${!!lastMsg.component}`);
    console.log(`  ✓ Last message has follow_up: ${!!lastMsg.follow_up}`);
    
    if (lastMsg.component) {
      console.log(`    Component name: ${lastMsg.component.name}`);
    }
    if (lastMsg.follow_up) {
      console.log(`    Follow-up: "${lastMsg.follow_up}"`);
    }
    console.log();

    // Test 3: Reload and verify persistence
    console.log("TEST 3: Reload from disk (simulating browser refresh)");
    const reloaded = await getSession(testSessionId);
    console.log(`  ✓ Messages loaded: ${reloaded.messages.length}`);
    
    const reloadedLast = reloaded.messages[reloaded.messages.length - 1];
    console.log(`  ✓ Reloaded message has component: ${!!reloadedLast.component}`);
    console.log(`  ✓ Reloaded message has follow_up: ${!!reloadedLast.follow_up}`);
    
    if (!reloadedLast.component) {
      console.log(`  ✗ ERROR: Component was not persisted!`);
    }
    if (!reloadedLast.follow_up) {
      console.log(`  ✗ ERROR: Follow-up was not persisted!`);
    }

    const allGood = !!reloadedLast.component && !!reloadedLast.follow_up;
    console.log(`\n  Result: ${allGood ? '✓ PASS' : '✗ FAIL'}\n`);

    // Cleanup
    await deleteSession(testSessionId);
    console.log("Session cleaned up.");
  } catch (err) {
    console.error("Test error:", err);
  }
}

test();
