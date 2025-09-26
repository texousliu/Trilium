import { ComponentChildren } from "preact";

interface CardProps {
    title: string;
    imageUrl?: string;
    className?: string;
    children: ComponentChildren;
}

export default function Card({ title, children, imageUrl, className }: CardProps) {
    return (
        <div className={`card ${className}`}>
            {imageUrl && <img class="image" src={imageUrl} />}

            <div className="card-content">
                <h3>{title}</h3>
                {children}
            </div>
        </div>
    )
}
