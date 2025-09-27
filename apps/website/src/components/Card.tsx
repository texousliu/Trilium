import { ComponentChildren, HTMLAttributes } from "preact";
import Button from "./Button";

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
    title: ComponentChildren;
    imageUrl?: string;
    className?: string;
    moreInfoUrl?: string;
    children: ComponentChildren;
}

export default function Card({ title, children, imageUrl, className, moreInfoUrl, ...restProps }: CardProps) {
    return (
        <div className={`card ${className}`} {...restProps}>
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
