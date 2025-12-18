# Sample Hardhat Project

## UniversalStorage

Solidity로 작성된 범용 Key-Value 저장 스마트 컨트랙트입니다. 다양한 타입의 값을 키에 매핑하여 저장/조회할 수 있습니다.

### 주요 기능
- 다양한 데이터 타입(uint, int, address, bool, bytes, string) 저장 및 조회
- 키 기반 데이터 관리
- 범용적 활용 가능

### 파일 구조
- contracts/UniversalStorage.sol: 스마트 컨트랙트 소스
- test/SimpleUniversalStorage.test.js: 컨트랙트 테스트 코드

### 배포 및 테스트

#### 1. 의존성 설치
```bash
npm install
```

#### 2. 테스트 실행
```bash
npx hardhat test
```

#### 3. 배포 예시
```bash
npx hardhat run scripts/deploy.js --network <network>
```

### 사용 예시

Solidity에서:
```solidity
UniversalStorage storage = UniversalStorage(address);
storage.setUint("myKey", 123);
uint value = storage.getUint("myKey");
```
