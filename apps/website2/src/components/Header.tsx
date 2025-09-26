import "./Header.css";
import { useLocation } from 'preact-iso';
import DownloadButton from './DownloadButton';

interface HeaderLink {
    url: string;
    text: string;
    external?: boolean;
}

const HEADER_LINKS: HeaderLink[] = [
    { url: "https://docs.triliumnotes.org/", text: "Documentation", external: true }
]

export function Header() {
	const { url } = useLocation();

	return (
		<header>
            <div class="content-wrapper">
                <a class="banner" href="/">
                    <img src="./src/assets/icon-color.svg" width="300" height="300" />&nbsp;<span>Trilium Notes</span>
                </a>

                <nav>
                    {HEADER_LINKS.map(link => (
                        <a
                            href={link.url}
                            className={url === link.url && 'active'}
                            target={link.external && "_blank"}
                        >{link.text}</a>
                    ))}
                </nav>

                <DownloadButton />
            </div>
		</header>
	);
}
