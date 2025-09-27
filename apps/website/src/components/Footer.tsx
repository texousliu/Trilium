import "./Footer.css";
import Icon from "./Icon";
import githubIcon from "../assets/boxicons/bx-github.svg?raw";
import githubDiscussionsIcon from "../assets/boxicons/bx-discussion.svg?raw";
import matrixIcon from "../assets/boxicons/bx-message-dots.svg?raw";
import redditIcon from "../assets/boxicons/bx-reddit.svg?raw";

export default function Footer() {
    return (
        <footer>
            <div class="content-wrapper">
                <div class="footer-text">
                    © 2024-2025 <a href="https://github.com/eliandoran">Elian Doran</a> and the <a href="https://github.com/TriliumNext/Notes/graphs/contributors">team</a>.<br />
                    © 2017-2024 <a href="https://github.com/zadam">zadam</a>.
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
        <a className="social-button" href={url} target="_blank" title={name}>
            <Icon svg={iconSvg} />
        </a>
    )
}
