import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("🏭 탄소배출 추적 시스템", function () {
	async function deployStorageFixture() {
		const [factory] = await hre.ethers.getSigners();

		const UniversalStorage = await hre.ethers.getContractFactory("UniversalStorage");
		const storage = await UniversalStorage.deploy();
		await storage.waitForDeployment();

		return { storage, factory };
	}

	// 키 헬퍼
	const Keys = {
		total: () => hre.ethers.keccak256(hre.ethers.toUtf8Bytes("carbon:total")),
		historyAmount: () => hre.ethers.keccak256(hre.ethers.toUtf8Bytes("carbon:history:amount")),
		historyProcess: () => hre.ethers.keccak256(hre.ethers.toUtf8Bytes("carbon:history:process")),
		historyDate: () => hre.ethers.keccak256(hre.ethers.toUtf8Bytes("carbon:history:date")),
		processTotal: (process) => hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`carbon:process:${process}`)),
		monthlyTotal: (year, month) => hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`carbon:monthly:${year}:${month}`)),
	};

	describe("1. 배출 기록하기", function () {
		it("공정별 배출량 기록", async function () {
			const { storage, factory } = await loadFixture(deployStorageFixture);

			console.log("\n=== 공정별 배출 기록 ===");

			// 용접: 150kg
			await storage.connect(factory).pushUint(Keys.historyAmount(), 150);
			await storage.connect(factory).pushString(Keys.historyProcess(), "용접");
			await storage.connect(factory).pushString(Keys.historyDate(), "2024-01-15");
			console.log("✅ 용접: 150kg");

			// 도색: 200kg
			await storage.connect(factory).pushUint(Keys.historyAmount(), 200);
			await storage.connect(factory).pushString(Keys.historyProcess(), "도색");
			await storage.connect(factory).pushString(Keys.historyDate(), "2024-01-16");
			console.log("✅ 도색: 200kg");

			// 조립: 80kg
			await storage.connect(factory).pushUint(Keys.historyAmount(), 80);
			await storage.connect(factory).pushString(Keys.historyProcess(), "조립");
			await storage.connect(factory).pushString(Keys.historyDate(), "2024-01-17");
			console.log("✅ 조립: 80kg");

			const count = await storage.connect(factory).getIndexedLength(Keys.historyAmount());
			expect(count).to.equal(3n);
		});
	});

	describe("2. 배출 조회하기", function () {
		it("전체 히스토리 조회", async function () {
			const { storage, factory } = await loadFixture(deployStorageFixture);

			// 데이터 입력
			await storage.connect(factory).pushUint(Keys.historyAmount(), 150);
			await storage.connect(factory).pushString(Keys.historyProcess(), "용접");

			await storage.connect(factory).pushUint(Keys.historyAmount(), 200);
			await storage.connect(factory).pushString(Keys.historyProcess(), "도색");

			await storage.connect(factory).pushUint(Keys.historyAmount(), 80);
			await storage.connect(factory).pushString(Keys.historyProcess(), "조립");

			// 조회
			console.log("\n=== 배출 히스토리 ===");
			const length = await storage.connect(factory).getIndexedLength(Keys.historyAmount());

			for (let i = 0; i < Number(length); i++) {
				const amount = await storage.connect(factory).getUintAt(Keys.historyAmount(), i);
				const process = await storage.connect(factory).getStringAt(Keys.historyProcess(), i);
				console.log(`${i + 1}. ${process}: ${amount}kg CO2`);
			}

			expect(length).to.equal(3n);
		});

		it("최근 2건만 조회", async function () {
			const { storage, factory } = await loadFixture(deployStorageFixture);

			// 5건 기록
			const records = [
				{ amount: 100, process: "절단" },
				{ amount: 150, process: "용접" },
				{ amount: 200, process: "도색" },
				{ amount: 80, process: "조립" },
				{ amount: 50, process: "포장" },
			];

			for (const r of records) {
				await storage.connect(factory).pushUint(Keys.historyAmount(), r.amount);
				await storage.connect(factory).pushString(Keys.historyProcess(), r.process);
			}

			// 최근 2건
			console.log("\n=== 최근 2건 ===");
			const length = await storage.connect(factory).getIndexedLength(Keys.historyAmount());
			const start = Number(length) - 2;

			for (let i = start; i < Number(length); i++) {
				const amount = await storage.connect(factory).getUintAt(Keys.historyAmount(), i);
				const process = await storage.connect(factory).getStringAt(Keys.historyProcess(), i);
				console.log(`${process}: ${amount}kg`);
			}
		});
	});

	describe("3. 총 배출량 계산", function () {
		it("전체 합계", async function () {
			const { storage, factory } = await loadFixture(deployStorageFixture);

			// 기록
			const amounts = [150, 200, 80, 120, 90];
			for (const amount of amounts) {
				await storage.connect(factory).pushUint(Keys.historyAmount(), amount);
			}

			// 합계 계산
			const length = await storage.connect(factory).getIndexedLength(Keys.historyAmount());
			let total = 0n;

			for (let i = 0; i < Number(length); i++) {
				const amount = await storage.connect(factory).getUintAt(Keys.historyAmount(), i);
				total += amount;
			}

			// 총계 저장
			await storage.connect(factory).setUint(Keys.total(), total);

			console.log(`\n총 배출량: ${total} kg CO2`);
			expect(total).to.equal(640n);
		});
	});

	describe("4. 공정별 집계", function () {
		it("공정별 총 배출량", async function () {
			const { storage, factory } = await loadFixture(deployStorageFixture);

			console.log("\n=== 공정별 배출량 ===");

			// 용접 총계
			await storage.connect(factory).setUint(Keys.processTotal("용접"), 450);
			console.log("용접: 450kg");

			// 도색 총계
			await storage.connect(factory).setUint(Keys.processTotal("도색"), 600);
			console.log("도색: 600kg");

			// 조립 총계
			await storage.connect(factory).setUint(Keys.processTotal("조립"), 240);
			console.log("조립: 240kg");

			// 조회
			const welding = await storage.connect(factory).getUint(Keys.processTotal("용접"));
			const painting = await storage.connect(factory).getUint(Keys.processTotal("도색"));
			const assembly = await storage.connect(factory).getUint(Keys.processTotal("조립"));

			const total = welding + painting + assembly;
			console.log(`\n총계: ${total}kg`);

			expect(total).to.equal(1290n);
		});
	});

	describe("5. 월별 집계", function () {
		it("월별 배출량 저장 및 조회", async function () {
			const { storage, factory } = await loadFixture(deployStorageFixture);

			console.log("\n=== 월별 배출량 ===");

			// 2024년 데이터
			await storage.connect(factory).setUint(Keys.monthlyTotal(2024, 1), 5000);
			await storage.connect(factory).setUint(Keys.monthlyTotal(2024, 2), 4800);
			await storage.connect(factory).setUint(Keys.monthlyTotal(2024, 3), 4500);

			// 조회
			const jan = await storage.connect(factory).getUint(Keys.monthlyTotal(2024, 1));
			const feb = await storage.connect(factory).getUint(Keys.monthlyTotal(2024, 2));
			const mar = await storage.connect(factory).getUint(Keys.monthlyTotal(2024, 3));

			console.log(`2024-01: ${jan}kg`);
			console.log(`2024-02: ${feb}kg`);
			console.log(`2024-03: ${mar}kg`);

			console.log(`\n추세: ${jan > feb && feb > mar ? "✅ 감소 중" : "⚠️ 증가"}`);

			expect(mar).to.be.lessThan(jan);
		});
	});

	describe("6. 실전 시나리오", function () {
		it("한 달 운영 시뮬레이션", async function () {
			const { storage, factory } = await loadFixture(deployStorageFixture);

			console.log("\n=== 1월 운영 기록 ===");

			// 매일 기록 (10일치)
			const dailyRecords = [
				{ date: "01-01", amount: 150, process: "용접" },
				{ date: "01-02", amount: 200, process: "도색" },
				{ date: "01-03", amount: 180, process: "용접" },
				{ date: "01-04", amount: 220, process: "도색" },
				{ date: "01-05", amount: 160, process: "용접" },
				{ date: "01-06", amount: 0, process: "휴무" },
				{ date: "01-07", amount: 0, process: "휴무" },
				{ date: "01-08", amount: 190, process: "용접" },
				{ date: "01-09", amount: 210, process: "도색" },
				{ date: "01-10", amount: 170, process: "용접" },
			];

			let monthTotal = 0n;

			for (const record of dailyRecords) {
				if (record.amount > 0) {
					await storage.connect(factory).pushUint(Keys.historyAmount(), record.amount);
					await storage.connect(factory).pushString(Keys.historyProcess(), record.process);
					await storage.connect(factory).pushString(Keys.historyDate(), record.date);
					monthTotal += BigInt(record.amount);
					console.log(`${record.date} ${record.process}: ${record.amount}kg`);
				}
			}

			// 월 총계 저장
			await storage.connect(factory).setUint(Keys.monthlyTotal(2024, 1), monthTotal);

			console.log(`\n1월 총 배출량: ${monthTotal}kg CO2`);

			const recordCount = await storage.connect(factory).getIndexedLength(Keys.historyAmount());
			console.log(`총 기록 수: ${recordCount}건`);

			expect(recordCount).to.equal(8n); // 휴무 제외
			expect(monthTotal).to.equal(1480n);
		});
	});
});
