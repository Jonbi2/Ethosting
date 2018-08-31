pragma solidity ^0.4.24;

contract FilETHosting {
    
    constructor() public {
        bytes[] memory b;
        files.push(File("", 0, 0, b));
    }
    
    struct File {
        string fileId;
        address owner;
        uint256 finalizedInBlock;
        bytes[] data;
    }
    
    function hashCompareWithLengthCheck(string a, string b) pure internal returns (bool) {
        if(bytes(a).length != bytes(b).length) {
            return false;
        } else {
            return keccak256(bytes(a)) == keccak256(bytes(b));
        }
    }
    
    File[] public files;
    mapping(bytes32 => uint) public indexes;
    
    function getFileCount() view external returns (uint) {
        return files.length;
    }
    
    function getFileIndex(string _fileId) view external returns (uint) {
        return indexes[keccak256(bytes(_fileId))];
    }
    
    function getChunk(uint _fileIndex, uint _chunkIndex) view external returns (bytes) {
        return files[_fileIndex].data[_chunkIndex];
    }
    
    function getChunkCount(uint _fileIndex) view external returns (uint) {
        return files[_fileIndex].data.length;
    }
    
    function uploadNewFile(string _fileId, bytes _data, bool _finalize) external returns (uint) {
        bytes32 _fileIdHash = keccak256(bytes(_fileId));
        require(
            !hashCompareWithLengthCheck(
                files[indexes[_fileIdHash]].fileId,
                _fileId
            )
        );
        bytes[] memory b;
        files.push(File(_fileId, msg.sender, 0, b));
        indexes[_fileIdHash] = files.length - 1;
        files[files.length - 1].data.push(_data);
        if(_finalize) files[files.length - 1].finalizedInBlock = block.number;
        return files.length - 1;
    }
    
    function uploadChunk(uint _fileIndex, bytes _data, bool _finalize) external {
        require(_fileIndex < files.length);
        require(files[_fileIndex].finalizedInBlock == 0);
        require(files[_fileIndex].owner == msg.sender);
        files[_fileIndex].data.push(_data);
        if(_finalize) files[_fileIndex].finalizedInBlock = block.number;
    }
    
}
