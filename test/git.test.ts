import test from "node:test"
import assert from "node:assert/strict"
import { parseGitStatus } from "../src/data/git.ts"

test("parse clean branch", () => {
  const status = parseGitStatus(
    ["# branch.oid abc123", "# branch.head main", "# branch.upstream origin/main", "# branch.ab +0 -0"].join("\n"),
  )
  assert.equal(status.branch, "main")
  assert.equal(status.status, "clean")
  assert.equal(status.upstream, "origin/main")
  assert.equal(status.ahead, 0)
  assert.equal(status.behind, 0)
})

test("parse ahead and behind", () => {
  const status = parseGitStatus(
    ["# branch.head feature", "# branch.ab +2 -3"].join("\n"),
  )
  assert.equal(status.ahead, 2)
  assert.equal(status.behind, 3)
})

test("parse working tree changes", () => {
  const status = parseGitStatus(
    [
      "# branch.head main",
      "1 M. N... 100644 100644 100644 abc def file.txt",
      "1 .M N... 100644 100644 100644 abc def file2.txt",
      "? untracked.txt",
      "u UU N... 100644 100644 100644 100644 abc def conflict.txt",
    ].join("\n"),
  )
  assert.equal(status.staged, 1)
  assert.equal(status.unstaged, 1)
  assert.equal(status.untracked, 1)
  assert.equal(status.conflicts, 1)
  assert.equal(status.status, "conflicts")
})

test("parse dirty without conflicts", () => {
  const status = parseGitStatus(
    ["# branch.head main", "1 M. N... 100644 100644 100644 abc def file.txt"].join("\n"),
  )
  assert.equal(status.status, "dirty")
})

test("parse detached head", () => {
  const status = parseGitStatus("# branch.head (detached)")
  assert.equal(status.branch, "detached")
})
