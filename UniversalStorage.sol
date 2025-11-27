// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UniversalStorage
 * @notice 배열 배치 추가(append) 기능 포함
 */
contract UniversalStorage {
    
    // 사용자별 데이터 저장소
    mapping(address => mapping(bytes32 => bytes)) private userStorage;
    
    // 이벤트
    event DataStored(address indexed user, bytes32 indexed key, uint256 dataSize);
    event DataDeleted(address indexed user, bytes32 indexed key);
    event ArrayAppended(address indexed user, bytes32 indexed key, uint256 addedCount, uint256 newLength);
    
    // ============ 기본 함수 ============
    
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
    
    function getFrom(address user, bytes32 key) external view returns (bytes memory) {
        return userStorage[user][key];
    }
    
    // ============ 배치 작업 ============
    
    function batchSet(bytes32[] calldata keys, bytes[] calldata values) external {
        require(keys.length == values.length, "Length mismatch");
        for (uint256 i = 0; i < keys.length; i++) {
            userStorage[msg.sender][keys[i]] = values[i];
            emit DataStored(msg.sender, keys[i], values[i].length);
        }
    }
    
    function batchGet(bytes32[] calldata keys) external view returns (bytes[] memory) {
        bytes[] memory results = new bytes[](keys.length);
        for (uint256 i = 0; i < keys.length; i++) {
            results[i] = userStorage[msg.sender][keys[i]];
        }
        return results;
    }
    
    // ============ uint256 ============
    
    function setUint(bytes32 key, uint256 value) external {
        userStorage[msg.sender][key] = abi.encode(value);
        emit DataStored(msg.sender, key, 32);
    }
    
    function getUint(bytes32 key) external view returns (uint256) {
        bytes memory data = userStorage[msg.sender][key];
        if (data.length == 0) return 0;
        return abi.decode(data, (uint256));
    }
    
    // ============ int256 ============
    
    function setInt(bytes32 key, int256 value) external {
        userStorage[msg.sender][key] = abi.encode(value);
        emit DataStored(msg.sender, key, 32);
    }
    
    function getInt(bytes32 key) external view returns (int256) {
        bytes memory data = userStorage[msg.sender][key];
        if (data.length == 0) return 0;
        return abi.decode(data, (int256));
    }
    
    // ============ bool ============
    
    function setBool(bytes32 key, bool value) external {
        userStorage[msg.sender][key] = abi.encode(value);
        emit DataStored(msg.sender, key, 1);
    }
    
    function getBool(bytes32 key) external view returns (bool) {
        bytes memory data = userStorage[msg.sender][key];
        if (data.length == 0) return false;
        return abi.decode(data, (bool));
    }
    
    // ============ address ============
    
    function setAddress(bytes32 key, address value) external {
        userStorage[msg.sender][key] = abi.encode(value);
        emit DataStored(msg.sender, key, 20);
    }
    
    function getAddress(bytes32 key) external view returns (address) {
        bytes memory data = userStorage[msg.sender][key];
        if (data.length == 0) return address(0);
        return abi.decode(data, (address));
    }
    
    // ============ string ============
    
    function setString(bytes32 key, string calldata value) external {
        userStorage[msg.sender][key] = abi.encode(value);
        emit DataStored(msg.sender, key, bytes(value).length);
    }
    
    function getString(bytes32 key) external view returns (string memory) {
        bytes memory data = userStorage[msg.sender][key];
        if (data.length == 0) return "";
        return abi.decode(data, (string));
    }
    
    // ============ bytes ============
    
    function setBytes(bytes32 key, bytes calldata value) external {
        userStorage[msg.sender][key] = abi.encode(value);
        emit DataStored(msg.sender, key, value.length);
    }
    
    function getBytes(bytes32 key) external view returns (bytes memory) {
        bytes memory data = userStorage[msg.sender][key];
        if (data.length == 0) return "";
        return abi.decode(data, (bytes));
    }
    
    // ============ 배열 타입 ============
    
    function setUintArray(bytes32 key, uint256[] calldata value) external {
        userStorage[msg.sender][key] = abi.encode(value);
        emit DataStored(msg.sender, key, value.length * 32);
    }
    
    function getUintArray(bytes32 key) external view returns (uint256[] memory) {
        bytes memory data = userStorage[msg.sender][key];
        if (data.length == 0) return new uint256[](0);
        return abi.decode(data, (uint256[]));
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
    
    function setStringArray(bytes32 key, string[] calldata value) external {
        userStorage[msg.sender][key] = abi.encode(value);
        emit DataStored(msg.sender, key, value.length);
    }
    
    function getStringArray(bytes32 key) external view returns (string[] memory) {
        bytes memory data = userStorage[msg.sender][key];
        if (data.length == 0) return new string[](0);
        return abi.decode(data, (string[]));
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
    
    // ============ 배열 Append 함수 (배치) ============
    
    function appendUintArray(bytes32 key, uint256[] calldata newValues) external {
        require(newValues.length > 0, "Empty array");
        
        bytes memory data = userStorage[msg.sender][key];
        uint256[] memory result;
        
        if (data.length == 0) {
            result = newValues;
        } else {
            uint256[] memory oldArr = abi.decode(data, (uint256[]));
            result = new uint256[](oldArr.length + newValues.length);
            
            for (uint i = 0; i < oldArr.length; i++) {
                result[i] = oldArr[i];
            }
            for (uint i = 0; i < newValues.length; i++) {
                result[oldArr.length + i] = newValues[i];
            }
        }
        
        userStorage[msg.sender][key] = abi.encode(result);
        emit ArrayAppended(msg.sender, key, newValues.length, result.length);
    }
    
    function appendIntArray(bytes32 key, int256[] calldata newValues) external {
        require(newValues.length > 0, "Empty array");
        
        bytes memory data = userStorage[msg.sender][key];
        int256[] memory result;
        
        if (data.length == 0) {
            result = newValues;
        } else {
            int256[] memory oldArr = abi.decode(data, (int256[]));
            result = new int256[](oldArr.length + newValues.length);
            
            for (uint i = 0; i < oldArr.length; i++) {
                result[i] = oldArr[i];
            }
            for (uint i = 0; i < newValues.length; i++) {
                result[oldArr.length + i] = newValues[i];
            }
        }
        
        userStorage[msg.sender][key] = abi.encode(result);
        emit ArrayAppended(msg.sender, key, newValues.length, result.length);
    }
    
    function appendAddressArray(bytes32 key, address[] calldata newValues) external {
        require(newValues.length > 0, "Empty array");
        
        bytes memory data = userStorage[msg.sender][key];
        address[] memory result;
        
        if (data.length == 0) {
            result = newValues;
        } else {
            address[] memory oldArr = abi.decode(data, (address[]));
            result = new address[](oldArr.length + newValues.length);
            
            for (uint i = 0; i < oldArr.length; i++) {
                result[i] = oldArr[i];
            }
            for (uint i = 0; i < newValues.length; i++) {
                result[oldArr.length + i] = newValues[i];
            }
        }
        
        userStorage[msg.sender][key] = abi.encode(result);
        emit ArrayAppended(msg.sender, key, newValues.length, result.length);
    }
    
    function appendStringArray(bytes32 key, string[] calldata newValues) external {
        require(newValues.length > 0, "Empty array");
        
        bytes memory data = userStorage[msg.sender][key];
        string[] memory result;
        
        if (data.length == 0) {
            result = newValues;
        } else {
            string[] memory oldArr = abi.decode(data, (string[]));
            result = new string[](oldArr.length + newValues.length);
            
            for (uint i = 0; i < oldArr.length; i++) {
                result[i] = oldArr[i];
            }
            for (uint i = 0; i < newValues.length; i++) {
                result[oldArr.length + i] = newValues[i];
            }
        }
        
        userStorage[msg.sender][key] = abi.encode(result);
        emit ArrayAppended(msg.sender, key, newValues.length, result.length);
    }
    
    function appendBoolArray(bytes32 key, bool[] calldata newValues) external {
        require(newValues.length > 0, "Empty array");
        
        bytes memory data = userStorage[msg.sender][key];
        bool[] memory result;
        
        if (data.length == 0) {
            result = newValues;
        } else {
            bool[] memory oldArr = abi.decode(data, (bool[]));
            result = new bool[](oldArr.length + newValues.length);
            
            for (uint i = 0; i < oldArr.length; i++) {
                result[i] = oldArr[i];
            }
            for (uint i = 0; i < newValues.length; i++) {
                result[oldArr.length + i] = newValues[i];
            }
        }
        
        userStorage[msg.sender][key] = abi.encode(result);
        emit ArrayAppended(msg.sender, key, newValues.length, result.length);
    }
    
    // ============ 배열 길이 조회 ============
    
    function getUintArrayLength(bytes32 key) external view returns (uint256) {
        bytes memory data = userStorage[msg.sender][key];
        if (data.length == 0) return 0;
        uint256[] memory arr = abi.decode(data, (uint256[]));
        return arr.length;
    }
    
    function getIntArrayLength(bytes32 key) external view returns (uint256) {
        bytes memory data = userStorage[msg.sender][key];
        if (data.length == 0) return 0;
        int256[] memory arr = abi.decode(data, (int256[]));
        return arr.length;
    }
    
    function getAddressArrayLength(bytes32 key) external view returns (uint256) {
        bytes memory data = userStorage[msg.sender][key];
        if (data.length == 0) return 0;
        address[] memory arr = abi.decode(data, (address[]));
        return arr.length;
    }
    
    function getStringArrayLength(bytes32 key) external view returns (uint256) {
        bytes memory data = userStorage[msg.sender][key];
        if (data.length == 0) return 0;
        string[] memory arr = abi.decode(data, (string[]));
        return arr.length;
    }
    
    function getBoolArrayLength(bytes32 key) external view returns (uint256) {
        bytes memory data = userStorage[msg.sender][key];
        if (data.length == 0) return 0;
        bool[] memory arr = abi.decode(data, (bool[]));
        return arr.length;
    }
}
