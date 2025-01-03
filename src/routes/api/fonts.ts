import { Request, Response } from 'express';
import optionService from "../../services/options.js";
import { OptionMap } from '../../services/options_interface.js';

function getFontCss(req: Request, res: Response) {
    res.setHeader('Content-Type', 'text/css');

    if (!optionService.getOptionBool('overrideThemeFonts')) {
        res.send('');

        return;
    }

    const optionsMap = optionService.getOptionMap();

    // using body to be more specific than themes' :root
    let style = 'body {';
    style += getFontFamily(optionsMap);
    style += getFontSize(optionsMap);
    style += '}';

    res.send(style);
}

function getFontFamily(optionsMap: OptionMap) {
    let style = "";

    if (optionsMap.mainFontFamily !== 'theme') {
        style += `--main-font-family: ${optionsMap.mainFontFamily};`;
    }

    if (optionsMap.treeFontFamily !== 'theme') {
        style += `--tree-font-family: ${optionsMap.treeFontFamily};`;
    }

    if (optionsMap.detailFontFamily !== 'theme') {
        style += `--detail-font-family: ${optionsMap.detailFontFamily};`;
    }

    if (optionsMap.monospaceFontFamily !== 'theme') {
        style += `--monospace-font-family: ${optionsMap.monospaceFontFamily};`;
    }

    return style;
}

function getFontSize(optionsMap: OptionMap) {
    let style = "";
    style += `--main-font-size: ${optionsMap.mainFontSize}%;`;
    style += `--tree-font-size: ${optionsMap.treeFontSize}%;`;
    style += `--detail-font-size: ${optionsMap.detailFontSize}%;`;
    style += `--monospace-font-size: ${optionsMap.monospaceFontSize}%;`;

    return style;
}

export default {
    getFontCss
};
