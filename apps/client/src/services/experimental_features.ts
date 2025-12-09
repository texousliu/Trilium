import options from "./options";

interface ExperimentalFeature {
    id: string;
    name: string;
    description: string;
}

export const experimentalFeatures = [
    {
        id: "new-layout",
        name: "New Layout",
        description: "Try out the new layout for a more modern look and improved usability.",
    }
] as const satisfies ExperimentalFeature[];

type ExperimentalFeatureId = typeof experimentalFeatures[number]["id"];

let enabledFeatures: Set<ExperimentalFeatureId> | null = null;

export function isExperimentalFeatureEnabled(featureId: ExperimentalFeatureId): boolean {
    return getEnabledFeatures().has(featureId);
}

export function getEnabledExperimentalFeatureIds() {
    return getEnabledFeatures().values();
}

function getEnabledFeatures() {
    if (!enabledFeatures) {
        const features = JSON.parse(options.get("experimentalFeatures")) as ExperimentalFeatureId[];
        enabledFeatures = new Set(features);
    }
    return enabledFeatures;
}
