import { isRunningUnderRosetta2 } from "../../services/utils.js";
import type { Request, Response } from "express";

function rosettaCheck(req: Request, res: Response) {
    return {
        isRunningUnderRosetta2: isRunningUnderRosetta2()
    }
}

export default {
    rosettaCheck
};
