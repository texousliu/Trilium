import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import MarkdownTypeWidget from "./markdown.js";

// Mock vditor
vi.mock("vditor", () => ({
    default: vi.fn().mockImplementation(() => ({
        setValue: vi.fn(),
        getValue: vi.fn(() => ""),
        focus: vi.fn(),
        destroy: vi.fn(),
        disabled: vi.fn(),
        enable: vi.fn()
    }))
}));

vi.mock("vditor/dist/index.css", () => ({}));

describe("MarkdownTypeWidget", () => {
    let widget: MarkdownTypeWidget;

    beforeEach(() => {
        // 创建DOM容器
        document.body.innerHTML = '<div id="test-container"></div>';
        widget = new MarkdownTypeWidget();
    });

    afterEach(() => {
        if (widget) {
            widget.cleanup();
        }
        document.body.innerHTML = '';
    });

    it("should have correct type", () => {
        expect(MarkdownTypeWidget.getType()).toBe("markdown");
    });

    it("should render widget", () => {
        const $widget = widget.doRender();
        expect($widget).toBeDefined();
        expect($widget.hasClass("note-detail-markdown")).toBe(true);
    });

    it("should handle empty content when no vditor", () => {
        const data = widget.getData();
        expect(data).toBeUndefined();
    });

    it("should detect dark theme correctly", () => {
        // Test various dark theme class combinations
        document.body.className = "theme-dark";
        expect((widget as any).isDarkTheme()).toBe(true);

        document.body.className = "dark";
        expect((widget as any).isDarkTheme()).toBe(true);

        document.body.className = "theme-next-dark";
        expect((widget as any).isDarkTheme()).toBe(true);

        document.body.setAttribute("data-theme", "dark");
        expect((widget as any).isDarkTheme()).toBe(true);

        document.body.className = "theme-light";
        document.body.removeAttribute("data-theme");
        expect((widget as any).isDarkTheme()).toBe(false);
    });
});
