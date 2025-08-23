interface ActionButtonProps {
    text: string;
    icon: string;
    className?: string;
    onClick?: () => void;
}

export default function ActionButton({ text, icon, className, onClick }: ActionButtonProps) {
    return <button
        class={`icon-action ${icon} ${className ?? ""}`}
        title={text}
        onClick={onClick}        
    />;
}