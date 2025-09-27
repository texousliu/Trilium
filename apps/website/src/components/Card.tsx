import { ComponentChildren } from "preact";
import Button from "./Button";

interface CardProps {
    title: string;
    imageUrl?: string;
    className?: string;
    moreInfoUrl?: string;
    children: ComponentChildren;
}

export default function Card({ title, children, imageUrl, className, moreInfoUrl }: CardProps) {
    return (
        <div className={`card ${className}`}>
            {imageUrl && <img class="image" src={imageUrl} />}

            <div className="card-content">
                <h3>{title}</h3>

                <div className="card-content-inner">
                    {children}
                </div>

                {moreInfoUrl && (
                    <div className="more-info-container">
                        <Button href={moreInfoUrl} className="more-info" text="More info" outline openExternally />
                    </div>
                )}
            </div>
        </div>
    )
}
