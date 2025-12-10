import { t } from "./i18n";
import options from "./options";

interface ExperimentalFeature {
    id: string;
    name: string;
    description: string;
}

export const experimentalFeatures = [
    {
        id: "new-layout",
        name: t("experimental_features.new_layout_name"),
        description: t("experimental_features.new_layout_description"),
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

export async function toggleExperimentalFeature(featureId: ExperimentalFeatureId, enable: boolean) {
    const features = new Set(getEnabledFeatures());
    if (enable) {
        features.add(featureId);
    } else {
        features.delete(featureId);
    }
    await options.save("experimentalFeatures", JSON.stringify(Array.from(features)));
}

function getEnabledFeatures() {
    if (!enabledFeatures) {
        let features: ExperimentalFeatureId[] = [];
        try {
            features = JSON.parse(options.get("experimentalFeatures")) as ExperimentalFeatureId[];
        } catch (e) {
            console.warn("Failed to parse experimental features from options:", e);
        }
        enabledFeatures = new Set(features);
    }
    return enabledFeatures;
}
