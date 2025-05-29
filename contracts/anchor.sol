// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Anchor {
    mapping(bytes32 => bool) public anchoredHashes;

    event HashAnchored(bytes32 indexed hash, address indexed issuer, uint256 timestamp);

    function storeHash(bytes32 hash) public {
        require(!anchoredHashes[hash], "Already anchored");
        anchoredHashes[hash] = true;
        emit HashAnchored(hash, msg.sender, block.timestamp);
    }

    function isAnchored(bytes32 hash) public view returns (bool) {
        return anchoredHashes[hash];
    }
}
