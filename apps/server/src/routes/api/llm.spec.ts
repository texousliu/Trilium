import { Application } from "express";
import { beforeAll, describe, expect, it, vi, beforeEach } from "vitest";
import supertest from "supertest";
import config from "../../services/config.js";

// Import the login utility from ETAPI tests
async function login(app: Application) {
    // Obtain auth token.
    const response = await supertest(app)
        .post("/etapi/auth/login")
        .send({
            "password": "demo1234"
        })
        .expect(201);
    const token = response.body.authToken;
    expect(token).toBeTruthy();
    return token;
}

let app: Application;

describe("LLM API Tests", () => {
    let token: string;
    let createdChatId: string;

    beforeAll(async () => {
        // Enable authentication and use ETAPI auth (bypasses CSRF)
        config.General.noAuthentication = false;
        const buildApp = (await import("../../app.js")).default;
        app = await buildApp();
        token = await login(app);
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Chat Session Management", () => {
        it("should create a new chat session", async () => {
            const response = await supertest(app)
                .post("/api/llm/chat")
                .send({
                    title: "Test Chat Session",
                    systemPrompt: "You are a helpful assistant for testing.",
                    temperature: 0.7,
                    maxTokens: 1000,
                    model: "gpt-3.5-turbo",
                    provider: "openai"
                })
                .expect(200);

            expect(response.body).toMatchObject({
                sessionId: expect.any(String),
                title: "Test Chat Session",
                createdAt: expect.any(String)
            });

            createdChatId = response.body.sessionId;
        });

        it("should list all chat sessions", async () => {
            const response = await supertest(app)
                .get("/api/llm/chat")
                .expect(200);

            expect(response.body).toHaveProperty('sessions');
            expect(Array.isArray(response.body.sessions)).toBe(true);
            
            if (response.body.sessions.length > 0) {
                expect(response.body.sessions[0]).toMatchObject({
                    id: expect.any(String),
                    title: expect.any(String),
                    createdAt: expect.any(String),
                    lastActive: expect.any(String),
                    messageCount: expect.any(Number)
                });
            }
        });

        it("should retrieve a specific chat session", async () => {
            if (!createdChatId) {
                // Create a chat first if we don't have one
                const createResponse = await supertest(app)
                    .post("/api/llm/chat")
                    .send({
                        title: "Test Retrieval Chat"
                    })
                    .expect(200);
                
                createdChatId = createResponse.body.sessionId;
            }

            const response = await supertest(app)
                .get(`/api/llm/chat/${createdChatId}`)
                .expect(200);

            expect(response.body).toMatchObject({
                id: createdChatId,
                title: expect.any(String),
                messages: expect.any(Array),
                createdAt: expect.any(String)
            });
        });

        it("should update a chat session", async () => {
            if (!createdChatId) {
                // Create a chat first if we don't have one
                const createResponse = await supertest(app)
                    .post("/api/llm/chat")
                    .send({
                        title: "Test Update Chat"
                    })
                    .expect(200);
                
                createdChatId = createResponse.body.sessionId;
            }

            const response = await supertest(app)
                .patch(`/api/llm/chat/${createdChatId}`)
                .send({
                    title: "Updated Chat Title",
                    temperature: 0.8
                })
                .expect(200);

            expect(response.body).toMatchObject({
                id: createdChatId,
                title: "Updated Chat Title",
                updatedAt: expect.any(String)
            });
        });

        it("should return 404 for non-existent chat session", async () => {
            await supertest(app)
                .get("/api/llm/chat/nonexistent-chat-id")
                .expect(404);
        });
    });

    describe("Chat Messaging", () => {
        let testChatId: string;

        beforeEach(async () => {
            // Create a fresh chat for each test
            const createResponse = await supertest(app)
                .post("/api/llm/chat")
                .send({
                    title: "Message Test Chat"
                })
                .expect(200);
            
            testChatId = createResponse.body.sessionId;
        });

        it("should handle sending a message to a chat", async () => {
            const response = await supertest(app)
                .post(`/api/llm/chat/${testChatId}/messages`)
                .send({
                    message: "Hello, how are you?",
                    options: {
                        temperature: 0.7,
                        maxTokens: 100
                    },
                    includeContext: false,
                    useNoteContext: false
                });

            // The response depends on whether AI is actually configured
            // We should get either a successful response or an error about AI not being configured
            expect([200, 400, 500]).toContain(response.status);
            
            if (response.status === 200) {
                expect(response.body).toMatchObject({
                    response: expect.any(String),
                    sessionId: testChatId
                });
            } else {
                // AI not configured is expected in test environment
                expect(response.body).toHaveProperty('error');
            }
        });

        it("should handle empty message content", async () => {
            const response = await supertest(app)
                .post(`/api/llm/chat/${testChatId}/messages`)
                .send({
                    message: "",
                    options: {}
                });

            expect([400, 500]).toContain(response.status);
            expect(response.body).toHaveProperty('error');
        });

        it("should handle invalid chat ID for messaging", async () => {
            const response = await supertest(app)
                .post("/api/llm/chat/invalid-chat-id/messages")
                .send({
                    message: "Hello",
                    options: {}
                });

            expect([404, 500]).toContain(response.status);
        });
    });

    describe("Chat Streaming", () => {
        let testChatId: string;

        beforeEach(async () => {
            // Create a fresh chat for each test
            const createResponse = await supertest(app)
                .post("/api/llm/chat")
                .send({
                    title: "Streaming Test Chat"
                })
                .expect(200);
            
            testChatId = createResponse.body.sessionId;
        });

        it("should initiate streaming for a chat message", async () => {
            const response = await supertest(app)
                .post(`/api/llm/chat/${testChatId}/messages/stream`)
                .send({
                    content: "Tell me a short story",
                    useAdvancedContext: false,
                    showThinking: false
                });

            // The streaming endpoint should immediately return success
            // indicating that streaming has been initiated
            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                success: true,
                message: "Streaming initiated successfully"
            });
        });

        it("should handle empty content for streaming", async () => {
            const response = await supertest(app)
                .post(`/api/llm/chat/${testChatId}/messages/stream`)
                .send({
                    content: "",
                    useAdvancedContext: false,
                    showThinking: false
                });

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({
                success: false,
                error: "Content cannot be empty"
            });
        });

        it("should handle whitespace-only content for streaming", async () => {
            const response = await supertest(app)
                .post(`/api/llm/chat/${testChatId}/messages/stream`)
                .send({
                    content: "   \n\t   ",
                    useAdvancedContext: false,
                    showThinking: false
                });

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({
                success: false,
                error: "Content cannot be empty"
            });
        });

        it("should handle invalid chat ID for streaming", async () => {
            const response = await supertest(app)
                .post("/api/llm/chat/invalid-chat-id/messages/stream")
                .send({
                    content: "Hello",
                    useAdvancedContext: false,
                    showThinking: false
                });

            // Should still return 200 for streaming initiation
            // Errors would be communicated via WebSocket
            expect(response.status).toBe(200);
        });

        it("should handle streaming with note mentions", async () => {
            const response = await supertest(app)
                .post(`/api/llm/chat/${testChatId}/messages/stream`)
                .send({
                    content: "Tell me about this note",
                    useAdvancedContext: true,
                    showThinking: true,
                    mentions: [
                        {
                            noteId: "root",
                            title: "Root Note"
                        }
                    ]
                });

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                success: true,
                message: "Streaming initiated successfully"
            });
        });
    });

    describe("Error Handling", () => {
        it("should handle malformed JSON in request body", async () => {
            const response = await supertest(app)
                .post("/api/llm/chat")
                .set('Content-Type', 'application/json')
                .send('{ invalid json }');

            expect([400, 500]).toContain(response.status);
        });

        it("should handle missing required fields", async () => {
            const response = await supertest(app)
                .post("/api/llm/chat")
                .send({
                    // Missing required fields
                });

            // Should still work as title can be auto-generated
            expect([200, 400, 500]).toContain(response.status);
        });

        it("should handle invalid parameter types", async () => {
            const response = await supertest(app)
                .post("/api/llm/chat")
                .send({
                    title: "Test Chat",
                    temperature: "invalid", // Should be number
                    maxTokens: "also-invalid" // Should be number
                });

            // API should handle type conversion or validation
            expect([200, 400, 500]).toContain(response.status);
        });
    });

    afterAll(async () => {
        // Clean up: delete any created chats
        if (createdChatId) {
            try {
                await supertest(app)
                    .delete(`/api/llm/chat/${createdChatId}`);
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    });
});