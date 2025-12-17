import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("🏭 실제 탄소배출 데이터 테스트", function () {
	async function deployStorageFixture() {
		const [factory] = await hre.ethers.getSigners();

		const UniversalStorage = await hre.ethers.getContractFactory("UniversalStorage");
		const storage = await UniversalStorage.deploy();
		await storage.waitForDeployment();

		return { storage, factory };
	}

	// 키 헬퍼
	const Keys = {
		// 항목별 월별 배출량: "carbon:item:전기:2024:1"
		monthlyByItem: (item, year, month) =>
			hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`carbon:item:${item}:${year}:${month}`)),

		// 항목별 연간 총계: "carbon:item:전기:total"
		itemTotal: (item) => hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`carbon:item:${item}:total`)),

		// 월별 전체 배출량: "carbon:monthly:2024:1"
		monthlyTotal: (year, month) => hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`carbon:monthly:${year}:${month}`)),

		// 연간 총배출량: "carbon:total:2024"
		yearTotal: (year) => hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`carbon:total:${year}`)),

		// 항목 리스트
		itemList: () => hre.ethers.keccak256(hre.ethers.toUtf8Bytes("carbon:items")),
	};

	describe("1. 월별 데이터 입력", function () {
		it("2024년 전체 데이터 입력", async function () {
			const { storage, factory } = await loadFixture(deployStorageFixture);

			console.log("\n=== 2024년 배출 데이터 입력 ===\n");

			// 실제 데이터 (단위: tCO2eq를 kg으로 변환 * 1000)
			const monthlyData = {
				전기: [
					1838400, 3035000, 2628700, 3035200, 3073200, 3424400, 3340200, 3340200, 3340200, 3340200, 3340200,
					3340200,
				],
				공업용수: [
					1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000,
					1565000,
				],
				LNG: [898200, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100],
				폐기물: [
					1260800, 1260800, 1260800, 1260800, 1260800, 1379400, 1260800, 1260800, 1260800, 1260800, 1260800,
					1379400,
				],
			};

			const items = Object.keys(monthlyData);

			// 항목 리스트 저장
			await storage.connect(factory).setStringArray(Keys.itemList(), items);
			console.log("✅ 항목 저장:", items.join(", "));

			// 각 항목별 월별 데이터 입력
			for (const item of items) {
				console.log(`\n📊 ${item} 입력 중...`);

				for (let month = 1; month <= 12; month++) {
					const amount = monthlyData[item][month - 1];
					await storage.connect(factory).setUint(Keys.monthlyByItem(item, 2024, month), amount);
				}
				console.log(`   ✅ 12개월 데이터 입력 완료`);
			}

			console.log("\n✅ 전체 데이터 입력 완료!");
		});
	});

	describe("2. 항목별 연간 총계 계산", function () {
		it("각 항목별 연간 배출량 계산 및 저장", async function () {
			const { storage, factory } = await loadFixture(deployStorageFixture);

			// 데이터 입력 (setUp)
			const monthlyData = {
				전기: [
					1838400, 3035000, 2628700, 3035200, 3073200, 3424400, 3340200, 3340200, 3340200, 3340200, 3340200,
					3340200,
				],
				공업용수: [
					1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000,
					1565000,
				],
				LNG: [898200, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100],
				폐기물: [
					1260800, 1260800, 1260800, 1260800, 1260800, 1379400, 1260800, 1260800, 1260800, 1260800, 1260800,
					1379400,
				],
			};

			for (const item of Object.keys(monthlyData)) {
				for (let month = 1; month <= 12; month++) {
					await storage
						.connect(factory)
						.setUint(Keys.monthlyByItem(item, 2024, month), monthlyData[item][month - 1]);
				}
			}

			console.log("\n=== 항목별 연간 총계 ===\n");

			// 각 항목별 총계 계산
			for (const item of Object.keys(monthlyData)) {
				let yearTotal = 0n;

				// 12개월 합계
				for (let month = 1; month <= 12; month++) {
					const amount = await storage.connect(factory).getUint(Keys.monthlyByItem(item, 2024, month));
					yearTotal += amount;
				}

				// 총계 저장
				await storage.connect(factory).setUint(Keys.itemTotal(item), yearTotal);

				console.log(`${item}: ${(Number(yearTotal) / 1000).toFixed(1)} tCO2eq`);
			}

			// 검증
			const electricTotal = await storage.connect(factory).getUint(Keys.itemTotal("전기"));
			expect(Number(electricTotal)).to.be.greaterThan(0);
		});
	});

	describe("3. 월별 총계 조회", function () {
		it("특정 월의 전체 배출량", async function () {
			const { storage, factory } = await loadFixture(deployStorageFixture);

			// 데이터 준비
			const monthlyData = {
				전기: [
					1838400, 3035000, 2628700, 3035200, 3073200, 3424400, 3340200, 3340200, 3340200, 3340200, 3340200,
					3340200,
				],
				공업용수: [
					1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000,
					1565000,
				],
				LNG: [898200, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100],
				폐기물: [
					1260800, 1260800, 1260800, 1260800, 1260800, 1379400, 1260800, 1260800, 1260800, 1260800, 1260800,
					1379400,
				],
			};

			const items = Object.keys(monthlyData);

			for (const item of items) {
				for (let month = 1; month <= 12; month++) {
					await storage
						.connect(factory)
						.setUint(Keys.monthlyByItem(item, 2024, month), monthlyData[item][month - 1]);
				}
			}

			console.log("\n=== 월별 총 배출량 ===\n");

			// 각 월별 총계
			for (let month = 1; month <= 12; month++) {
				let monthTotal = 0n;

				for (const item of items) {
					const amount = await storage.connect(factory).getUint(Keys.monthlyByItem(item, 2024, month));
					monthTotal += amount;
				}

				// 월별 총계 저장
				await storage.connect(factory).setUint(Keys.monthlyTotal(2024, month), monthTotal);

				console.log(`${month}월: ${(Number(monthTotal) / 1000).toFixed(1)} tCO2eq`);
			}
		});
	});

	describe("4. 연간 총 배출량 계산", function () {
		it("2024년 총 배출량", async function () {
			const { storage, factory } = await loadFixture(deployStorageFixture);

			// 데이터 준비
			const monthlyData = {
				전기: [
					1838400, 3035000, 2628700, 3035200, 3073200, 3424400, 3340200, 3340200, 3340200, 3340200, 3340200,
					3340200,
				],
				공업용수: [
					1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000,
					1565000,
				],
				LNG: [898200, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100],
				폐기물: [
					1260800, 1260800, 1260800, 1260800, 1260800, 1379400, 1260800, 1260800, 1260800, 1260800, 1260800,
					1379400,
				],
			};

			const items = Object.keys(monthlyData);

			// 데이터 입력
			for (const item of items) {
				for (let month = 1; month <= 12; month++) {
					await storage
						.connect(factory)
						.setUint(Keys.monthlyByItem(item, 2024, month), monthlyData[item][month - 1]);
				}
			}

			console.log("\n=== 2024년 총 배출량 계산 ===\n");

			let yearTotal = 0n;

			// 모든 항목, 모든 월 합계
			for (const item of items) {
				for (let month = 1; month <= 12; month++) {
					const amount = await storage.connect(factory).getUint(Keys.monthlyByItem(item, 2024, month));
					yearTotal += amount;
				}
			}

			// 연간 총계 저장
			await storage.connect(factory).setUint(Keys.yearTotal(2024), yearTotal);

			console.log(`📊 2024년 총 배출량: ${(Number(yearTotal) / 1000).toFixed(1)} tCO2eq`);

			// 항목별 기여도
			console.log("\n=== 항목별 기여도 ===\n");
			for (const item of items) {
				let itemYearTotal = 0n;
				for (let month = 1; month <= 12; month++) {
					const amount = await storage.connect(factory).getUint(Keys.monthlyByItem(item, 2024, month));
					itemYearTotal += amount;
				}

				const contribution = (Number(itemYearTotal) / Number(yearTotal)) * 100;
				console.log(`${item}: ${contribution.toFixed(1)}%`);
			}
		});
	});

	describe("5. 최대/최소 배출 월 찾기", function () {
		it("전기 사용량이 가장 많은 월", async function () {
			const { storage, factory } = await loadFixture(deployStorageFixture);

			const electricData = [
				1838400, 3035000, 2628700, 3035200, 3073200, 3424400, 3340200, 3340200, 3340200, 3340200, 3340200,
				3340200,
			];

			// 데이터 입력
			for (let month = 1; month <= 12; month++) {
				await storage
					.connect(factory)
					.setUint(Keys.monthlyByItem("전기", 2024, month), electricData[month - 1]);
			}

			console.log("\n=== 전기 사용 분석 ===\n");

			let maxAmount = 0n;
			let maxMonth = 0;
			let minAmount = BigInt(Number.MAX_SAFE_INTEGER);
			let minMonth = 0;

			for (let month = 1; month <= 12; month++) {
				const amount = await storage.connect(factory).getUint(Keys.monthlyByItem("전기", 2024, month));

				if (amount > maxAmount) {
					maxAmount = amount;
					maxMonth = month;
				}
				if (amount < minAmount) {
					minAmount = amount;
					minMonth = month;
				}
			}

			console.log(`최대 배출: ${maxMonth}월 - ${(Number(maxAmount) / 1000).toFixed(1)} tCO2eq`);
			console.log(`최소 배출: ${minMonth}월 - ${(Number(minAmount) / 1000).toFixed(1)} tCO2eq`);
			console.log(`차이: ${((Number(maxAmount) - Number(minAmount)) / 1000).toFixed(1)} tCO2eq`);

			expect(maxMonth).to.equal(6); // 6월이 가장 많음
			expect(minMonth).to.equal(1); // 1월이 가장 적음
		});
	});

	describe("6. 추세 분석", function () {
		it("분기별 배출량 비교", async function () {
			const { storage, factory } = await loadFixture(deployStorageFixture);

			// 전기 데이터만 사용
			const electricData = [
				1838400, 3035000, 2628700, 3035200, 3073200, 3424400, 3340200, 3340200, 3340200, 3340200, 3340200,
				3340200,
			];

			for (let month = 1; month <= 12; month++) {
				await storage
					.connect(factory)
					.setUint(Keys.monthlyByItem("전기", 2024, month), electricData[month - 1]);
			}

			console.log("\n=== 분기별 전기 배출량 ===\n");

			// 분기별 계산
			const quarters = [
				{ name: "1분기", months: [1, 2, 3] },
				{ name: "2분기", months: [4, 5, 6] },
				{ name: "3분기", months: [7, 8, 9] },
				{ name: "4분기", months: [10, 11, 12] },
			];

			for (const quarter of quarters) {
				let quarterTotal = 0n;

				for (const month of quarter.months) {
					const amount = await storage.connect(factory).getUint(Keys.monthlyByItem("전기", 2024, month));
					quarterTotal += amount;
				}

				console.log(`${quarter.name}: ${(Number(quarterTotal) / 1000).toFixed(1)} tCO2eq`);
			}
		});
	});

	describe("7. 실전 시나리오 - 전체 대시보드", function () {
		it("2024년 탄소배출 대시보드", async function () {
			const { storage, factory } = await loadFixture(deployStorageFixture);

			// 전체 데이터 입력
			const monthlyData = {
				전기: [
					1838400, 3035000, 2628700, 3035200, 3073200, 3424400, 3340200, 3340200, 3340200, 3340200, 3340200,
					3340200,
				],
				공업용수: [
					1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000,
					1565000,
				],
				LNG: [898200, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100],
				폐기물: [
					1260800, 1260800, 1260800, 1260800, 1260800, 1379400, 1260800, 1260800, 1260800, 1260800, 1260800,
					1379400,
				],
			};

			const items = Object.keys(monthlyData);

			for (const item of items) {
				for (let month = 1; month <= 12; month++) {
					await storage
						.connect(factory)
						.setUint(Keys.monthlyByItem(item, 2024, month), monthlyData[item][month - 1]);
				}
			}

			console.log("\n" + "=".repeat(60));
			console.log("📊 2024년 탄소배출 대시보드");
			console.log("=".repeat(60));

			// 1. 연간 총배출량
			let yearTotal = 0n;
			for (const item of items) {
				for (let month = 1; month <= 12; month++) {
					const amount = await storage.connect(factory).getUint(Keys.monthlyByItem(item, 2024, month));
					yearTotal += amount;
				}
			}
			console.log(`\n🌍 연간 총 배출량: ${(Number(yearTotal) / 1000).toFixed(1)} tCO2eq\n`);

			// 2. 항목별 총계 및 기여도
			console.log("📌 항목별 배출량:");
			for (const item of items) {
				let itemTotal = 0n;
				for (let month = 1; month <= 12; month++) {
					const amount = await storage.connect(factory).getUint(Keys.monthlyByItem(item, 2024, month));
					itemTotal += amount;
				}
				const contribution = (Number(itemTotal) / Number(yearTotal)) * 100;
				console.log(
					`   ${item.padEnd(10)} ${(Number(itemTotal) / 1000)
						.toFixed(1)
						.padStart(10)} tCO2eq (${contribution.toFixed(1)}%)`
				);
			}

			// 3. 월별 추이 (상위 3개월)
			console.log("\n📈 월별 총 배출량 TOP 3:");
			const monthlyTotals = [];
			for (let month = 1; month <= 12; month++) {
				let monthTotal = 0n;
				for (const item of items) {
					const amount = await storage.connect(factory).getUint(Keys.monthlyByItem(item, 2024, month));
					monthTotal += amount;
				}
				monthlyTotals.push({ month, total: monthTotal });
			}

			monthlyTotals.sort((a, b) => Number(b.total - a.total));
			for (let i = 0; i < 3; i++) {
				const { month, total } = monthlyTotals[i];
				console.log(`   ${i + 1}위. ${month}월: ${(Number(total) / 1000).toFixed(1)} tCO2eq`);
			}

			console.log("\n" + "=".repeat(60) + "\n");
		});
	});
});
