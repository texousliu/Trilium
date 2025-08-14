import { ComponentChildren } from "preact";

export default function FormText({ children }: { children: ComponentChildren }) {
    return <p className="form-text">{children}</p>
}