import hre from "hardhat";

async function main() {
	console.log("\n" + "=".repeat(70));
	console.log("🏭 탄소배출 추적 시스템 - 2024년 데이터");
	console.log("=".repeat(70) + "\n");

	// 1. 컨트랙트 배포
	console.log("📦 컨트랙트 배포 중...");
	const UniversalStorage = await hre.ethers.getContractFactory("UniversalStorage");
	const storage = await UniversalStorage.deploy();
	await storage.waitForDeployment();

	const storageAddress = await storage.getAddress();
	console.log(`✅ 배포 완료: ${storageAddress}\n`);

	const [signer] = await hre.ethers.getSigners();
	console.log(`👤 사용자: ${signer.address}\n`);

	// 키 헬퍼
	const Keys = {
		monthlyByItem: (item, year, month) =>
			hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`carbon:item:${item}:${year}:${month}`)),
		itemTotal: (item) => hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`carbon:item:${item}:total`)),
		monthlyTotal: (year, month) => hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`carbon:monthly:${year}:${month}`)),
		yearTotal: (year) => hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`carbon:total:${year}`)),
	};

	// 2. 실제 데이터 (단위: tCO2eq * 1000 = kg)
	const monthlyData = {
		전기: [
			1838400, 3035000, 2628700, 3035200, 3073200, 3424400, 3340200, 3340200, 3340200, 3340200, 3340200, 3340200,
		],
		공업용수: [
			1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000, 1565000,
		],
		LNG: [898200, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100, 922100],
		폐기물: [
			1260800, 1260800, 1260800, 1260800, 1260800, 1379400, 1260800, 1260800, 1260800, 1260800, 1260800, 1379400,
		],
	};

	const items = Object.keys(monthlyData);

	// 3. 데이터 입력
	console.log("📝 월별 데이터 입력 중...\n");
	for (const item of items) {
		process.stdout.write(`   ${item.padEnd(10)} `);

		for (let month = 1; month <= 12; month++) {
			await storage.setUint(Keys.monthlyByItem(item, 2024, month), monthlyData[item][month - 1]);
			process.stdout.write(".");
		}
		console.log(" ✅");
	}

	console.log("\n✅ 전체 데이터 입력 완료!\n");

	// 4. 연간 총 배출량 계산
	console.log("🧮 연간 총 배출량 계산 중...\n");

	let yearTotal = 0n;
	const itemTotals = {};

	for (const item of items) {
		let itemYearTotal = 0n;

		for (let month = 1; month <= 12; month++) {
			const amount = await storage.getUint(Keys.monthlyByItem(item, 2024, month));
			itemYearTotal += amount;
		}

		itemTotals[item] = itemYearTotal;
		yearTotal += itemYearTotal;

		// 항목별 총계 저장
		await storage.setUint(Keys.itemTotal(item), itemYearTotal);
	}

	// 연간 총계 저장
	await storage.setUint(Keys.yearTotal(2024), yearTotal);

	// 5. 월별 총계 계산
	console.log("📅 월별 총계 계산 중...\n");

	for (let month = 1; month <= 12; month++) {
		let monthTotal = 0n;

		for (const item of items) {
			const amount = await storage.getUint(Keys.monthlyByItem(item, 2024, month));
			monthTotal += amount;
		}

		await storage.setUint(Keys.monthlyTotal(2024, month), monthTotal);
	}

	// ========================================
	// 6. 대시보드 출력
	// ========================================

	console.log("\n" + "=".repeat(70));
	console.log("📊 2024년 탄소배출 대시보드");
	console.log("=".repeat(70));

	// 6-1. 연간 총 배출량
	console.log(`\n🌍 연간 총 배출량: ${(Number(yearTotal) / 1000).toFixed(1)} tCO2eq\n`);

	// 6-2. 항목별 배출량 및 기여도
	console.log("📌 항목별 배출량 및 기여도:\n");
	console.log("   항목          배출량 (tCO2eq)    기여도");
	console.log("   " + "-".repeat(50));

	for (const item of items) {
		const total = itemTotals[item];
		const contribution = (Number(total) / Number(yearTotal)) * 100;
		const totalInTons = (Number(total) / 1000).toFixed(1);

		console.log(`   ${item.padEnd(10)}  ${totalInTons.padStart(15)}  ${contribution.toFixed(1).padStart(8)}%`);
	}

	// 6-3. 월별 배출량 추이 (전체 합계)
	console.log("\n📈 월별 총 배출량 추이 (전체):\n");
	console.log("   월      배출량 (tCO2eq)");
	console.log("   " + "-".repeat(30));

	const monthlyTotals = [];
	for (let month = 1; month <= 12; month++) {
		const total = await storage.getUint(Keys.monthlyTotal(2024, month));
		monthlyTotals.push({ month, total });

		const totalInTons = (Number(total) / 1000).toFixed(1);
		console.log(`   ${month.toString().padStart(2)}월    ${totalInTons.padStart(15)}`);
	}

	// 6-4. 월별 배출량 상세 (항목별 분리)
	console.log("\n📊 월별 배출량 상세 (항목별):\n");
	console.log("   월      전기      공업용수      LNG      폐기물      합계");
	console.log("   " + "-".repeat(75));

	for (let month = 1; month <= 12; month++) {
		const values = [];
		let monthTotal = 0n;

		for (const item of items) {
			const amount = await storage.getUint(Keys.monthlyByItem(item, 2024, month));
			values.push((Number(amount) / 1000).toFixed(1));
			monthTotal += amount;
		}

		console.log(
			`   ${month.toString().padStart(2)}월    ` +
				`${values[0].padStart(8)}  ` +
				`${values[1].padStart(10)}  ` +
				`${values[2].padStart(8)}  ` +
				`${values[3].padStart(8)}  ` +
				`${(Number(monthTotal) / 1000).toFixed(1).padStart(8)}`
		);
	}

	// 6-5. 항목별 월별 추이 (각 항목별로 자세히)
	console.log("\n📉 항목별 월별 추이:\n");

	for (const item of items) {
		console.log(`\n${item}:`);
		console.log("   월      배출량 (tCO2eq)    전월 대비");
		console.log("   " + "-".repeat(45));

		let prevAmount = 0n;
		for (let month = 1; month <= 12; month++) {
			const amount = await storage.getUint(Keys.monthlyByItem(item, 2024, month));
			const amountInTons = (Number(amount) / 1000).toFixed(1);

			let change = "";
			if (month > 1) {
				const diff = Number(amount - prevAmount);
				const diffInTons = (diff / 1000).toFixed(1);
				if (diff > 0) {
					change = `+${diffInTons}`;
				} else if (diff < 0) {
					change = diffInTons;
				} else {
					change = "±0.0";
				}
			} else {
				change = "-";
			}

			console.log(
				`   ${month.toString().padStart(2)}월    ${amountInTons.padStart(15)}    ${change.padStart(10)}`
			);
			prevAmount = amount;
		}
	}

	// 6-6. 최대/최소 배출 월
	console.log("\n🔍 배출량 분석:\n");

	const sortedMonths = [...monthlyTotals].sort((a, b) => Number(b.total - a.total));
	const maxMonth = sortedMonths[0];
	const minMonth = sortedMonths[sortedMonths.length - 1];

	console.log(`   ▶ 최대 배출 월: ${maxMonth.month}월 (${(Number(maxMonth.total) / 1000).toFixed(1)} tCO2eq)`);
	console.log(`   ▶ 최소 배출 월: ${minMonth.month}월 (${(Number(minMonth.total) / 1000).toFixed(1)} tCO2eq)`);
	console.log(`   ▶ 차이: ${((Number(maxMonth.total) - Number(minMonth.total)) / 1000).toFixed(1)} tCO2eq`);
	console.log(
		`   ▶ 변동률: ${(((Number(maxMonth.total) - Number(minMonth.total)) / Number(minMonth.total)) * 100).toFixed(
			1
		)}%`
	);

	// 6-7. 분기별 배출량
	console.log("\n📊 분기별 배출량:\n");

	const quarters = [
		{ name: "1분기 (1-3월)", months: [1, 2, 3] },
		{ name: "2분기 (4-6월)", months: [4, 5, 6] },
		{ name: "3분기 (7-9월)", months: [7, 8, 9] },
		{ name: "4분기 (10-12월)", months: [10, 11, 12] },
	];

	console.log("   분기              배출량 (tCO2eq)    평균");
	console.log("   " + "-".repeat(55));

	for (const quarter of quarters) {
		let quarterTotal = 0n;

		for (const month of quarter.months) {
			const total = await storage.getUint(Keys.monthlyTotal(2024, month));
			quarterTotal += total;
		}

		const avg = Number(quarterTotal) / 3 / 1000;
		console.log(
			`   ${quarter.name.padEnd(20)} ` +
				`${(Number(quarterTotal) / 1000).toFixed(1).padStart(15)}  ` +
				`${avg.toFixed(1).padStart(10)}`
		);
	}

	// 6-8. 항목별 최대/최소 월
	console.log("\n🎯 항목별 최대/최소 배출 월:\n");

	for (const item of items) {
		let maxAmount = 0n;
		let maxMonth = 0;
		let minAmount = BigInt(Number.MAX_SAFE_INTEGER);
		let minMonth = 0;

		for (let month = 1; month <= 12; month++) {
			const amount = await storage.getUint(Keys.monthlyByItem(item, 2024, month));

			if (amount > maxAmount) {
				maxAmount = amount;
				maxMonth = month;
			}
			if (amount < minAmount) {
				minAmount = amount;
				minMonth = month;
			}
		}

		console.log(`${item}:`);
		console.log(`   최대: ${maxMonth}월 (${(Number(maxAmount) / 1000).toFixed(1)} tCO2eq)`);
		console.log(`   최소: ${minMonth}월 (${(Number(minAmount) / 1000).toFixed(1)} tCO2eq)`);
		console.log(`   변동: ${((Number(maxAmount) - Number(minAmount)) / 1000).toFixed(1)} tCO2eq\n`);
	}

	// 6-9. 인사이트
	console.log("💡 주요 인사이트:\n");

	// 가장 많이 배출하는 항목
	const maxItem = Object.entries(itemTotals).sort((a, b) => Number(b[1] - a[1]))[0];
	console.log(`   • 가장 많이 배출: ${maxItem[0]} (${(Number(maxItem[1]) / 1000).toFixed(1)} tCO2eq)`);

	// 가장 적게 배출하는 항목
	const minItem = Object.entries(itemTotals).sort((a, b) => Number(a[1] - b[1]))[0];
	console.log(`   • 가장 적게 배출: ${minItem[0]} (${(Number(minItem[1]) / 1000).toFixed(1)} tCO2eq)`);

	// 배출량이 일정한 항목
	const constantItems = [];
	for (const item of items) {
		const first = await storage.getUint(Keys.monthlyByItem(item, 2024, 1));
		const last = await storage.getUint(Keys.monthlyByItem(item, 2024, 12));
		if (first === last) {
			constantItems.push(item);
		}
	}
	if (constantItems.length > 0) {
		console.log(`   • 배출량 일정: ${constantItems.join(", ")}`);
	}

	// 배출량이 변동하는 항목
	const variableItems = items.filter((item) => !constantItems.includes(item));
	if (variableItems.length > 0) {
		console.log(`   • 배출량 변동: ${variableItems.join(", ")}`);
	}

	console.log("\n" + "=".repeat(70));
	console.log("✅ 분석 완료!");
	console.log("=".repeat(70) + "\n");

	// 저장된 데이터 요약
	console.log("💾 블록체인 저장 정보:\n");
	console.log(`   컨트랙트 주소: ${storageAddress}`);
	console.log(`   저장된 데이터 포인트: ${items.length * 12 + items.length + 12 + 1}개`);
	console.log(`   - 월별 항목별 데이터: ${items.length * 12}개 (${items.join(", ")} × 12개월)`);
	console.log(`   - 항목별 연간 총계: ${items.length}개`);
	console.log(`   - 월별 전체 총계: 12개`);
	console.log(`   - 연간 전체 총계: 1개\n`);

	console.log("🔗 데이터 구조:\n");
	console.log(`   carbon:item:전기:2024:1          → 1838.4 tCO2eq (1월 전기 배출량)`);
	console.log(`   carbon:item:전기:total           → 38116.2 tCO2eq (전기 연간 총계)`);
	console.log(`   carbon:monthly:2024:1            → 5562.4 tCO2eq (1월 전체 배출량)`);
	console.log(`   carbon:total:2024                → 85320.2 tCO2eq (2024년 총 배출량)\n`);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
