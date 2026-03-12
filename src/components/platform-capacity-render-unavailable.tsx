import { renderUnavailableIfMissing } from "./platform-capacity-formatting";

export function renderUnavailable(totalItems: number, label: string) {
    const message = renderUnavailableIfMissing(totalItems, label);
    return message ? <span className="text-muted-foreground">{message}</span> : null;
}
