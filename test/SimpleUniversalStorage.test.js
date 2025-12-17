import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("UniversalStorage 테스트 코드", function () {
	async function deployStorageFixture() {
		const [alice, bob] = await hre.ethers.getSigners();

		const UniversalStorage = await hre.ethers.getContractFactory("UniversalStorage");
		const storage = await UniversalStorage.deploy();
		await storage.waitForDeployment();

		console.log(`\n✅ 컨트랙트 배포 완료!`);
		console.log(`Alice: ${alice.address}`);
		console.log(`Bob: ${bob.address}\n`);

		return { storage, alice, bob };
	}

	/**
	 * 레벨 1: 기본
		✅ 키-값 저장 원리
		✅ 다양한 타입 (숫자, 문자열)
		✅ 여러 데이터 저장
	 */
	describe("🎓 레벨 1: 기본 저장/조회 이해하기", function () {
		it("1-1. 숫자 하나 저장하고 읽기", async function () {
			const { storage, alice } = await loadFixture(deployStorageFixture);

			console.log("\n=== 숫자 저장하기 ===");

			// 키 만들기
			const myKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("age"));
			console.log("1. 키 생성: 'age' → 해시값");
			console.log("   키:", myKey);

			// 저장
			console.log("\n2. 저장: 25");
			await storage.connect(alice).setUint(myKey, 25);
			// console.log(" 저장 구조 예시 → storage['age'] = 25");

			// 읽기
			console.log("\n3. 읽기:");
			const age = await storage.connect(alice).getUint(myKey);
			console.log("  →  ", age.toString());

			expect(age).to.equal(25n);
			console.log("   ✅ 성공!");
		});

		it("1-2. 문자열 저장하고 읽기", async function () {
			const { storage, alice } = await loadFixture(deployStorageFixture);

			console.log("\n=== 문자열 저장하기 ===");

			const nameKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("name"));

			console.log("1. 저장: '수연'");
			await storage.connect(alice).setString(nameKey, "수연");
			// console.log("   → storage['name'] = '수연'");

			console.log("\n2. 읽기:");
			const name = await storage.connect(alice).getString(nameKey);
			// console.log(" → storage['name'] = ", name);
			console.log(" →", name);

			expect(name).to.equal("수연");
			console.log("   ✅ 한글 저장 성공");
		});

		it("1-3. 여러 개 저장하기 (각각 다른 키)", async function () {
			const { storage, alice } = await loadFixture(deployStorageFixture);

			console.log("\n=== 여러 데이터 저장 ===");

			const ageKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("age"));
			const nameKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("name"));
			const scoreKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("score"));

			console.log("1. age = 25");
			await storage.connect(alice).setUint(ageKey, 25);

			console.log("2. name = '수연'");
			await storage.connect(alice).setString(nameKey, "수연");

			console.log("3. score = 95");
			await storage.connect(alice).setUint(scoreKey, 95);

			// console.log("\n저장소 상태 기대값:");
			// console.log("  storage['age'] = 25");
			// console.log("  storage['name'] = '수연'");
			// console.log("  storage['score'] = 95");

			// 확인
			const age = await storage.connect(alice).getUint(ageKey);
			const name = await storage.connect(alice).getString(nameKey);
			const score = await storage.connect(alice).getUint(scoreKey);

			console.log("\n 실제 출력값:");
			console.log("  age =", age.toString());
			console.log("  name =", name);
			console.log("  score =", score.toString());

			expect(age).to.equal(25n);
			expect(name).to.equal("수연");
			expect(score).to.equal(95n);
		});
	});
	/**
	 * 레벨 2: 격리

	✅ 사용자별 독립 저장소
	✅ 같은 키, 다른 값
	*/
	describe("🎓 레벨 2: 사용자별 격리 이해하기", function () {
		it("2-1. Alice와 Bob은 같은 키를 써도 데이터가 다름", async function () {
			const { storage, alice, bob } = await loadFixture(deployStorageFixture);

			console.log("\n=== 사용자별 독립 저장소 ===");

			const scoreKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("score"));

			console.log("1. Alice가 저장: score = 100");
			await storage.connect(alice).setUint(scoreKey, 100);

			console.log("2. Bob이 저장: score = 200");
			await storage.connect(bob).setUint(scoreKey, 200);

			// console.log("\n저장소 구조:");
			// console.log("  Alice의 저장소['score'] = 100");
			// console.log("  Bob의 저장소['score'] = 200");

			// 각자 읽기
			const aliceScore = await storage.connect(alice).getUint(scoreKey);
			const bobScore = await storage.connect(bob).getUint(scoreKey);

			console.log("\n읽기:");
			console.log("  Alice가 읽음:", aliceScore.toString());
			console.log("  Bob이 읽음:", bobScore.toString());

			expect(aliceScore).to.equal(100n);
			expect(bobScore).to.equal(200n);
			console.log("  ✅ 서로 다른 값! 완전 독립!");
		});
	});
	/**
 * 레벨 3: 배열
		✅ 배열 전체 저장
		✅ append 동작 원리
		✅ 가스비 문제
 */
	describe("🎓 레벨 3: 배열 방식 이해하기 (작은 목록)", function () {
		it("3-1. 배열 전체를 한 번에 저장", async function () {
			const { storage, alice } = await loadFixture(deployStorageFixture);

			console.log("\n=== 배열 저장 방식 ===");

			const scoresKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("scores"));

			console.log("1. 배열 저장: [100, 95, 87]");
			await storage.connect(alice).setUintArray(scoresKey, [100, 95, 87]);
			console.log("   → storage['scores'] = [100, 95, 87] (전체를 하나로)");

			console.log("\n2. 배열 읽기:");
			const scores = await storage.connect(alice).getUintArray(scoresKey);
			console.log("   → [", scores.map((n) => n.toString()).join(", "), "]");

			expect(scores.length).to.equal(3);
			expect(scores[0]).to.equal(100n);
			console.log("   ✅ 배열 전체가 하나의 덩어리로 저장됨");
		});

		it("3-2. 배열에 추가하기 (append)", async function () {
			const { storage, alice } = await loadFixture(deployStorageFixture);

			console.log("\n=== 배열 Append ===");

			const scoresKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("scores"));

			console.log("1. 처음: [100, 95, 87]");
			await storage.connect(alice).setUintArray(scoresKey, [100, 95, 87]);

			console.log("\n2. 추가: [92, 88]");
			await storage.connect(alice).appendUintArray(scoresKey, [92, 88]);
			console.log("   내부 동작:");
			console.log("   - 기존 [100, 95, 87] 읽기");
			console.log("   - 새 배열 [100, 95, 87, 92, 88] 만들기");
			console.log("   - 전체 다시 저장");

			console.log("\n3. 결과:");
			const scores = await storage.connect(alice).getUintArray(scoresKey);
			console.log("   [", scores.map((n) => n.toString()).join(", "), "]");

			expect(scores.length).to.equal(5);
			expect(scores[3]).to.equal(92n);

			console.log("\n   ⚠️  배열이 크면 가스비 많이 듦!");
		});
	});
	/**
 * 레벨 4: 인덱스

		✅ pushUint 내부 동작
		✅ 길이 자동 관리
		✅ 개별 조회 방법
 */
	describe("🎓 레벨 4: 인덱스 방식 이해하기 (효율적!)", function () {
		it("4-1. 첫 번째 값 추가 (pushUint)", async function () {
			const { storage, alice } = await loadFixture(deployStorageFixture);

			console.log("\n=== 인덱스 방식: 첫 추가 ===");

			const baseKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("numbers"));
			console.log("1. baseKey 생성: 'numbers'");
			// console.log("   (인덱스 번호 없음!)");

			console.log("\n2. pushUint(baseKey, 10) 호출");
			await storage.connect(alice).pushUint(baseKey, 10);

			// console.log("\n   내부 동작:");
			// console.log("   a) lengthKey = hash('numbers:length')");
			// console.log("   b) 길이 읽기 → 없음 → 0");
			// console.log("   c) newIndex = 0");
			// console.log("   d) indexKey = hash('numbers:0')");
			// console.log("   e) storage['numbers:0'] = 10");
			// console.log("   f) storage['numbers:length'] = 1");

			// console.log("\n3. 저장소 상태:");
			// console.log("   numbers:length → 1");
			// console.log("   numbers:0 → 10");

			const length = await storage.connect(alice).getIndexedLength(baseKey);
			const value = await storage.connect(alice).getUintAt(baseKey, 0);

			console.log("\n4. 확인:");
			console.log("   길이:", length.toString());
			console.log("   [0]:", value.toString());

			expect(length).to.equal(1n);
			expect(value).to.equal(10n);
		});

		it("4-2. 두 번째, 세 번째 추가", async function () {
			const { storage, alice } = await loadFixture(deployStorageFixture);

			console.log("\n=== 연속으로 추가하기 ===");

			const baseKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("numbers"));

			console.log("1. 첫 번째: pushUint(baseKey, 10)");
			await storage.connect(alice).pushUint(baseKey, 10);
			// console.log("   → numbers:0 = 10");
			// console.log("   → numbers:length = 1");

			console.log("\n2. 두 번째: pushUint(baseKey, 20)");
			await storage.connect(alice).pushUint(baseKey, 20);
			// console.log("   내부:");
			// console.log("   - 길이 읽기 = 1");
			// console.log("   - newIndex = 1");
			// console.log("   → numbers:1 = 20");
			// console.log("   → numbers:length = 2");

			console.log("\n3. 세 번째: pushUint(baseKey, 30)");
			await storage.connect(alice).pushUint(baseKey, 30);
			// console.log("   내부:");
			// console.log("   - 길이 읽기 = 2");
			// console.log("   - newIndex = 2");
			// console.log("   → numbers:2 = 30");
			// console.log("   → numbers:length = 3");

			// console.log("\n4. 최종 저장소:");
			// console.log("   numbers:length → 3");
			// console.log("   numbers:0 → 10");
			// console.log("   numbers:1 → 20");
			// console.log("   numbers:2 → 30");

			const length = await storage.connect(alice).getIndexedLength(baseKey);
			const val0 = await storage.connect(alice).getUintAt(baseKey, 0);
			const val1 = await storage.connect(alice).getUintAt(baseKey, 1);
			const val2 = await storage.connect(alice).getUintAt(baseKey, 2);

			console.log("\n5. 읽기:");
			console.log("   길이:", length.toString());
			console.log("   [0]:", val0.toString());
			console.log("   [1]:", val1.toString());
			console.log("   [2]:", val2.toString());

			expect(length).to.equal(3n);
			expect(val0).to.equal(10n);
			expect(val1).to.equal(20n);
			expect(val2).to.equal(30n);
		});

		it("4-3. 전체 조회하기 (루프)", async function () {
			const { storage, alice } = await loadFixture(deployStorageFixture);

			console.log("\n=== 전체 데이터 조회 ===");

			const baseKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("scores"));

			console.log("1. 5개 추가:");
			const scores = [100, 95, 87, 92, 88];
			for (let i = 0; i < scores.length; i++) {
				await storage.connect(alice).pushUint(baseKey, scores[i]);
				console.log(`   pushUint(${scores[i]}) → scores:${i} = ${scores[i]}`);
			}

			console.log("\n2. 길이 확인:");
			const length = await storage.connect(alice).getIndexedLength(baseKey);
			console.log("   length =", length.toString());

			console.log("\n3. 루프로 전체 읽기:");
			const allScores = [];
			for (let i = 0; i < Number(length); i++) {
				const score = await storage.connect(alice).getUintAt(baseKey, i);
				allScores.push(Number(score));
				console.log(`   [${i}] =`, score.toString());
			}

			console.log("\n4. 결과:");
			console.log("   [", allScores.join(", "), "]");

			expect(allScores).to.deep.equal([100, 95, 87, 92, 88]);
		});
	});


	// describe("🎓 레벨 5: 배열 vs 인덱스 비교", function () {
	// 	it("6-1. 배열 방식 - 10개 추가", async function () {
	// 		const { storage, alice } = await loadFixture(deployStorageFixture);

	// 		console.log("\n=== 배열 방식 (appendUintArray) ===");

	// 		const key = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("array"));

	// 		console.log("1. 처음: [1, 2, 3]");
	// 		await storage.connect(alice).setUintArray(key, [1, 2, 3]);

	// 		console.log("\n2. 4번째 추가:");
	// 		const tx4 = await storage.connect(alice).appendUintArray(key, [4]);
	// 		const receipt4 = await tx4.wait();
	// 		console.log("   가스:", receipt4.gasUsed.toString());
	// 		console.log("   → [1, 2, 3] 읽고 [1, 2, 3, 4] 저장");

	// 		// 7개 더 추가
	// 		for (let i = 5; i <= 10; i++) {
	// 			await storage.connect(alice).appendUintArray(key, [i]);
	// 		}

	// 		console.log("\n3. 10번째 추가:");
	// 		const tx10 = await storage.connect(alice).appendUintArray(key, [11]);
	// 		const receipt10 = await tx10.wait();
	// 		console.log("   가스:", receipt10.gasUsed.toString());
	// 		console.log("   → [1,2,3,4,5,6,7,8,9,10] 읽고 [1~11] 저장");

	// 		console.log("\n⚠️  배열이 커질수록 가스비 증가!");
	// 	});

	// 	it("6-2. 인덱스 방식 - 10개 추가", async function () {
	// 		const { storage, alice } = await loadFixture(deployStorageFixture);

	// 		console.log("\n=== 인덱스 방식 (pushUint) ===");

	// 		const key = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("indexed"));

	// 		// 3개 추가
	// 		await storage.connect(alice).pushUint(key, 1);
	// 		await storage.connect(alice).pushUint(key, 2);
	// 		await storage.connect(alice).pushUint(key, 3);

	// 		console.log("1. 4번째 추가:");
	// 		const tx4 = await storage.connect(alice).pushUint(key, 4);
	// 		const receipt4 = await tx4.wait();
	// 		console.log("   가스:", receipt4.gasUsed.toString());
	// 		console.log("   → 길이만 확인, :3에만 저장");

	// 		// 7개 더 추가
	// 		for (let i = 5; i <= 10; i++) {
	// 			await storage.connect(alice).pushUint(key, i);
	// 		}

	// 		console.log("\n2. 10번째 추가:");
	// 		const tx10 = await storage.connect(alice).pushUint(key, 11);
	// 		const receipt10 = await tx10.wait();
	// 		console.log("   가스:", receipt10.gasUsed.toString());
	// 		console.log("   → 길이만 확인, :10에만 저장");

	// 		console.log("\n✅ 가스비가 거의 일정!");

	// 		// 가스비 비교
	// 		const diff = Math.abs(Number(receipt10.gasUsed - receipt4.gasUsed));
	// 		const diffPercent = (diff / Number(receipt4.gasUsed)) * 100;
	// 		console.log(`\n가스비 차이: ${diffPercent.toFixed(1)}% (10% 미만)`);

	// 		expect(diffPercent).to.be.lessThan(10);
	// 	});
	// });

});
