import link from "../../../services/link";

export function applyReferenceLinks(container: HTMLDivElement | HTMLElement) {
    const referenceLinks = container.querySelectorAll<HTMLDivElement>("a.reference-link");
    for (const referenceLink of referenceLinks) {
        try {
            link.loadReferenceLinkTitle($(referenceLink));
        } catch (e) {
            continue;
        }
    }
}
