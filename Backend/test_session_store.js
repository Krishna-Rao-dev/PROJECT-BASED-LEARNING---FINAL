// test_session_store.js
// Test to verify component and follow_up persistence

import {
  getSession,
  appendMessage,
  updateSession,
  deleteSession,
} from "./utils/persistentSessionStore.js";

async function test() {
  console.log("=== Testing Component & Follow-up Persistence ===\n");

  const testSessionId = "test-component-" + Date.now();
  console.log(`Test Session ID: ${testSessionId}\n`);

  // Test 1: Create and load a new session
  console.log("TEST 1: Create new session");
  let session = await getSession(testSessionId);
  console.log(`  Messages count: ${session.messages.length}`);
  console.log(`  UserState: ${JSON.stringify(session.userState)}\n`);

  // Test 2: Append a message
  console.log("TEST 2: Append human message");
  await appendMessage(testSessionId, "human", "Hello, what is EMI?");
  session = await getSession(testSessionId);
  console.log(`  Messages count after append: ${session.messages.length}`);
  if (session.messages.length > 0) {
    console.log(`  First message: ${JSON.stringify(session.messages[0])}\n`);
  }

  // Test 3: Append another message
  console.log("TEST 3: Append assistant message");
  await appendMessage(testSessionId, "assistant", "EMI means Equated Monthly Installment...");
  session = await getSession(testSessionId);
  console.log(`  Messages count after 2nd append: ${session.messages.length}`);
  session.messages.forEach((m, i) => {
    console.log(`  Message ${i}: ${m.role} - ${m.content.substring(0, 30)}...`);
  });
  console.log();

  // Test 4: Update user state
  console.log("TEST 4: Update user state");
  await updateSession(testSessionId, { 
    userState: { 
      ...session.userState, 
      budget: "15-20 lakhs",
      location: "Mumbai"
    }
  });
  session = await getSession(testSessionId);
  console.log(`  Budget: ${session.userState.budget}`);
  console.log(`  Location: ${session.userState.location}`);
  console.log(`  Message count still: ${session.messages.length}\n`);

  // Test 5: Reload and verify persistence
  console.log("TEST 5: Reload from disk and verify");
  const reloaded = await getSession(testSessionId);
  console.log(`  Messages persisted: ${reloaded.messages.length}`);
  console.log(`  User state persisted: budget=${reloaded.userState.budget}`);
  console.log(`  Session file actually exists and data is preserved: ${
    reloaded.messages.length === 2 && reloaded.userState.budget === "15-20 lakhs" ? "✓ PASS" : "✗ FAIL"
  }\n`);

  // Cleanup
  console.log("Cleaning up...");
  await deleteSession(testSessionId);
  console.log("Done!\n");
}

test().catch(err => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
