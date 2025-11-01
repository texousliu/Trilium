import { join } from "path";
import BuildContext from "./context";
import buildSwagger from "./swagger";

const context: BuildContext = {
    baseDir: join(__dirname, "../../../site")
};

buildSwagger(context);
