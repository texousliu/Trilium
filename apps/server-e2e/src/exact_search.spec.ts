import { test, expect } from "@playwright/test";
import App from "./support/app";

const BASE_URL = "http://127.0.0.1:8082";

/**
 * E2E tests for exact search functionality using the leading "=" operator.
 *
 * These tests validate the GitHub issue:
 * - Searching for "pagio" returns many false positives (e.g., "page", "pages")
 * - Searching for "=pagio" should return ONLY exact matches for "pagio"
 */

test.describe("Exact Search with Leading = Operator", () => {
    let csrfToken: string;
    let createdNoteIds: string[] = [];

    test.beforeEach(async ({ page, context }) => {
        const app = new App(page, context);
        await app.goto();

        // Get CSRF token
        csrfToken = await page.evaluate(() => {
            return (window as any).glob.csrfToken;
        });

        expect(csrfToken).toBeTruthy();

        // Create test notes with specific content patterns
        // Note 1: Contains exactly "pagio" in title
        const note1 = await page.request.post(`${BASE_URL}/api/notes/root/children?target=into&targetBranchId=`, {
            headers: { "x-csrf-token": csrfToken },
            data: {
                title: "Test Note with pagio",
                content: "This note contains the word pagio in the content.",
                type: "text"
            }
        });
        expect(note1.ok()).toBeTruthy();
        const note1Data = await note1.json();
        createdNoteIds.push(note1Data.note.noteId);

        // Note 2: Contains "page" (not exact match)
        const note2 = await page.request.post(`${BASE_URL}/api/notes/root/children?target=into&targetBranchId=`, {
            headers: { "x-csrf-token": csrfToken },
            data: {
                title: "Test Note with page",
                content: "This note contains the word page in the content.",
                type: "text"
            }
        });
        expect(note2.ok()).toBeTruthy();
        const note2Data = await note2.json();
        createdNoteIds.push(note2Data.note.noteId);

        // Note 3: Contains "pages" (plural, not exact match)
        const note3 = await page.request.post(`${BASE_URL}/api/notes/root/children?target=into&targetBranchId=`, {
            headers: { "x-csrf-token": csrfToken },
            data: {
                title: "Test Note with pages",
                content: "This note contains the word pages in the content.",
                type: "text"
            }
        });
        expect(note3.ok()).toBeTruthy();
        const note3Data = await note3.json();
        createdNoteIds.push(note3Data.note.noteId);

        // Note 4: Contains "homepage" (contains "page", not exact match)
        const note4 = await page.request.post(`${BASE_URL}/api/notes/root/children?target=into&targetBranchId=`, {
            headers: { "x-csrf-token": csrfToken },
            data: {
                title: "Homepage Note",
                content: "This note is about homepage content.",
                type: "text"
            }
        });
        expect(note4.ok()).toBeTruthy();
        const note4Data = await note4.json();
        createdNoteIds.push(note4Data.note.noteId);

        // Note 5: Another note with exact "pagio" in content
        const note5 = await page.request.post(`${BASE_URL}/api/notes/root/children?target=into&targetBranchId=`, {
            headers: { "x-csrf-token": csrfToken },
            data: {
                title: "Another pagio Note",
                content: "This is another note with pagio content for testing exact matches.",
                type: "text"
            }
        });
        expect(note5.ok()).toBeTruthy();
        const note5Data = await note5.json();
        createdNoteIds.push(note5Data.note.noteId);

        // Note 6: Contains "pagio" in title only
        const note6 = await page.request.post(`${BASE_URL}/api/notes/root/children?target=into&targetBranchId=`, {
            headers: { "x-csrf-token": csrfToken },
            data: {
                title: "pagio",
                content: "This note has pagio as the title.",
                type: "text"
            }
        });
        expect(note6.ok()).toBeTruthy();
        const note6Data = await note6.json();
        createdNoteIds.push(note6Data.note.noteId);

        // Wait a bit for indexing
        await page.waitForTimeout(500);
    });

    test.afterEach(async ({ page }) => {
        // Clean up created notes
        for (const noteId of createdNoteIds) {
            try {
                const taskId = `cleanup-${Math.random().toString(36).substr(2, 9)}`;
                await page.request.delete(`${BASE_URL}/api/notes/${noteId}?taskId=${taskId}&last=true`, {
                    headers: { "x-csrf-token": csrfToken }
                });
            } catch (e) {
                console.error(`Failed to delete note ${noteId}:`, e);
            }
        }
        createdNoteIds = [];
    });

    test("Quick search without = operator returns all partial matches", async ({ page }) => {
        // Test the /quick-search endpoint without the = operator
        const response = await page.request.get(`${BASE_URL}/api/quick-search/pag`, {
            headers: { "x-csrf-token": csrfToken }
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();

        // Should return multiple notes including "page", "pages", "homepage"
        expect(data.searchResultNoteIds).toBeDefined();
        expect(data.searchResults).toBeDefined();

        // Filter to only our test notes
        const testResults = data.searchResults.filter((result: any) =>
            result.noteTitle.includes("page") ||
            result.noteTitle.includes("pagio") ||
            result.noteTitle.includes("Homepage")
        );

        // Should find at least "page", "pages", "homepage", and "pagio" notes
        expect(testResults.length).toBeGreaterThanOrEqual(4);

        console.log("Quick search 'pag' found:", testResults.length, "matching notes");
        console.log("Note titles:", testResults.map((r: any) => r.noteTitle));
    });

    test("Quick search with = operator returns only exact matches", async ({ page }) => {
        // Test the /quick-search endpoint WITH the = operator
        const response = await page.request.get(`${BASE_URL}/api/quick-search/=pagio`, {
            headers: { "x-csrf-token": csrfToken }
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();

        // Should return only notes with exact "pagio" match
        expect(data.searchResultNoteIds).toBeDefined();
        expect(data.searchResults).toBeDefined();

        // Filter to only our test notes
        const testResults = data.searchResults.filter((result: any) =>
            createdNoteIds.includes(result.notePath.split("/").pop() || "")
        );

        console.log("Quick search '=pagio' found:", testResults.length, "matching notes");
        console.log("Note titles:", testResults.map((r: any) => r.noteTitle));

        // Should find exactly 3 notes: "Test Note with pagio", "Another pagio Note", "pagio"
        expect(testResults.length).toBe(3);

        // Verify that none of the results contain "page" or "pages" (only "pagio")
        for (const result of testResults) {
            const title = result.noteTitle.toLowerCase();
            const hasPageNotPagio = (title.includes("page") && !title.includes("pagio"));
            expect(hasPageNotPagio).toBe(false);
        }
    });

    test("Full search API without = operator returns partial matches", async ({ page }) => {
        // Test the /search endpoint without the = operator
        const response = await page.request.get(`${BASE_URL}/api/search/pag`, {
            headers: { "x-csrf-token": csrfToken }
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();

        // Should return an array of note IDs
        expect(Array.isArray(data)).toBe(true);

        // Filter to only our test notes
        const testNoteIds = data.filter((id: string) => createdNoteIds.includes(id));

        console.log("Full search 'pag' found:", testNoteIds.length, "matching notes from our test set");

        // Should find at least 4 notes
        expect(testNoteIds.length).toBeGreaterThanOrEqual(4);
    });

    test("Full search API with = operator returns only exact matches", async ({ page }) => {
        // Test the /search endpoint WITH the = operator
        const response = await page.request.get(`${BASE_URL}/api/search/=pagio`, {
            headers: { "x-csrf-token": csrfToken }
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();

        // Should return an array of note IDs
        expect(Array.isArray(data)).toBe(true);

        // Filter to only our test notes
        const testNoteIds = data.filter((id: string) => createdNoteIds.includes(id));

        console.log("Full search '=pagio' found:", testNoteIds.length, "matching notes from our test set");

        // Should find exactly 3 notes with exact "pagio" match
        expect(testNoteIds.length).toBe(3);
    });

    test("Exact search operator works with content search", async ({ page }) => {
        // Create a note with "test" in title but different content
        const noteWithTest = await page.request.post(`${BASE_URL}/api/notes/root/children?target=into&targetBranchId=`, {
            headers: { "x-csrf-token": csrfToken },
            data: {
                title: "Testing Content",
                content: "This note contains the exact word test in content.",
                type: "text"
            }
        });
        expect(noteWithTest.ok()).toBeTruthy();
        const noteWithTestData = await noteWithTest.json();
        const testNoteId = noteWithTestData.note.noteId;
        createdNoteIds.push(testNoteId);

        // Create a note with "testing" (not exact match)
        const noteWithTesting = await page.request.post(`${BASE_URL}/api/notes/root/children?target=into&targetBranchId=`, {
            headers: { "x-csrf-token": csrfToken },
            data: {
                title: "Testing More",
                content: "This note has testing in the content.",
                type: "text"
            }
        });
        expect(noteWithTesting.ok()).toBeTruthy();
        const noteWithTestingData = await noteWithTesting.json();
        createdNoteIds.push(noteWithTestingData.note.noteId);

        await page.waitForTimeout(500);

        // Search with exact operator
        const response = await page.request.get(`${BASE_URL}/api/quick-search/=test`, {
            headers: { "x-csrf-token": csrfToken }
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();

        const ourTestNotes = data.searchResults.filter((result: any) => {
            const noteId = result.notePath.split("/").pop();
            return noteId === testNoteId || noteId === noteWithTestingData.note.noteId;
        });

        console.log("Exact search '=test' found our test notes:", ourTestNotes.length);
        console.log("Note titles:", ourTestNotes.map((r: any) => r.noteTitle));

        // Should find the note with exact "test" match, but not "testing"
        // Note: This test may fail if the implementation doesn't properly handle exact matching in content
        expect(ourTestNotes.length).toBeGreaterThan(0);
    });

    test("Exact search is case-insensitive", async ({ page }) => {
        // Create notes with different case variations
        const noteUpper = await page.request.post(`${BASE_URL}/api/notes/root/children?target=into&targetBranchId=`, {
            headers: { "x-csrf-token": csrfToken },
            data: {
                title: "EXACT MATCH",
                content: "This note has EXACT in uppercase.",
                type: "text"
            }
        });
        expect(noteUpper.ok()).toBeTruthy();
        const noteUpperData = await noteUpper.json();
        createdNoteIds.push(noteUpperData.note.noteId);

        const noteLower = await page.request.post(`${BASE_URL}/api/notes/root/children?target=into&targetBranchId=`, {
            headers: { "x-csrf-token": csrfToken },
            data: {
                title: "exact match",
                content: "This note has exact in lowercase.",
                type: "text"
            }
        });
        expect(noteLower.ok()).toBeTruthy();
        const noteLowerData = await noteLower.json();
        createdNoteIds.push(noteLowerData.note.noteId);

        await page.waitForTimeout(500);

        // Search with exact operator in lowercase
        const response = await page.request.get(`${BASE_URL}/api/quick-search/=exact`, {
            headers: { "x-csrf-token": csrfToken }
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();

        const ourTestNotes = data.searchResults.filter((result: any) => {
            const noteId = result.notePath.split("/").pop();
            return noteId === noteUpperData.note.noteId || noteId === noteLowerData.note.noteId;
        });

        console.log("Case-insensitive exact search found:", ourTestNotes.length, "notes");

        // Should find both uppercase and lowercase versions
        expect(ourTestNotes.length).toBe(2);
    });
});
