import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition";

export default {
	solidity: {
		version: "0.8.28",
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	networks: {
		hardhat: {
			chainId: 1337,
			allowUnlimitedContractSize: true,
		},
	},
	gasReporter: {
		enabled: false,
	},
};
