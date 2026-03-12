import type { ReactNode } from "react";
import type {
	CapacityDeviceGrowthMetric as CapacityDeviceGrowthMetricType,
	CapacityIfaceGrowthMetric as CapacityIfaceGrowthMetricType,
	DeviceGrowthRowLike,
	InterfaceGrowthRowLike,
	GrowthQueryLike as GrowthQueryLikeType,
} from "./capacity-growth-shared-types";
import {
	CapacityGrowthDeviceTableCard,
	CapacityGrowthHeaderCard,
	CapacityGrowthInterfaceTableCard,
} from "./capacity-growth-cards";

export type CapacityIfaceGrowthMetric = CapacityIfaceGrowthMetricType;
export type CapacityDeviceGrowthMetric = CapacityDeviceGrowthMetricType;

type CapacityGrowthTabSharedProps = {
	containerClassName?: string;
	compareHours: number;
	onCompareHoursChange: (hours: number) => void;
	ifaceGrowthMetric: CapacityIfaceGrowthMetric;
	onIfaceGrowthMetricChange: (metric: CapacityIfaceGrowthMetric) => void;
	deviceGrowthMetric: CapacityDeviceGrowthMetric;
	onDeviceGrowthMetricChange: (metric: CapacityDeviceGrowthMetric) => void;
	ifaceGrowth: GrowthQueryLikeType;
	deviceGrowth: GrowthQueryLikeType;
	ifaceGrowthRows: InterfaceGrowthRowLike[];
	deviceGrowthRows: DeviceGrowthRowLike[];
	summaryAsOf?: string;
	onIfaceRowClick: (row: InterfaceGrowthRowLike) => void;
	onDeviceRowClick: (row: DeviceGrowthRowLike) => void;
	formatPercent01: (value: number | undefined) => string;
	formatSpeedMbps: (value: number | null) => string;
};

export type { DeviceGrowthRowLike, InterfaceGrowthRowLike, GrowthQueryLike } from "./capacity-growth-shared-types";

function renderGrowthCards(props: CapacityGrowthTabSharedProps): ReactNode {
	const {
		compareHours,
		onCompareHoursChange,
		ifaceGrowthMetric,
		onIfaceGrowthMetricChange,
		deviceGrowthMetric,
		onDeviceGrowthMetricChange,
		ifaceGrowth,
		deviceGrowth,
		ifaceGrowthRows,
		deviceGrowthRows,
		summaryAsOf,
		onIfaceRowClick,
		onDeviceRowClick,
		formatPercent01,
		formatSpeedMbps,
	} = props;

	return (
		<>
			<CapacityGrowthHeaderCard
				compareHours={compareHours}
				onCompareHoursChange={onCompareHoursChange}
				ifaceGrowth={ifaceGrowth}
				deviceGrowth={deviceGrowth}
				summaryAsOf={summaryAsOf}
			/>
			<CapacityGrowthInterfaceTableCard
				ifaceGrowthMetric={ifaceGrowthMetric}
				onIfaceGrowthMetricChange={onIfaceGrowthMetricChange}
				formatPercent01={formatPercent01}
				formatSpeedMbps={formatSpeedMbps}
				ifaceGrowth={ifaceGrowth}
				ifaceGrowthRows={ifaceGrowthRows}
				onIfaceRowClick={onIfaceRowClick}
			/>
			<CapacityGrowthDeviceTableCard
				deviceGrowthMetric={deviceGrowthMetric}
				onDeviceGrowthMetricChange={onDeviceGrowthMetricChange}
				formatPercent01={formatPercent01}
				deviceGrowth={deviceGrowth}
				deviceGrowthRows={deviceGrowthRows}
				onDeviceRowClick={onDeviceRowClick}
			/>
		</>
	);
}

export function CapacityGrowthTabShared(props: CapacityGrowthTabSharedProps) {
	const cards = renderGrowthCards(props);
	if (!props.containerClassName) return cards;
	return <div className={props.containerClassName}>{cards}</div>;
}
