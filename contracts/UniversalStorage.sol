// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UniversalStorage
 * @notice General-purpose key-value storage contract
 * @dev Provides per-user namespaces and supports multiple data types
 */
contract UniversalStorage {
    mapping(address => mapping(bytes32 => bytes)) private userStorage;
    uint256 private constant MAX_BATCH_SIZE = 50;

    event DataStored(address indexed user, bytes32 indexed key, uint256 dataSize);
    event DataDeleted(address indexed user, bytes32 indexed key);
    event ArrayAppended(address indexed user, bytes32 indexed key, uint256 addedCount, uint256 newLength);
    event IndexedDataAdded(address indexed user, bytes32 indexed baseKey, uint256 index);

    error LengthMismatch(uint256 keysLength, uint256 valuesLength);
    error BatchTooLarge(uint256 provided, uint256 max);
    error EmptyArray();

    // ============ Basic ============
    function set(bytes32 key, bytes calldata value) external {
        userStorage[msg.sender][key] = value;
        emit DataStored(msg.sender, key, value.length);
    }

    function get(bytes32 key) external view returns (bytes memory) {
        return userStorage[msg.sender][key];
    }

    function remove(bytes32 key) external {
        delete userStorage[msg.sender][key];
        emit DataDeleted(msg.sender, key);
    }

    // ============ Batch ops ============
    function batchSet(bytes32[] calldata keys, bytes[] calldata values) external {
        uint256 len = keys.length;
        if (len != values.length) revert LengthMismatch(len, values.length);
        if (len > MAX_BATCH_SIZE) revert BatchTooLarge(len, MAX_BATCH_SIZE);
        
        for (uint256 i; i < len;) {
            userStorage[msg.sender][keys[i]] = values[i];
            emit DataStored(msg.sender, keys[i], values[i].length);
            unchecked { ++i; }
        }
    }

    function batchGet(bytes32[] calldata keys) external view returns (bytes[] memory) {
        uint256 len = keys.length;
        if (len > MAX_BATCH_SIZE) revert BatchTooLarge(len, MAX_BATCH_SIZE);
        
        bytes[] memory results = new bytes[](len);
        for (uint256 i; i < len;) {
            results[i] = userStorage[msg.sender][keys[i]];
            unchecked { ++i; }
        }
        return results;
    }

    function batchRemove(bytes32[] calldata keys) external {
        uint256 len = keys.length;
        if (len > MAX_BATCH_SIZE) revert BatchTooLarge(len, MAX_BATCH_SIZE);
        
        for (uint256 i; i < len;) {
            delete userStorage[msg.sender][keys[i]];
            emit DataDeleted(msg.sender, keys[i]);
            unchecked { ++i; }
        }
    }

    // ============ 기본 타입 ============
    function setUint(bytes32 key, uint256 value) external {
        userStorage[msg.sender][key] = abi.encode(value);
        emit DataStored(msg.sender, key, 32);
    }

    function getUint(bytes32 key) external view returns (uint256) {
        bytes memory data = userStorage[msg.sender][key];
        if (data.length == 0) return 0;
        return abi.decode(data, (uint256));
    }

    function setInt(bytes32 key, int256 value) external {
        userStorage[msg.sender][key] = abi.encode(value);
        emit DataStored(msg.sender, key, 32);
    }

    function getInt(bytes32 key) external view returns (int256) {
        bytes memory data = userStorage[msg.sender][key];
        if (data.length == 0) return 0;
        return abi.decode(data, (int256));
    }

    function setString(bytes32 key, string calldata value) external {
        userStorage[msg.sender][key] = bytes(value);
        emit DataStored(msg.sender, key, bytes(value).length);
    }

    function getString(bytes32 key) external view returns (string memory) {
        return string(userStorage[msg.sender][key]);
    }

    function setAddress(bytes32 key, address value) external {
        userStorage[msg.sender][key] = abi.encode(value);
        emit DataStored(msg.sender, key, 20);
    }

    function getAddress(bytes32 key) external view returns (address) {
        bytes memory data = userStorage[msg.sender][key];
        if (data.length == 0) return address(0);
        return abi.decode(data, (address));
    }

    function setBool(bytes32 key, bool value) external {
        userStorage[msg.sender][key] = abi.encode(value);
        emit DataStored(msg.sender, key, 1);
    }

    function getBool(bytes32 key) external view returns (bool) {
        bytes memory data = userStorage[msg.sender][key];
        if (data.length == 0) return false;
        return abi.decode(data, (bool));
    }

    function setBytes(bytes32 key, bytes calldata value) external {
        userStorage[msg.sender][key] = value;
        emit DataStored(msg.sender, key, value.length);
    }

    function getBytes(bytes32 key) external view returns (bytes memory) {
        return userStorage[msg.sender][key];
    }

    // ============ 배열 타입 (작은 배열용) 설정값이 거의 안 바뀜, 자주 읽는 경우에 사용 ============
    function setUintArray(bytes32 key, uint256[] calldata value) external {
        userStorage[msg.sender][key] = abi.encode(value);
        emit DataStored(msg.sender, key, value.length * 32);
    }

    function getUintArray(bytes32 key) external view returns (uint256[] memory) {
        bytes memory data = userStorage[msg.sender][key];
        if (data.length == 0) return new uint256[](0);
        return abi.decode(data, (uint256[]));
    }

    function appendUintArray(bytes32 key, uint256[] calldata newValues) external {
        if (newValues.length == 0) revert EmptyArray();
        bytes memory data = userStorage[msg.sender][key];
        uint256[] memory result;
        
        if (data.length == 0) {
            result = newValues;
        } else {
            uint256[] memory oldArr = abi.decode(data, (uint256[]));
            result = new uint256[](oldArr.length + newValues.length);
            
            uint256 i;
            for (; i < oldArr.length;) {
                result[i] = oldArr[i];
                unchecked { ++i; }
            }
            for (uint256 j; j < newValues.length;) {
                result[i + j] = newValues[j];
                unchecked { ++j; }
            }
        }
        
        userStorage[msg.sender][key] = abi.encode(result);
        emit ArrayAppended(msg.sender, key, newValues.length, result.length);
    }

    function getUintArrayLength(bytes32 key) external view returns (uint256) {
        bytes memory data = userStorage[msg.sender][key];
        if (data.length == 0) return 0;
        return abi.decode(data, (uint256[])).length;
    }

    function setIntArray(bytes32 key, int256[] calldata value) external {
        userStorage[msg.sender][key] = abi.encode(value);
        emit DataStored(msg.sender, key, value.length * 32);
    }

    function getIntArray(bytes32 key) external view returns (int256[] memory) {
        bytes memory data = userStorage[msg.sender][key];
        if (data.length == 0) return new int256[](0);
        return abi.decode(data, (int256[]));
    }

    function setAddressArray(bytes32 key, address[] calldata value) external {
        userStorage[msg.sender][key] = abi.encode(value);
        emit DataStored(msg.sender, key, value.length * 20);
    }

    function getAddressArray(bytes32 key) external view returns (address[] memory) {
        bytes memory data = userStorage[msg.sender][key];
        if (data.length == 0) return new address[](0);
        return abi.decode(data, (address[]));
    }

    function appendAddressArray(bytes32 key, address[] calldata newValues) external {
        if (newValues.length == 0) revert EmptyArray();
        bytes memory data = userStorage[msg.sender][key];
        address[] memory result;
        
        if (data.length == 0) {
            result = newValues;
        } else {
            address[] memory oldArr = abi.decode(data, (address[]));
            result = new address[](oldArr.length + newValues.length);
            
            uint256 i;
            for (; i < oldArr.length;) {
                result[i] = oldArr[i];
                unchecked { ++i; }
            }
            for (uint256 j; j < newValues.length;) {
                result[i + j] = newValues[j];
                unchecked { ++j; }
            }
        }
        
        userStorage[msg.sender][key] = abi.encode(result);
        emit ArrayAppended(msg.sender, key, newValues.length, result.length);
    }

    function setStringArray(bytes32 key, string[] calldata value) external {
        userStorage[msg.sender][key] = abi.encode(value);
        emit DataStored(msg.sender, key, value.length);
    }

    function getStringArray(bytes32 key) external view returns (string[] memory) {
        bytes memory data = userStorage[msg.sender][key];
        if (data.length == 0) return new string[](0);
        return abi.decode(data, (string[]));
    }

    function appendStringArray(bytes32 key, string[] calldata newValues) external {
        if (newValues.length == 0) revert EmptyArray();
        bytes memory data = userStorage[msg.sender][key];
        string[] memory result;
        
        if (data.length == 0) {
            result = newValues;
        } else {
            string[] memory oldArr = abi.decode(data, (string[]));
            result = new string[](oldArr.length + newValues.length);
            
            uint256 i;
            for (; i < oldArr.length;) {
                result[i] = oldArr[i];
                unchecked { ++i; }
            }
            for (uint256 j; j < newValues.length;) {
                result[i + j] = newValues[j];
                unchecked { ++j; }
            }
        }
        
        userStorage[msg.sender][key] = abi.encode(result);
        emit ArrayAppended(msg.sender, key, newValues.length, result.length);
    }

    function setBoolArray(bytes32 key, bool[] calldata value) external {
        userStorage[msg.sender][key] = abi.encode(value);
        emit DataStored(msg.sender, key, value.length);
    }

    function getBoolArray(bytes32 key) external view returns (bool[] memory) {
        bytes memory data = userStorage[msg.sender][key];
        if (data.length == 0) return new bool[](0);
        return abi.decode(data, (bool[]));
    }

    // ============ 인덱스 기반 저장, 계속 추가되는 데이터 (히스토리/로그용) ============
    
        /**
     * @notice 인덱스 기반으로 uint256 추가 (가스 효율적)
     */
    function pushUint(bytes32 baseKey, uint256 value) external returns (uint256) {
        // 길이 키 생성
        bytes32 lengthKey = keccak256(abi.encodePacked(baseKey, ":length"));
        
        // 현재 길이 읽기 (빈 값이면 0)
        bytes memory lengthData = userStorage[msg.sender][lengthKey];
        uint256 currentLength = 0;
        if (lengthData.length > 0) {
            currentLength = abi.decode(lengthData, (uint256));
        }
        
        // 새 인덱스는 현재 길이와 같음 (0부터 시작)
        uint256 newIndex = currentLength;
        
        // 인덱스 키 생성
        bytes32 indexKey = keccak256(abi.encodePacked(baseKey, ":", newIndex));
        
        // 값 저장
        userStorage[msg.sender][indexKey] = abi.encode(value);
        
        // 길이 증가
        userStorage[msg.sender][lengthKey] = abi.encode(currentLength + 1);
        
        emit IndexedDataAdded(msg.sender, baseKey, newIndex);
        
        return newIndex;
    }

    /**
     * @notice 인덱스 기반으로 string 추가
     */
    function pushString(bytes32 baseKey, string calldata value) external returns (uint256) {
        // 길이 키 생성
        bytes32 lengthKey = keccak256(abi.encodePacked(baseKey, ":length"));
        
        // 현재 길이 읽기 (빈 값이면 0)
        bytes memory lengthData = userStorage[msg.sender][lengthKey];
        uint256 currentLength = 0;
        if (lengthData.length > 0) {
            currentLength = abi.decode(lengthData, (uint256));
        }
        
        // 새 인덱스는 현재 길이와 같음
        uint256 newIndex = currentLength;
        
        // 인덱스 키 생성
        bytes32 indexKey = keccak256(abi.encodePacked(baseKey, ":", newIndex));
        
        // 값 저장
        userStorage[msg.sender][indexKey] = bytes(value);
        
        // 길이 증가
        userStorage[msg.sender][lengthKey] = abi.encode(currentLength + 1);
        
        emit IndexedDataAdded(msg.sender, baseKey, newIndex);
        
        return newIndex;
    }
    /**
     * @notice 특정 인덱스의 uint256 값 조회
     */
    function getUintAt(bytes32 baseKey, uint256 index) external view returns (uint256) {
        bytes32 indexKey = keccak256(abi.encodePacked(baseKey, ":", index));
        bytes memory data = userStorage[msg.sender][indexKey];
        if (data.length == 0) return 0;
        return abi.decode(data, (uint256));
    }

    /**
     * @notice 특정 인덱스의 string 값 조회
     */
    function getStringAt(bytes32 baseKey, uint256 index) external view returns (string memory) {
        bytes32 indexKey = keccak256(abi.encodePacked(baseKey, ":", index));
        return string(userStorage[msg.sender][indexKey]);
    }

    /**
     * @notice 인덱스 기반 배열의 길이 조회
     */
    function getIndexedLength(bytes32 baseKey) external view returns (uint256) {
        bytes32 lengthKey = keccak256(abi.encodePacked(baseKey, ":length"));
        bytes memory data = userStorage[msg.sender][lengthKey];
        if (data.length == 0) return 0;
        return abi.decode(data, (uint256));
    }


    // ============ Utility ============
    function exists(bytes32 key) external view returns (bool) {
        return userStorage[msg.sender][key].length > 0;
    }

    function getDataSize(bytes32 key) external view returns (uint256) {
        return userStorage[msg.sender][key].length;
    }
}