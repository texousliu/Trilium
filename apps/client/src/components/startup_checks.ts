import server from "../services/server";
import Component from "./component";

// TODO: Deduplicate.
interface CpuArchResponse {
    isCpuArchMismatch: boolean;
}

export class StartupChecks extends Component {

    constructor() {
        super();
        this.checkRosetta2Warning();
    }

    async checkRosetta2Warning() {
        try {
            // Check if running under Rosetta 2 by calling the server
            const response = await server.get("system-checks") as CpuArchResponse;
            if (response.isCpuArchMismatch) {
                // Trigger the Rosetta 2 warning dialog
                this.triggerCommand("showCpuArchWarning", {});
            }
        } catch (error) {
            console.warn("Could not check Rosetta 2 status:", error);
        }
    }
}
