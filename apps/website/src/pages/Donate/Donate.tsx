import Section from "../../components/Section";
import "./Donate.css";

export default function Donate() {
    return (
        <>
            <Section title="Financial donations" className="donate">
                <p>A <a href="https://github.com/TriliumNext/Trilium/graphs/commit-activity">significant amount of time</a> is spent maintaining and bringing the best out of Trilium.</p>

                <p>Consider supporting the main developer of the application via:</p>

                <ul>
                    <li><a href="https://github.com/sponsors/eliandoran" target="_blank">GitHub Sponsors</a></li>
                    <li><a href="https://paypal.me/eliandoran" target="_blank">PayPal</a></li>
                    <li><a href="https://buymeacoffee.com/eliandoran" target="_blank">Buy Me A Coffee</a></li>
                </ul>
            </Section>

            <Section title="Other ways to contribute">
                <ul>
                    <li>Help us translate the application into your native language via <a href="https://hosted.weblate.org/engage/trilium/" target="_blank">Weblate</a>.</li>
                </ul>
            </Section>
        </>
    )
}
