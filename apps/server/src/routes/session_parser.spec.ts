import { beforeAll, describe, expect, it } from "vitest";
import supertest from "supertest";
import type { Application } from "express";
import dayjs from "dayjs";
let app: Application;

describe("Session parser", () => {

    beforeAll(async () => {
        const buildApp = (await import("../app.js")).default;
        app = await buildApp();
    });

});
