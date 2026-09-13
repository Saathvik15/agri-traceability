// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgriTraceability {
    struct Batch {
        string batchId;
        string cropName;
        string farmOrigin;
        uint256 harvestTimestamp;
        address farmer;
        bool exists;
    }

    struct SupplyChainEvent {
        uint256 timestamp;
        string location;
        string status;
        address actor;
        string notes;
    }

    mapping(string => Batch) private batches;
    mapping(string => SupplyChainEvent[]) private batchEvents;
    string[] private batchIds;

    event BatchCreated(string indexed batchId, string cropName, address indexed farmer);
    event EventAdded(string indexed batchId, string status, address indexed actor);

    function createBatch(
        string memory _batchId,
        string memory _cropName,
        string memory _farmOrigin
    ) external {
        require(!batches[_batchId].exists, "Batch ID already registered");

        batches[_batchId] = Batch({
            batchId: _batchId,
            cropName: _cropName,
            farmOrigin: _farmOrigin,
            harvestTimestamp: block.timestamp,
            farmer: msg.sender,
            exists: true
        });

        batchIds.push(_batchId);

        // Record initial harvest event automatically
        batchEvents[_batchId].push(SupplyChainEvent({
            timestamp: block.timestamp,
            location: _farmOrigin,
            status: "Harvested",
            actor: msg.sender,
            notes: "Initial on-chain registration"
        }));

        emit BatchCreated(_batchId, _cropName, msg.sender);
    }

    function addEvent(
        string memory _batchId,
        string memory _location,
        string memory _status,
        string memory _notes
    ) external {
        require(batches[_batchId].exists, "Batch does not exist");

        batchEvents[_batchId].push(SupplyChainEvent({
            timestamp: block.timestamp,
            location: _location,
            status: _status,
            actor: msg.sender,
            notes: _notes
        }));

        emit EventAdded(_batchId, _status, msg.sender);
    }

    function getBatch(string memory _batchId) external view returns (Batch memory) {
        require(batches[_batchId].exists, "Batch not found");
        return batches[_batchId];
    }

    function getBatchEvents(string memory _batchId) external view returns (SupplyChainEvent[] memory) {
        require(batches[_batchId].exists, "Batch not found");
        return batchEvents[_batchId];
    }

    function getAllBatchIds() external view returns (string[] memory) {
        return batchIds;
    }
}