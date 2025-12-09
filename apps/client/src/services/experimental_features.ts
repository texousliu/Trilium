interface ExperimentalFeature {
    id: string;
    name: string;
    description: string;
}

export const experimentalFeatures: ExperimentalFeature[] = [
    {
        id: "newLayout",
        name: "New Layout",
        description: "Try out the new layout for a more modern look and improved usability.",
    }
];
