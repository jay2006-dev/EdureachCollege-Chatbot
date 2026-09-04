import test from "node:test";
import assert from "node:assert/strict";

import { buildGroundedAnswer } from "../src/services/rag.service.js";

test("buildGroundedAnswer creates a specific answer from unique context and avoids raw duplicate chunk echoing", () => {
  const docs = [
    {
      pageContent:
        "EduReach has a 92% placement rate and the average package is Rs 8.5 LPA.",
    },
    {
      pageContent:
        "EduReach has a 92% placement rate and the average package is Rs 8.5 LPA.",
    },
    {
      pageContent:
        "The college offers B.Tech, MBA, and M.Tech programs with industry-focused learning.",
    },
  ];

  const answer = buildGroundedAnswer(
    "What is the placement rate at EduReach?",
    docs,
  );

  assert.ok(
    answer.length > 80,
    "Answer should contain a substantial response.",
  );
  assert.match(answer.toLowerCase(), /placement|92%/i);
  assert.doesNotMatch(
    answer,
    /EduReach has a 92% placement rate and the average package is Rs 8.5 LPA\.\n\nEduReach has a 92% placement rate and the average package is Rs 8.5 LPA\./i,
  );
  assert.ok(
    !answer.includes("The college offers B.Tech, MBA, and M.Tech programs") ||
      answer.toLowerCase().includes("placement"),
  );
});
