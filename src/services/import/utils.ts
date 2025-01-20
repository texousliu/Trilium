"use strict";

function handleH1(content: string, title: string) {
    let isFirstH1Handled = false;

    content = content.replace(/<h1[^>]*>([^<]*)<\/h1>/gi, (match, text) => {
        if (title.trim() === text.trim() && !isFirstH1Handled) {
            isFirstH1Handled = true;
            return ""; // remove whole H1 tag
        } else {
            isFirstH1Handled = true;
            return `<h2>${text}</h2>`;
        }
    });
    return content;
}

function extractHtmlTitle(content: string): string | null {
    const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : null;
}

export default {
    handleH1,
    extractHtmlTitle
};
