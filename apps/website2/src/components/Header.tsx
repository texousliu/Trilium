import "./Header.css";
import { useLocation } from 'preact-iso';
import DownloadButton from './DownloadButton';

export function Header() {
	const { url } = useLocation();

	return (
		<header>
            <div class="content-wrapper">
                <a class="banner" href="/">
                    <img src="./src/assets/icon-color.svg" width="300" height="300" />&nbsp;<span>Trilium Notes</span>
                </a>

                <nav>
                    <a href="/404" class={url == '/404' && 'active'}>
                        404
                    </a>
                </nav>

                <DownloadButton />
            </div>
		</header>
	);
}
