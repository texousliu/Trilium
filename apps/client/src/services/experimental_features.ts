import options from "./options";

interface ExperimentalFeature {
    id: string;
    name: string;
    description: string;
}

export const experimentalFeatures: ExperimentalFeature[] = [
    {
        id: "new-layout",
        name: "New Layout",
        description: "Try out the new layout for a more modern look and improved usability.",
    }
];

type ExperimentalFeatureId = typeof experimentalFeatures[number]["id"];

let enabledFeatures: Set<ExperimentalFeatureId> | null = null;

export function isExperimentalFeatureEnabled(featureId: ExperimentalFeatureId): boolean {
    if (!enabledFeatures) {
        const features = JSON.parse(options.get("experimentalFeatures")) as string[];
        enabledFeatures = new Set(features);
    }

    return enabledFeatures.has(featureId);
}
