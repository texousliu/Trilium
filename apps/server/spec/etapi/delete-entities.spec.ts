import { Application } from "express";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import supertest from "supertest";
import { login } from "./utils.js";
import config from "../../src/services/config.js";
import { randomInt } from "crypto";

let app: Application;
let token: string;
let createdNoteId: string;
let createdBranchId: string;

const USER = "etapi";

type EntityType = "attachments" | "attributes" | "branches" | "notes";

describe("etapi/delete-entities", () => {
    beforeAll(async () => {
        config.General.noAuthentication = false;
        const buildApp = (await (import("../../src/app.js"))).default;
        app = await buildApp();
        token = await login(app);
    });

    beforeEach(async () => {
        ({ createdNoteId, createdBranchId } = await createNote());
    });

    it("deletes attachment", async () => {
        const attachmentId = await createAttachment();
        deleteEntity("attachments", attachmentId);
        expectNotFound("attachments", attachmentId);
    });

    it("deletes attribute", async () => {
        const attributeId = await createAttribute();
        deleteEntity("attributes", attributeId);
        expectNotFound("attributes", attributeId);
    });

    it("deletes cloned branch", async () => {
        const response = await supertest(app)
            .post("/etapi/branches")
            .auth(USER, token, { "type": "basic"})
            .send({
                noteId: createdNoteId,
                parentNoteId: "_hidden"
            });
        const clonedBranchId = response.body.branchId;
        expectFound("branches", createdBranchId);
        expectFound("branches", clonedBranchId);

        deleteEntity("branches", createdBranchId);
        expectNotFound("branches", createdBranchId);

        expectFound("branches", clonedBranchId);
        expectFound("notes", createdNoteId);
    });

    it("deletes note with all branches", async () => {
        const attributeId = await createAttribute();

        const response = await supertest(app)
            .post("/etapi/branches")
            .auth(USER, token, { "type": "basic"})
            .send({
                noteId: createdNoteId,
                parentNoteId: "_hidden"
            });
        const clonedBranchId = response.body.branchId;

        expectFound("notes", createdNoteId);
        expectFound("branches", createdBranchId);
        expectFound("branches", clonedBranchId);
        expectFound("attributes", attributeId);
        deleteEntity("notes", createdNoteId);

        expectNotFound("branches", createdBranchId);
        expectNotFound("branches", clonedBranchId);
        expectNotFound("notes", createdNoteId);
        expectNotFound("attributes", attributeId);
    });
});

async function createNote() {
    const noteId = `forcedId${randomInt(1000)}`;
    const response = await supertest(app)
        .post("/etapi/create-note")
        .auth(USER, token, { "type": "basic"})
        .send({
            "noteId": noteId,
            "parentNoteId": "root",
            "title": "Hello",
            "type": "text",
            "content": "Hi there!",
            "dateCreated": "2023-08-21 23:38:51.123+0200",
            "utcDateCreated": "2023-08-21 23:38:51.123Z"
        })
        .expect(201);
    expect(response.body.note.noteId).toStrictEqual(noteId);

    return {
        createdNoteId: response.body.note.noteId,
        createdBranchId: response.body.branch.branchId
    };
}

async function createClone() {
    const response = await supertest(app)
        .post("/etapi/branches")
        .auth(USER, token, { "type": "basic"})
        .send({
            noteId: createdNoteId,
            parentNoteId: "_hidden"
        })
        .expect(201);
    expect(response.body.parentNoteId).toStrictEqual("_hidden");
    return response.body.branchId;
}

async function createAttribute() {
    const attributeId = `forcedId${randomInt(1000)}`;
    const response = await supertest(app)
        .post("/etapi/attributes")
        .auth(USER, token, { "type": "basic"})
        .send({
            "attributeId": attributeId,
            "noteId": createdNoteId,
            "type": "label",
            "name": "mylabel",
            "value": "val",
            "isInheritable": true
        })
        .expect(201);
    expect(response.body.attributeId).toStrictEqual(attributeId);
    return response.body.attributeId;
}

async function createAttachment() {
    const response = await supertest(app)
        .post("/etapi/attachments")
        .auth(USER, token, { "type": "basic"})
        .send({
            "ownerId": createdNoteId,
            "role": "file",
            "mime": "plain/text",
            "title": "my attachment",
            "content": "my text"
        })
        .expect(201);
    return response.body.attachmentId;
}

async function deleteEntity(entity: EntityType, id: string) {
    // Delete twice to test idempotency.
    for (let i=0; i < 2; i++) {
        await supertest(app)
            .delete(`/etapi/${entity}/${id}`)
            .auth(USER, token, { "type": "basic"})
            .expect(204);
    }
}

async function expectNotFound(entity: EntityType, id: string) {
    const response = await supertest(app)
            .get(`/etapi/${entity}/${id}`)
            .auth(USER, token, { "type": "basic"})
            .expect(404);
    expect(response.body.code).toStrictEqual("ATTACHMENT_NOT_FOUND");
}

async function expectFound(entity: EntityType, id: string) {
    await supertest(app)
            .get(`/etapi/${entity}/${id}`)
            .auth(USER, token, { "type": "basic"})
            .expect(200);
}
