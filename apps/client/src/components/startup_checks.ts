import server from "../services/server";
import Component from "./component";

export class StartupChecks extends Component {

    constructor() {
        super();
        this.checkRosetta2Warning();
    }

    async checkRosetta2Warning() {
        try {
            // Check if running under Rosetta 2 by calling the server
            const response = await server.get("system-info/rosetta-check") as { isRunningUnderRosetta2: boolean };
            if (response.isRunningUnderRosetta2) {
                // Trigger the Rosetta 2 warning dialog
                this.triggerCommand("showRosettaWarning", {});
            }
        } catch (error) {
            console.warn("Could not check Rosetta 2 status:", error);
        }
    }
}
