const themeToLoad = getThemeToLoad();
if (themeToLoad === "dark") {
    document.body.classList.add("theme-dark");
    document.body.classList.remove("theme-light");
} else {
    document.body.classList.remove("theme-dark");
    document.body.classList.add("theme-light");
}

export default function setupThemeSelector() {
    const themeSwitch: HTMLInputElement = document.querySelector(".theme-selection input")!;

    const themeSelection: HTMLDivElement = document.querySelector(".theme-selection")!;
    themeSelection.classList.add("no-transition");
    themeSwitch.checked = (themeToLoad === "dark");
    setTimeout(() => themeSelection.classList.remove("no-transition"), 400);

    themeSwitch?.addEventListener("change", () => {
        if (themeSwitch.checked) {
            document.body.classList.add("theme-dark");
            document.body.classList.remove("theme-light");
            localStorage.setItem("theme", "dark");
        } else {
            document.body.classList.remove("theme-dark");
            document.body.classList.add("theme-light");
            localStorage.setItem("theme", "light");
        }
    });
}

function getThemeToLoad() {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
        // Respect user's choice if one has already been made.
        return storedTheme;
    } else if (window.matchMedia) {
        // Fallback to browser's color preference otherwise.
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
}
