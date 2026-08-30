# CRITICAL BUG FIX: Multiple Extractions Causing Duplicate Cards

## Problem Description
Time Agent is calling extraction endpoints **5 TIMES** for a single field report input, causing:
- ✅ First card: "SPOOL ERECTED" with PIPING discipline (Claude extraction - CORRECT)
- ❌ Second card: "SPOL Erected" with CIVIL discipline (rule-based fallback - WRONG)

Result: User sees duplicate/conflicting results instead of single Claude-powered extraction

## Root Cause
Multiple `fetch("/ingest/")` calls scattered throughout `apps/time-agent/src/App.tsx`:
1. Line 390: `fetch("http://localhost:8001/ingest/llm")` - Offline sync
2. Line 560: `fetch("http://localhost:8001/ingest/llm")` - Text input handler  
3. Line 642: `fetch("http://localhost:8001/ingest/file")` - File upload
4. Plus 2 more fallback/retry mechanisms

This causes the SAME field report to be extracted multiple times with different algorithms, producing conflicting discipline predictions.

## Solution
**Single Source of Truth for Extraction**

Consolidate into ONE unified extraction function that:
1. ✅ Uses ONLY `/ingest/llm` endpoint (Claude-based)
2. ✅ Enforces consistent behavior across all input types
3. ✅ Prevents duplicate extractions
4. ✅ Ensures discipline is ALWAYS from Claude Intelligence

## Implementation

### Step 1: Create Unified Extraction Function
```typescript
const extractFieldReport = async (text: string, source: string = "field_input") => {
  try {
    const response = await fetch("http://localhost:8001/ingest/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text,
        source_document: source,
        default_date: new Date().toISOString().split("T")[0]
      })
    });
    
    if (!response.ok) throw new Error(`Extraction failed: ${response.status}`);
    
    const data = await response.json();
    if (!data.events || data.events.length === 0) {
      return null; // No extractable events
    }
    
    // Return ONLY the FIRST event (prevents duplicates)
    // and use CLAUDE prediction (discipline from LLM)
    return data.events[0];
  } catch (err: any) {
    console.error("Extraction error:", err);
    throw err;
  }
};
```

### Step 2: Update All Handlers
Replace all inline extraction calls with the unified function:

**Text Input Handler (line 560):**
```javascript
// BEFORE: 3-4 different extraction attempts
const ingestRes = await fetch("http://localhost:8001/ingest/llm", { ... });

// AFTER: Use unified function
const event = await extractFieldReport(newMsg.text, "field_agent_chat");
```

**File Upload Handler (line 642):**
```javascript
// BEFORE: fetch("/ingest/file") then potentially retry with llm

// AFTER: Read file as text, then use unified function
const text = await file.text();
const event = await extractFieldReport(text, `file_${file.name}`);
```

**Offline Sync Handler (line 390):**
```javascript
// BEFORE: Multiple extraction attempts

// AFTER: Use unified function
const event = await extractFieldReport(item.text, "offline_sync");
```

### Step 3: Remove Fallback Extraction Calls
Delete all secondary/fallback extraction attempts that could create duplicate results.

## Expected Result
✅ **Single extraction per field report**
✅ **Always uses Claude Intelligence**
✅ **Consistent discipline prediction**
✅ **No duplicate cards**

Example: User types "24-inch spool erection at sector 4"
- ✅ ONE card appears
- ✅ Activity: "Spool erection completed"
- ✅ Discipline: **PIPING** (correct)
- ✅ Confidence: From Claude extraction
- ✅ No conflicting CIVIL prediction

## Files to Modify
- `apps/time-agent/src/App.tsx` - Lines 390, 560, 642, and any fallback mechanisms

## Testing
1. Submit text field report → Expect ONE card with PIPING discipline
2. Upload file with field data → Expect ONE card with correct discipline
3. Offline sync → Expect ONE card per item with Claude prediction
4. Multiple reports → Each gets exactly ONE extraction result

## Benefits
- **Correctness**: Claude Intelligence used consistently
- **Performance**: 5x fewer API calls to extraction service
- **UX**: No confusing duplicate cards
- **Maintainability**: Single point of extraction logic
- **Reliability**: No race conditions from multiple extractions

---

**Priority**: CRITICAL - This is blocking correct application behavior
**Status**: Ready to implement
**Effort**: 2-3 hours for complete refactor
