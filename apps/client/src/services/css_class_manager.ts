import {readCssVar} from "../utils/css-var";
import Color, { ColorInstance } from "color";

const registeredClasses = new Set<string>();

// Read the color lightness limits defined in the theme as CSS variables

const lightThemeColorMaxLightness = readCssVar(
                                        document.documentElement,
                                        "tree-item-light-theme-max-color-lightness"
                                    ).asNumber(70);

const darkThemeColorMinLightness = readCssVar(
                                        document.documentElement,
                                        "tree-item-dark-theme-min-color-lightness"
                                    ).asNumber(50);

function createClassForColor(colorString: string | null) {
    if (!colorString?.trim()) {
        return "";
    }

    const color = parseColor(colorString);
    if (!color) {
        return;
    }

    const className = `color-${color.hex().substring(1)}`;

    if (!registeredClasses.has(className)) {
        const adjustedColor = adjustColorLightness(color, lightThemeColorMaxLightness!,
                                                   darkThemeColorMinLightness!);

        $("head").append(`<style>
            .${className}, span.fancytree-active.${className} {
                --light-theme-custom-color: ${adjustedColor.lightThemeColor};
                --light-theme-custom-bg-color: ${adjustedColor.lightThemeBackgroundColor};
                --dark-theme-custom-color: ${adjustedColor.darkThemeColor};
                --dark-theme-custom-bg-color: ${adjustedColor.darkThemeBackgroundColor};
            }
        </style>`);

        registeredClasses.add(className);
    }

    return className;
}

function parseColor(color: string) {
    try {
        return Color(color);
    } catch (ex) {
        console.error(ex);
    }
}

/** 
 * Returns a pair of colors — one optimized for light themes and the other for dark themes, derived
 * from the specified color to maintain sufficient contrast with each theme.
 * The adjustment is performed by limiting the color’s lightness in the CIELAB color space,
 * according to the lightThemeMaxLightness and darkThemeMinLightness parameters.
 */
function adjustColorLightness(color: ColorInstance, lightThemeMaxLightness: number, darkThemeMinLightness: number) {
    const labColor = color.lab();
    const lightness = labColor.l();

    // For the light theme, limit the maximum lightness
    const lightThemeColor = labColor.l(Math.min(lightness, lightThemeMaxLightness)).hex();
    
    // For the dark theme, limit the minimum lightness
    const darkThemeColor = labColor.l(Math.max(lightness, darkThemeMinLightness)).hex();

    let darkThemeBackgroundColor = "unset";
    let lightThemeBackgroundColor = "unset";

    const hslColor = color.hsl();
    const hue = hslColor.hue();

    if (color.saturationl() > 0) {
        darkThemeBackgroundColor = Color({h: hue, s: 20, l: 33, alpha: .4}).hexa();
        lightThemeBackgroundColor = Color({h: hue, s: 37, l: 89, alpha: 1}).hexa();
    }

    return {lightThemeColor, lightThemeBackgroundColor, darkThemeColor, darkThemeBackgroundColor};
}

export default {
    createClassForColor
};