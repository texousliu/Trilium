import { default as dayjs, type Dayjs } from "dayjs";

//#region Plugins
import advancedFormat from "dayjs/plugin/advancedFormat.js";
import isBetween from "dayjs/plugin/isBetween.js";
import isoWeek from "dayjs/plugin/isoWeek.js";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import quarterOfYear from "dayjs/plugin/quarterOfYear.js";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(advancedFormat);
dayjs.extend(isBetween);
dayjs.extend(isoWeek);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(quarterOfYear);
dayjs.extend(utc);
//#endregion

export {
    dayjs,
    Dayjs
};
