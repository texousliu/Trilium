const themeRootEl = document.documentElement;

export default function setupThemeSelector() {
    const themeSwitch: HTMLInputElement = document.querySelector(".theme-selection input")!;

    const themeSelection: HTMLDivElement = document.querySelector(".theme-selection")!;
    themeSelection.classList.add("no-transition");
    themeSwitch.checked = (themeRootEl.classList.contains("theme-dark"));
    setTimeout(() => themeSelection.classList.remove("no-transition"), 400);

    themeSwitch?.addEventListener("change", () => {
        const theme = themeSwitch.checked ? "dark" : "light";
        setTheme(theme);
        localStorage.setItem("theme", theme);
    });
}

function setTheme(theme: string) {
    if (theme === "dark") {
        themeRootEl.classList.add("theme-dark");
        themeRootEl.classList.remove("theme-light");
    } else {
        themeRootEl.classList.remove("theme-dark");
        themeRootEl.classList.add("theme-light");
    }
}
