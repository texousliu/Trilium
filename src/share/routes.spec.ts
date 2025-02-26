import { beforeAll, describe, it } from "vitest";
import supertest from "supertest";
import type { App } from "supertest/types.js";
import { initializeTranslations } from "../services/i18n.js";

let app: App;

describe("Share API test", () => {
    beforeAll(async () => {
        initializeTranslations();
        app = (await import("../app.js")).default;
    });

    it("requests password for password-protected share", async () => {
        await supertest(app)
            .get("/share/YjlPRj2E9fOV")
            .expect("WWW-Authenticate", 'Basic realm="User Visible Realm", charset="UTF-8"');
    });

});
