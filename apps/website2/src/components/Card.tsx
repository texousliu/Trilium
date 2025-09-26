import { ComponentChildren } from "preact";

interface CardProps {
    title: string;
    imageUrl?: string;
    children: ComponentChildren;
}

export default function Card({ title, children, imageUrl }: CardProps) {
    return (
        <div className="card">
            {imageUrl && <img class="image" src={imageUrl} />}
            <p>
                <span class="text-big">{title}</span><br />
                {children}
            </p>
        </div>
    )
}
