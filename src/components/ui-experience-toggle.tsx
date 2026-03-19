import { Loader2, Sparkles, Wrench } from "lucide-react";
import { Button } from "./ui/button";
import type { UIExperienceMode } from "../lib/api-client-user-settings";
import { cn } from "../lib/utils";

type Props = {
	value: UIExperienceMode;
	busy?: boolean;
	onChange: (next: UIExperienceMode) => void | Promise<void>;
};

export function UIExperienceToggle({ value, busy = false, onChange }: Props) {
	return (
		<div className="hidden items-center gap-1 rounded-full border border-border/70 bg-background/80 p-1 md:flex">
			<ModeButton
				active={value === "simple"}
				busy={busy}
				icon={Sparkles}
				label="Simple"
				onClick={() => void onChange("simple")}
			/>
			<ModeButton
				active={value === "advanced"}
				busy={busy}
				icon={Wrench}
				label="Advanced"
				onClick={() => void onChange("advanced")}
			/>
		</div>
	);
}

function ModeButton({
	active,
	busy,
	icon: Icon,
	label,
	onClick,
}: {
	active: boolean;
	busy: boolean;
	icon: typeof Sparkles;
	label: string;
	onClick: () => void;
}) {
	return (
		<Button
			type="button"
			size="sm"
			variant={active ? "default" : "ghost"}
			className={cn(
				"h-8 rounded-full px-3 text-xs",
				!active && "text-muted-foreground",
			)}
			onClick={onClick}
			disabled={busy}
			aria-pressed={active}
		>
			{busy && active ? (
				<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
			) : (
				<Icon className="mr-1.5 h-3.5 w-3.5" />
			)}
			{label}
		</Button>
	);
}
