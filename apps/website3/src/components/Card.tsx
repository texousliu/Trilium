import { ComponentChildren } from "preact";

interface CardProps {
    title: string;
    children: ComponentChildren;
}

export default function Card({ title, children }: CardProps) {
    return (
        <div className="card">
            <p>
                <span class="text-big">{title}</span><br />
                {children}
            </p>
        </div>
    )
}
