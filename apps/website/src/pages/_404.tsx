import Section from "../components/Section";
import "./_404.css";

export function NotFound() {
	return (
		<Section title="404: Not Found" className="section-404">
            The page you were looking for could not be found. Maybe it was deleted or the URL is incorrect.
		</Section>
	);
}
