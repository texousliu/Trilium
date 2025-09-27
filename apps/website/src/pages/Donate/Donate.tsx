import Section from "../../components/Section";
import "./Donate.css";
import githubIcon from "../../assets/boxicons/bx-github.svg?raw";
import paypalIcon from "../../assets/boxicons/bx-paypal.svg?raw";
import buyMeACoffeeIcon from "../../assets/boxicons/bx-buy-me-a-coffee.svg?raw";
import Button from "../../components/Button";

export default function Donate() {
    return (
        <>
            <Section title="Financial donations" className="donate">
                <p>A <a href="https://github.com/TriliumNext/Trilium/graphs/commit-activity">significant amount of time</a> is spent maintaining and bringing the best out of Trilium.</p>

                <p>Consider supporting the main developer of the application via:</p>

                <ul>
                    <li>
                        <Button
                            iconSvg={githubIcon}
                            href="https://github.com/sponsors/eliandoran"
                            text="GitHub Sponsors"
                            openExternally
                        />
                    </li>

                    <li>
                        <Button
                            iconSvg={paypalIcon}
                            href="https://paypal.me/eliandoran"
                            text="PayPal"
                            openExternally
                        />
                    </li>

                    <li>
                        <Button
                            iconSvg={buyMeACoffeeIcon}
                            href="https://buymeacoffee.com/eliandoran"
                            text="Buy Me A Coffee"
                            openExternally
                        />
                    </li>
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
