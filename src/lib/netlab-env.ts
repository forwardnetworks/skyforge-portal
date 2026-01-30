export type EnvKeyOption = { label: string; key: string };
export type EnvValueOption = { label: string; value: string };

// Supported NETLAB_* environment variables (native netlab feature), plus
// SKYFORGE_* variables that Skyforge's netlab generator understands.
export const NETLAB_ENV_KEYS: EnvKeyOption[] = [
	{ label: "Device (`NETLAB_DEVICE`)", key: "NETLAB_DEVICE" },
	{ label: "BGP AS (`NETLAB_BGP_AS`)", key: "NETLAB_BGP_AS" },
	{
		label: "P2P IPv4 pool (`NETLAB_ADDRESSING_P2P_IPV4`)",
		key: "NETLAB_ADDRESSING_P2P_IPV4",
	},
	{
		label: "P2P IPv6 mode (`NETLAB_ADDRESSING_P2P_IPV6`)",
		key: "NETLAB_ADDRESSING_P2P_IPV6",
	},
	{
		label: "Loopback IPv4 pool (`NETLAB_ADDRESSING_LOOPBACK_IPV4`)",
		key: "NETLAB_ADDRESSING_LOOPBACK_IPV4",
	},
	{
		label: "LAN IPv4 pool (`NETLAB_ADDRESSING_LAN_IPV4`)",
		key: "NETLAB_ADDRESSING_LAN_IPV4",
	},
	{
		label: "Netlab `--set` overrides (`SKYFORGE_NETLAB_SET_OVERRIDES`)",
		key: "SKYFORGE_NETLAB_SET_OVERRIDES",
	},
];

export const NETLAB_DEVICE_PRESETS: EnvValueOption[] = [
	{ label: "Arista EOS (eos)", value: "eos" },
	{ label: "Cisco IOL (iol)", value: "iol" },
	{ label: "Cisco IOSv (iosv)", value: "iosv" },
	{ label: "Cisco IOSvL2 (iosvl2)", value: "iosvl2" },
	{ label: "Cisco CSR1000v (csr)", value: "csr" },
	{ label: "Cisco ASA (asav)", value: "asav" },
	{ label: "Cisco NX-OSv9k (nxos)", value: "nxos" },
	{ label: "Juniper SRX (vsrx)", value: "vsrx" },
	{ label: "Juniper vMX (vmx)", value: "vmx" },
	{ label: "Juniper vJunos Router (vjunos-router)", value: "vjunos-router" },
	{ label: "Juniper vJunos Switch (vjunos-switch)", value: "vjunos-switch" },
	{ label: "Nokia SR OS (sros)", value: "sros" },
	{ label: "Linux (linux)", value: "linux" },
];

export function isNetlabMultilineKey(keyRaw: string): boolean {
	return (
		String(keyRaw ?? "")
			.trim()
			.toUpperCase() === "SKYFORGE_NETLAB_SET_OVERRIDES"
	);
}

export function netlabValuePresets(keyRaw: string): EnvValueOption[] | null {
	const key = String(keyRaw ?? "")
		.trim()
		.toUpperCase();
	switch (key) {
		case "NETLAB_DEVICE":
			return NETLAB_DEVICE_PRESETS;
		case "NETLAB_BGP_AS":
			return [
				{ label: "65000", value: "65000" },
				{ label: "65100", value: "65100" },
				{ label: "65200", value: "65200" },
				{ label: "65500", value: "65500" },
			];
		case "NETLAB_ADDRESSING_P2P_IPV4":
			return [
				{ label: "198.18.0.0/16 (benchmark range)", value: "198.18.0.0/16" },
				{ label: "172.16.0.0/12", value: "172.16.0.0/12" },
				{ label: "100.64.0.0/10", value: "100.64.0.0/10" },
			];
		case "NETLAB_ADDRESSING_P2P_IPV6":
			return [
				{ label: "false (disable / avoid LLA-only)", value: "false" },
				{ label: "true", value: "true" },
			];
		case "NETLAB_ADDRESSING_LOOPBACK_IPV4":
			return [
				{ label: "10.0.0.0/24", value: "10.0.0.0/24" },
				{ label: "198.18.1.0/24", value: "198.18.1.0/24" },
				{ label: "172.16.0.0/24", value: "172.16.0.0/24" },
			];
		case "NETLAB_ADDRESSING_LAN_IPV4":
			return [
				{ label: "172.18.0.0/16", value: "172.18.0.0/16" },
				{ label: "198.18.128.0/17", value: "198.18.128.0/17" },
			];
		default:
			return null;
	}
}
