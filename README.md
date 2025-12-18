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

### 테스트 파일 설명

- **test/SimpleUniversalStorage.test.js**
	- UniversalStorage 컨트랙트의 기본 동작(숫자/문자열 저장, 사용자별 데이터 격리, 배열 저장, 인덱스 방식 등)을 단계별로 검증합니다.
	- 다양한 데이터 타입 저장/조회, 여러 사용자 간 데이터 독립성, 배열 및 인덱스 기반 저장 방식의 차이와 효율성 등을 테스트합니다.

- **test/CarbonTracking.test.js**
	- UniversalStorage를 활용한 탄소배출 추적 시나리오를 테스트합니다.
	- 공정별/월별/총 배출량 기록, 히스토리 관리, 집계 및 시뮬레이션 등 실제 탄소 데이터 관리에 필요한 기능을 검증합니다.

### 배포 및 테스트

#### 1. 의존성 설치
```bash
npm install
```

#### 2. 테스트 실행

아래 순서대로 따라 하시면 됩니다.

1. 터미널(명령 프롬프트, PowerShell 등)을 엽니다.
2. 프로젝트 폴더(이 README가 있는 폴더)로 이동합니다.
	예시:
	```bash
	cd c:/dev/universal-contract
	```
3. 아래 명령어로 테스트를 실행합니다.
	```bash
	npx hardhat test
	```
	- `npx hardhat test` 명령어는 test 폴더에 있는 모든 테스트 파일을 자동으로 실행합니다.
	- 테스트 결과가 터미널에 출력됩니다.

만약 Node.js와 npm이 설치되어 있지 않다면, [Node.js 공식 홈페이지](https://nodejs.org/)에서 설치 후 위 과정을 진행하세요.

#### 3. 배포 예시
```bash
npx hardhat run scripts/deploy.js --network <network>
```

### 스크립트 실행 방법 (carbon-tracking.js)

이 프로젝트에는 탄소배출 데이터 입력 및 분석을 자동화하는 스크립트가 포함되어 있습니다.

#### 실행 방법
1. 터미널(명령 프롬프트, PowerShell 등)을 엽니다.
2. 프로젝트 폴더(이 README가 있는 폴더)로 이동합니다.
	예시:
	```bash
	cd c:/dev/universal-contract
	```
3. 아래 명령어로 스크립트를 실행합니다.
	```bash
	npx hardhat run scripts/carbon-tracking.js
	```
	- 이 명령어는 UniversalStorage 컨트랙트를 배포하고, 샘플 탄소배출 데이터를 입력한 뒤, 다양한 통계와 분석 결과를 콘솔에 출력합니다.
	- 별도의 네트워크를 지정하지 않으면 Hardhat의 내장 로컬 네트워크에서 실행됩니다.

#### 참고
- Node.js와 npm이 설치되어 있어야 하며, 의존성 설치는 `npm install`로 진행합니다.
- 스크립트 실행 시 블록체인 네트워크가 자동으로 시작되고, 모든 데이터는 임시 네트워크에 저장됩니다.
- 실제 네트워크(예: testnet, mainnet)에 배포하려면 `--network <network>` 옵션을 추가하세요.
  예시:
  ```bash
  npx hardhat run scripts/carbon-tracking.js --network goerli
  ```

### 사용 예시

Solidity에서:
```solidity
UniversalStorage storage = UniversalStorage(address);
storage.setUint("myKey", 123);
uint value = storage.getUint("myKey");
```
