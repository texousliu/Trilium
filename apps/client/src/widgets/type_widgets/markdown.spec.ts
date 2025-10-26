import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MarkdownTypeWidget from "./markdown.js";

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

    it("should handle empty content", () => {
        const data = widget.getData();
        expect(data).toEqual({ content: "" });
    });
});
