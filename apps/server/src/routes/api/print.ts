import { Request, Response } from "express";
import assetPath from "../../services/asset_path";
import app_path from "../../services/app_path";
import { getCurrentLocale } from "../../services/i18n";

export function getPrintablePage(req: Request, res: Response) {
    const { noteId } = req.params;

    res.render("print", {
        assetPath: assetPath,
        appPath: app_path,
        currentLocale: getCurrentLocale()
    });
}
