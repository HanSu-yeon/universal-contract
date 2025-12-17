const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("UniversalStorageModule", (m) => {
	// UniversalStorage 컨트랙트 배포
	const universalStorage = m.contract("UniversalStorage");

	return { universalStorage };
});
