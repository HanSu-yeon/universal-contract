import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("UniversalStorage - 인덱스 기반 저장 테스트", function () {
	async function deployStorageFixture() {
		const [user1, user2] = await hre.ethers.getSigners();

		const UniversalStorage = await hre.ethers.getContractFactory("UniversalStorage");
		const storage = await UniversalStorage.deploy();
		await storage.waitForDeployment();

		console.log(`\n✅ Storage deployed`);
		console.log(`👤 User1: ${user1.address}`);
		console.log(`👤 User2: ${user2.address}\n`);

		return { storage, user1, user2 };
	}

	describe("1️⃣ 숫자 리스트 만들기 (pushUint)", function () {
		it("숫자를 하나씩 추가", async function () {
			const { storage, user1 } = await loadFixture(deployStorageFixture);

			const baseKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("myNumbers"));

			console.log("\n📝 숫자 추가:");

			// 10, 20, 30 추가
			await storage.connect(user1).pushUint(baseKey, 10);
			console.log("  추가: 10");

			await storage.connect(user1).pushUint(baseKey, 20);
			console.log("  추가: 20");

			await storage.connect(user1).pushUint(baseKey, 30);
			console.log("  추가: 30");

			// 길이 확인
			const length = await storage.connect(user1).getIndexedLength(baseKey);
			console.log("\n📊 총 개수:", length.toString());
			expect(length).to.equal(3n);

			// 개별 조회
			const first = await storage.connect(user1).getUintAt(baseKey, 0);
			const second = await storage.connect(user1).getUintAt(baseKey, 1);
			const third = await storage.connect(user1).getUintAt(baseKey, 2);

			console.log("📖 읽기:");
			console.log("  [0]:", first.toString());
			console.log("  [1]:", second.toString());
			console.log("  [2]:", third.toString());

			expect(first).to.equal(10n);
			expect(second).to.equal(20n);
			expect(third).to.equal(30n);
		});

		it("개별 조회로 데이터 확인", async function () {
			const { storage, user1 } = await loadFixture(deployStorageFixture);

			const baseKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("scores"));

			// 5개 추가
			await storage.connect(user1).pushUint(baseKey, 100);
			await storage.connect(user1).pushUint(baseKey, 95);
			await storage.connect(user1).pushUint(baseKey, 87);
			await storage.connect(user1).pushUint(baseKey, 92);
			await storage.connect(user1).pushUint(baseKey, 88);

			// 길이 확인
			const length = await storage.connect(user1).getIndexedLength(baseKey);
			console.log("\n📊 총 개수:", length.toString());
			expect(length).to.equal(5n);

			// 개별 조회
			const allScores = [];
			for (let i = 0; i < Number(length); i++) {
				const score = await storage.connect(user1).getUintAt(baseKey, i);
				allScores.push(score);
			}

			console.log(
				"📖 전체 점수:",
				allScores.map((n) => n.toString())
			);
			expect(allScores[0]).to.equal(100n);
			expect(allScores[4]).to.equal(88n);

			// 최근 3개만 조회
			console.log("\n📖 최근 3개:");
			for (let i = 2; i < 5; i++) {
				const score = await storage.connect(user1).getUintAt(baseKey, i);
				console.log(`  [${i}]:`, score.toString());
			}
		});
	});

	describe("2️⃣ 문자열 리스트 만들기 (pushString)", function () {
		it("메시지를 하나씩 추가", async function () {
			const { storage, user1 } = await loadFixture(deployStorageFixture);

			const baseKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("messages"));

			console.log("\n💬 메시지 추가:");

			await storage.connect(user1).pushString(baseKey, "첫 번째 메시지");
			console.log("  추가: 첫 번째 메시지");

			await storage.connect(user1).pushString(baseKey, "두 번째 메시지");
			console.log("  추가: 두 번째 메시지");

			await storage.connect(user1).pushString(baseKey, "세 번째 메시지");
			console.log("  추가: 세 번째 메시지");

			// 길이 확인
			const length = await storage.connect(user1).getIndexedLength(baseKey);
			console.log("\n📊 총 개수:", length.toString());
			expect(length).to.equal(3n);

			// 개별 조회
			const msg1 = await storage.connect(user1).getStringAt(baseKey, 0);
			const msg2 = await storage.connect(user1).getStringAt(baseKey, 1);
			const msg3 = await storage.connect(user1).getStringAt(baseKey, 2);

			console.log("📖 읽기:");
			console.log("  [0]:", msg1);
			console.log("  [1]:", msg2);
			console.log("  [2]:", msg3);

			expect(msg1).to.equal("첫 번째 메시지");
			expect(msg2).to.equal("두 번째 메시지");
			expect(msg3).to.equal("세 번째 메시지");
		});

		it("개별 조회로 할일 목록", async function () {
			const { storage, user1 } = await loadFixture(deployStorageFixture);

			const baseKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("todos"));

			// 할일 5개 추가
			const todos = ["코딩하기", "운동하기", "공부하기", "청소하기", "쇼핑하기"];
			for (const todo of todos) {
				await storage.connect(user1).pushString(baseKey, todo);
			}

			// 전체 조회
			const length = await storage.connect(user1).getIndexedLength(baseKey);
			const allTodos = [];
			for (let i = 0; i < Number(length); i++) {
				const todo = await storage.connect(user1).getStringAt(baseKey, i);
				allTodos.push(todo);
			}

			console.log("\n📝 전체 할일:", allTodos);
			expect(allTodos.length).to.equal(5);
			expect(allTodos[0]).to.equal("코딩하기");

			// 최근 3개만 조회
			console.log("\n📝 최근 3개:");
			for (let i = 2; i < 5; i++) {
				const todo = await storage.connect(user1).getStringAt(baseKey, i);
				console.log(`  ${i + 1}. ${todo}`);
			}
		});
	});

	describe("3️⃣ 실전 예제 - 게임 점수 기록", function () {
		it("게임 점수를 계속 추가", async function () {
			const { storage, user1 } = await loadFixture(deployStorageFixture);

			const scoreKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("game:scores"));
			const levelKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("game:levels"));

			console.log("\n🎮 === 게임 플레이 기록 ===");

			// 게임 10판 플레이
			console.log("\n게임 진행:");
			const scores = [1200, 1500, 1800, 1350, 2000, 1700, 2100, 1900, 2300, 2500];
			const levels = [5, 6, 7, 6, 8, 7, 9, 8, 10, 11];

			for (let i = 0; i < 10; i++) {
				await storage.connect(user1).pushUint(scoreKey, scores[i]);
				await storage.connect(user1).pushUint(levelKey, levels[i]);
				console.log(`  ${i + 1}판: ${scores[i]}점 (레벨 ${levels[i]})`);
			}

			// 총 플레이 횟수
			const playCount = await storage.connect(user1).getIndexedLength(scoreKey);
			console.log("\n📊 총 플레이:", playCount.toString(), "판");
			expect(playCount).to.equal(10n);

			// 최근 5판 점수 조회 (개별)
			console.log("\n최근 5판 점수:");
			let maxScore = 0n;
			for (let i = 5; i < 10; i++) {
				const score = await storage.connect(user1).getUintAt(scoreKey, i);
				console.log(`  ${i + 1}판: ${score}`);
				if (score > maxScore) maxScore = score;
			}

			console.log("최근 최고 점수:", maxScore.toString());
			expect(maxScore).to.equal(2500n);
		});
	});

	describe("4️⃣ 실전 예제 - 채팅 메시지", function () {
		it("채팅 메시지 저장 및 조회", async function () {
			const { storage, user1 } = await loadFixture(deployStorageFixture);

			const msgKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("chat:messages"));
			const timeKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("chat:timestamps"));

			console.log("\n💬 === 채팅방 ===");

			// 메시지 5개 보내기
			const messages = [
				"안녕하세요!",
				"오늘 날씨 좋네요",
				"네 맞아요 ☀️",
				"점심 뭐 드셨어요?",
				"저는 김치찌개 먹었어요",
			];

			console.log("\n메시지 전송:");
			for (let i = 0; i < messages.length; i++) {
				const timestamp = Date.now() + i * 1000;
				await storage.connect(user1).pushString(msgKey, messages[i]);
				await storage.connect(user1).pushUint(timeKey, timestamp);
				console.log(`  ${i + 1}. ${messages[i]}`);
			}

			// 총 메시지 수
			const msgCount = await storage.connect(user1).getIndexedLength(msgKey);
			console.log("\n📊 총 메시지:", msgCount.toString(), "개");

			// 최근 3개 메시지 조회
			const length = Number(msgCount);
			console.log("\n최근 3개 메시지:");
			for (let i = length - 3; i < length; i++) {
				const msg = await storage.connect(user1).getStringAt(msgKey, i);
				console.log(`  ${i + 1}. ${msg}`);
			}

			const lastMsg = await storage.connect(user1).getStringAt(msgKey, length - 1);
			expect(lastMsg).to.equal("저는 김치찌개 먹었어요");
		});
	});

	describe("5️⃣ 실전 예제 - 거래 내역", function () {
		it("거래 내역 추적", async function () {
			const { storage, user1 } = await loadFixture(deployStorageFixture);

			const amountKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("tx:amounts"));
			const typeKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("tx:types"));
			const timeKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("tx:timestamps"));

			console.log("\n💰 === 거래 내역 ===");

			// 거래 기록
			const transactions = [
				{ amount: 50000, type: "입금", time: Date.now() },
				{ amount: 12000, type: "출금", time: Date.now() + 1000 },
				{ amount: 30000, type: "입금", time: Date.now() + 2000 },
				{ amount: 8000, type: "출금", time: Date.now() + 3000 },
				{ amount: 15000, type: "출금", time: Date.now() + 4000 },
			];

			console.log("\n거래 기록:");
			for (const tx of transactions) {
				await storage.connect(user1).pushUint(amountKey, tx.amount);
				await storage.connect(user1).pushString(typeKey, tx.type);
				await storage.connect(user1).pushUint(timeKey, tx.time);
				console.log(`  ${tx.type}: ${tx.amount.toLocaleString()}원`);
			}

			// 총 거래 수
			const txCount = await storage.connect(user1).getIndexedLength(amountKey);
			console.log("\n📊 총 거래:", txCount.toString(), "건");

			// 전체 거래 내역 조회
			console.log("\n전체 내역:");
			let totalDeposit = 0n;
			for (let i = 0; i < Number(txCount); i++) {
				const amount = await storage.connect(user1).getUintAt(amountKey, i);
				const type = await storage.connect(user1).getStringAt(typeKey, i);
				console.log(`  ${i + 1}. ${type}: ${Number(amount).toLocaleString()}원`);

				if (type === "입금") {
					totalDeposit += amount;
				}
			}

			console.log("\n💵 총 입금액:", Number(totalDeposit).toLocaleString(), "원");
			expect(totalDeposit).to.equal(80000n);
		});
	});

	describe("6️⃣ 사용자별 격리 확인", function () {
		it("각 사용자가 독립적인 리스트를 가짐", async function () {
			const { storage, user1, user2 } = await loadFixture(deployStorageFixture);

			const baseKey = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("myList"));

			console.log("\n👥 === 사용자별 데이터 ===");

			// User1: 1, 2, 3 추가
			await storage.connect(user1).pushUint(baseKey, 1);
			await storage.connect(user1).pushUint(baseKey, 2);
			await storage.connect(user1).pushUint(baseKey, 3);
			console.log("User1이 추가: 1, 2, 3");

			// User2: 10, 20 추가
			await storage.connect(user2).pushUint(baseKey, 10);
			await storage.connect(user2).pushUint(baseKey, 20);
			console.log("User2가 추가: 10, 20");

			// 각자 조회
			const user1Length = await storage.connect(user1).getIndexedLength(baseKey);
			const user2Length = await storage.connect(user2).getIndexedLength(baseKey);

			console.log("\nUser1 리스트 길이:", user1Length.toString());
			console.log("User2 리스트 길이:", user2Length.toString());

			expect(user1Length).to.equal(3n);
			expect(user2Length).to.equal(2n);

			// User1 데이터
			const user1Data = [];
			for (let i = 0; i < Number(user1Length); i++) {
				const val = await storage.connect(user1).getUintAt(baseKey, i);
				user1Data.push(val);
			}
			console.log(
				"User1 데이터:",
				user1Data.map((n) => n.toString())
			);
			expect(user1Data[0]).to.equal(1n);

			// User2 데이터
			const user2Data = [];
			for (let i = 0; i < Number(user2Length); i++) {
				const val = await storage.connect(user2).getUintAt(baseKey, i);
				user2Data.push(val);
			}
			console.log(
				"User2 데이터:",
				user2Data.map((n) => n.toString())
			);
			expect(user2Data[0]).to.equal(10n);
		});
	});

});
