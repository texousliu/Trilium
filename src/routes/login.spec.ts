import { beforeAll, describe, it } from "vitest";
import supertest from "supertest";
import { initializeTranslations } from "../services/i18n.js";
import type { Application, Request, Response, NextFunction } from "express";

let app: Application;

describe("Login Route test", () => {

    beforeAll(async () => {
        initializeTranslations();
        app = (await import("../app.js")).default;
    });

    it("return a 401 status, when login fails with wrong password", async () => {

        await supertest(app)
            .post("/login")
            .send({ password: "fakePassword" })
            .expect(401)

    });

    // TriliumNextTODO: how to handle different configs here? e.g. TOTP, or different cookieMaxAge from config.ini

    /*

    it("sets correct Expires, when 'Remember Me' is ticked", async () => {
        await supertest(app)
            .post("/login")
            .expect(302)
            .expect("Set-Cookie", "trilium.sid=trilium.sid; Path=/; Expires=TODO");
    });

    */
});