const themeToLoad = getThemeToLoad();
setTheme(themeToLoad);

export default function setupThemeSelector() {
    const themeSwitch: HTMLInputElement = document.querySelector(".theme-selection input")!;

    const themeSelection: HTMLDivElement = document.querySelector(".theme-selection")!;
    themeSelection.classList.add("no-transition");
    themeSwitch.checked = (themeToLoad === "dark");
    setTimeout(() => themeSelection.classList.remove("no-transition"), 400);

    themeSwitch?.addEventListener("change", () => {
        const theme = themeSwitch.checked ? "dark" : "light";
        setTheme(theme);
        localStorage.setItem("theme", theme);
    });
}

function setTheme(theme: string) {
    if (theme === "dark") {
        document.body.classList.add("theme-dark");
        document.body.classList.remove("theme-light");
    } else {
        document.body.classList.remove("theme-dark");
        document.body.classList.add("theme-light");
    }
}

function getThemeToLoad() {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
        // Respect user's choice if one has already been made.
        return storedTheme;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // Fallback to browser's color preference otherwise.
        return "dark";
    } else {
        return "light";
    }
}
