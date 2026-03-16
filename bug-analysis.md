# Bug Analysis: Duplicate Suggestions + 0% Utilization

## Bug 1: Duplicate Suggestions
**Root cause:** `generateQuickSuggestion()` calls `retrieveScript()` which matches against the FULL `analysisBuffer`. 
The `analysisBuffer` is only cleared when a quick suggestion fires. But `retrieveScript()` does keyword matching 
against ALL accumulated text. So if the same keywords persist in the buffer (e.g., "state documents", "licensing"), 
the SAME script will match on every new transcript chunk that arrives.

**Fix needed:** Track recently-fired scriptIds in session state. If a scriptId was already fired within the last 
60 seconds (or the same session), skip it. Add a `recentScriptIds: Set<string>` to SessionState.

## Bug 2: Word Track Utilization 0%
**Root cause:** The `insertCopilotSuggestion()` function does NOT return the inserted row's ID. The broadcast 
sends the suggestion to the client WITHOUT a DB id. The client's `Suggestion.id` is always `undefined`. 
When the user clicks "Mark as Used", `handleMarkUsed(i, s.id)` passes `undefined` as `suggId`, 
and the `if (suggId)` guard skips the mutation call entirely.

**Fix needed:** 
1. Make `insertCopilotSuggestion()` return the inserted ID
2. Include the DB id in the broadcast/send to the client
3. The client already handles `s.id` correctly — it just never receives one
