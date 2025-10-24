import "katex/dist/katex.min.css";

export default async function setupMath() {
    const anyMathBlock = document.querySelector("#content .math-tex");
    if (!anyMathBlock) {
        return;
    }

    const renderMathInElement = (await import("katex/contrib/auto-render")).default;
    await import("katex/contrib/mhchem");

    renderMathInElement(document.getElementById("content"));
    document.body.classList.add("math-loaded");
}
