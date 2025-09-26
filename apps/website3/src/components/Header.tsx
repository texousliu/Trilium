import "./Header.css";
import { useLocation } from 'preact-iso';
import DownloadButton from './DownloadButton';

export function Header() {
	const { url } = useLocation();

	return (
		<header>
            <div class="content-wrapper">
                <img src="./src/assets/icon-color.svg" width="300" height="300" />&nbsp;<span>Trilium Notes</span>

                <nav>
                    <a href="/" class={url == '/' && 'active'}>
                        Home
                    </a>
                    <a href="/404" class={url == '/404' && 'active'}>
                        404
                    </a>
                </nav>

                <DownloadButton />
            </div>
		</header>
	);
}
