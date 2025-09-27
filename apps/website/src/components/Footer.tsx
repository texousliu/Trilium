import "./Footer.css";
import Icon from "./Icon";
import githubIcon from "../assets/boxicons/bx-github.svg?raw";
import githubDiscussionsIcon from "../assets/boxicons/bx-discussion.svg?raw";
import matrixIcon from "../assets/boxicons/bx-message-dots.svg?raw";
import redditIcon from "../assets/boxicons/bx-reddit.svg?raw";
import { Link } from "./Button";

export default function Footer() {
    return (
        <footer>
            <div class="content-wrapper">
                <div class="footer-text">
                    © 2024-2025 <Link href="https://github.com/eliandoran" openExternally>Elian Doran</Link> and the <Link href="https://github.com/TriliumNext/Notes/graphs/contributors" openExternally>team</Link>.<br />
                    © 2017-2024 <Link href="https://github.com/zadam" openExternally>zadam</Link>.
                </div>

                <div className="social-buttons">
                    <SocialButton
                        name="GitHub"
                        iconSvg={githubIcon}
                        url="https://github.com/TriliumNext/Trilium"
                    />

                    <SocialButton
                        name="GitHub Discussions"
                        iconSvg={githubDiscussionsIcon}
                        url="https://github.com/orgs/TriliumNext/discussions"
                    />

                    <SocialButton
                        name="Matrix"
                        iconSvg={matrixIcon}
                        url="https://matrix.to/#/#triliumnext:matrix.org"
                    />

                    <SocialButton
                        name="Reddit"
                        iconSvg={redditIcon}
                        url="https://www.reddit.com/r/Trilium/"
                    />
                </div>
            </div>
        </footer>
    )
}

function SocialButton({ name, iconSvg, url }: { name: string, iconSvg: string, url: string }) {
    return (
        <Link className="social-button" href={url} openExternally title={name}>
            <Icon svg={iconSvg} />
        </Link>
    )
}
