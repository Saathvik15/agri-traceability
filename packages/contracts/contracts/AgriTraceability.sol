// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgriTraceability {
    struct Batch {
        string batchId;
        string cropName;
        string farmOrigin;
        uint256 harvestTimestamp;
        address farmer;
        uint256 price; // farm-gate price, recorded at registration
        uint256 quantityGrams; // harvested quantity, in grams (supports decimal kg)
        bool exists;
    }

    struct SupplyChainEvent {
        uint256 timestamp;
        string location;
        string status;
        address actor;
        string notes;
        uint256 price; // price recorded at this stage (0 if not applicable)
    }

    mapping(string => Batch) private batches;
    mapping(string => SupplyChainEvent[]) private batchEvents;
    string[] private batchIds;

    event BatchCreated(string indexed batchId, string cropName, address indexed farmer, uint256 price, uint256 quantityGrams);
    event EventAdded(string indexed batchId, string status, address indexed actor, uint256 price);

    function createBatch(
        string memory _batchId,
        string memory _cropName,
        string memory _farmOrigin,
        uint256 _price,
        uint256 _quantityGrams
    ) external {
        require(!batches[_batchId].exists, "Batch ID already registered");

        batches[_batchId] = Batch({
            batchId: _batchId,
            cropName: _cropName,
            farmOrigin: _farmOrigin,
            harvestTimestamp: block.timestamp,
            farmer: msg.sender,
            price: _price,
            quantityGrams: _quantityGrams,
            exists: true
        });

        batchIds.push(_batchId);

        // Record initial harvest event automatically, including farm-gate price
        batchEvents[_batchId].push(SupplyChainEvent({
            timestamp: block.timestamp,
            location: _farmOrigin,
            status: "Harvested",
            actor: msg.sender,
            notes: "Initial on-chain registration",
            price: _price
        }));

        emit BatchCreated(_batchId, _cropName, msg.sender, _price, _quantityGrams);
    }

    function addEvent(
        string memory _batchId,
        string memory _location,
        string memory _status,
        string memory _notes,
        uint256 _price
    ) external {
        require(batches[_batchId].exists, "Batch does not exist");

        batchEvents[_batchId].push(SupplyChainEvent({
            timestamp: block.timestamp,
            location: _location,
            status: _status,
            actor: msg.sender,
            notes: _notes,
            price: _price
        }));

        emit EventAdded(_batchId, _status, msg.sender, _price);
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
