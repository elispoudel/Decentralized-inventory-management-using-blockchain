// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SupplyChain {
    // Smart contract owner can authorize roles and manage critical inventory adjustments.
    address public Owner;

    constructor() {
        Owner = msg.sender;
    }

    modifier onlyByOwner() {
        require(msg.sender == Owner, "Only owner");
        _;
    }

    modifier validMedicine(uint256 _medicineID) {
        require(_medicineID > 0 && _medicineID <= medicineCtr, "Invalid medicine id");
        _;
    }

    modifier validBatch(uint256 _batchID) {
        require(_batchID > 0 && _batchID <= batchCtr && BatchStock[_batchID].exists, "Invalid batch id");
        _;
    }

    modifier onlyAuthorizedOperator() {
        require(msg.sender == Owner || _isRegisteredParticipant(msg.sender), "Not authorized");
        _;
    }

    // Stages of a medicine in pharma supply chain.
    enum STAGE {
        Init,
        RawMaterialSupply,
        Manufacture,
        Distribution,
        Retail,
        sold
    }

    // Inventory transaction types.
    enum InventoryAction {
        Receive,
        Issue,
        Transfer,
        Adjust
    }

    // Counters.
    uint256 public medicineCtr = 0;
    uint256 public rmsCtr = 0;
    uint256 public manCtr = 0;
    uint256 public disCtr = 0;
    uint256 public retCtr = 0;
    uint256 public batchCtr = 0;
    uint256 public inventoryTxCtr = 0;

    // Core medicine record.
    struct medicine {
        uint256 id;
        string name;
        string description;
        uint256 RMSid;
        uint256 MANid;
        uint256 DISid;
        uint256 RETid;
        STAGE stage;
    }

    // Batch/lot metadata and totals.
    struct batchInfo {
        uint256 id;
        uint256 medicineId;
        string batchNumber;
        string supplierBatchRef;
        uint256 mfgDate;
        uint256 expiryDate;
        uint256 totalReceived;
        uint256 totalIssued;
        uint256 createdAt;
        bool exists;
    }

    // Immutable-style inventory transaction record.
    struct inventoryTransaction {
        uint256 id;
        uint256 medicineId;
        uint256 batchId;
        InventoryAction action;
        uint256 quantity;
        address fromAddr;
        address toAddr;
        int256 signedDelta;
        string refNote;
        uint256 timestamp;
    }

    // To store information about raw material supplier.
    struct rawMaterialSupplier {
        address addr;
        uint256 id;
        string name;
        string place;
    }

    // To store information about manufacturer.
    struct manufacturer {
        address addr;
        uint256 id;
        string name;
        string place;
    }

    // To store information about distributor.
    struct distributor {
        address addr;
        uint256 id;
        string name;
        string place;
    }

    // To store information about retailer.
    struct retailer {
        address addr;
        uint256 id;
        string name;
        string place;
    }

    // Primary storage.
    mapping(uint256 => medicine) public MedicineStock;
    mapping(uint256 => rawMaterialSupplier) public RMS;
    mapping(uint256 => manufacturer) public MAN;
    mapping(uint256 => distributor) public DIS;
    mapping(uint256 => retailer) public RET;

    mapping(uint256 => batchInfo) public BatchStock;
    mapping(uint256 => inventoryTransaction) public InventoryTx;

    // Medicine total inventory (all holders combined).
    mapping(uint256 => uint256) public medicineInventory;
    // Batch quantity per holder (warehouse/account based address).
    mapping(uint256 => mapping(address => uint256)) public batchBalanceByHolder;
    // Batch ids linked to medicine id.
    mapping(uint256 => uint256[]) private medicineBatchIds;

    // Order + tracking timestamps for each medicine.
    mapping(uint256 => uint256) public medicineCreatedAt;
    mapping(uint256 => uint256) public medicineLastUpdatedAt;
    mapping(uint256 => mapping(uint8 => uint256)) public medicineStageAt;

    event MedicineOrdered(
        uint256 indexed medicineId,
        string name,
        uint256 timestamp,
        address indexed actor
    );

    event MedicineStageUpdated(
        uint256 indexed medicineId,
        uint8 fromStage,
        uint8 toStage,
        uint256 timestamp,
        address indexed actor
    );

    event BatchCreated(
        uint256 indexed batchId,
        uint256 indexed medicineId,
        string batchNumber,
        string supplierBatchRef,
        uint256 mfgDate,
        uint256 expiryDate,
        uint256 createdAt
    );

    event InventoryChanged(
        uint256 indexed txId,
        uint256 indexed medicineId,
        uint256 indexed batchId,
        InventoryAction action,
        uint256 quantity,
        int256 signedDelta,
        address fromAddr,
        address toAddr,
        string refNote,
        uint256 timestamp
    );

    function showStage(uint256 _medicineID)
        public
        view
        validMedicine(_medicineID)
        returns (string memory)
    {
        if (MedicineStock[_medicineID].stage == STAGE.Init)
            return "Medicine Ordered";
        else if (MedicineStock[_medicineID].stage == STAGE.RawMaterialSupply)
            return "Raw Material Supply Stage";
        else if (MedicineStock[_medicineID].stage == STAGE.Manufacture)
            return "Manufacturing Stage";
        else if (MedicineStock[_medicineID].stage == STAGE.Distribution)
            return "Distribution Stage";
        else if (MedicineStock[_medicineID].stage == STAGE.Retail)
            return "Retail Stage";
        else if (MedicineStock[_medicineID].stage == STAGE.sold)
            return "Medicine Sold";

        revert("Unknown stage");
    }

    function addRMS(
        address _address,
        string memory _name,
        string memory _place
    ) public onlyByOwner() {
        require(_address != address(0), "Invalid RMS address");
        rmsCtr++;
        RMS[rmsCtr] = rawMaterialSupplier(_address, rmsCtr, _name, _place);
    }

    function addManufacturer(
        address _address,
        string memory _name,
        string memory _place
    ) public onlyByOwner() {
        require(_address != address(0), "Invalid manufacturer address");
        manCtr++;
        MAN[manCtr] = manufacturer(_address, manCtr, _name, _place);
    }

    function addDistributor(
        address _address,
        string memory _name,
        string memory _place
    ) public onlyByOwner() {
        require(_address != address(0), "Invalid distributor address");
        disCtr++;
        DIS[disCtr] = distributor(_address, disCtr, _name, _place);
    }

    function addRetailer(
        address _address,
        string memory _name,
        string memory _place
    ) public onlyByOwner() {
        require(_address != address(0), "Invalid retailer address");
        retCtr++;
        RET[retCtr] = retailer(_address, retCtr, _name, _place);
    }

    function RMSsupply(uint256 _medicineID) public validMedicine(_medicineID) {
        uint256 _id = findRMS(msg.sender);
        require(_id > 0, "Only RMS");
        MedicineStock[_medicineID].RMSid = _id;
        _setMedicineStage(_medicineID, STAGE.Init, STAGE.RawMaterialSupply);
    }

    function Manufacturing(uint256 _medicineID) public validMedicine(_medicineID) {
        uint256 _id = findMAN(msg.sender);
        require(_id > 0, "Only manufacturer");
        MedicineStock[_medicineID].MANid = _id;
        _setMedicineStage(_medicineID, STAGE.RawMaterialSupply, STAGE.Manufacture);
    }

    function Distribute(uint256 _medicineID) public validMedicine(_medicineID) {
        uint256 _id = findDIS(msg.sender);
        require(_id > 0, "Only distributor");
        MedicineStock[_medicineID].DISid = _id;
        _setMedicineStage(_medicineID, STAGE.Manufacture, STAGE.Distribution);
    }

    function Retail(uint256 _medicineID) public validMedicine(_medicineID) {
        uint256 _id = findRET(msg.sender);
        require(_id > 0, "Only retailer");
        MedicineStock[_medicineID].RETid = _id;
        _setMedicineStage(_medicineID, STAGE.Distribution, STAGE.Retail);
    }

    function sold(uint256 _medicineID) public validMedicine(_medicineID) {
        uint256 _id = findRET(msg.sender);
        require(_id > 0, "Only retailer");
        require(_id == MedicineStock[_medicineID].RETid, "Wrong retailer");
        _setMedicineStage(_medicineID, STAGE.Retail, STAGE.sold);
    }

    function addMedicine(string memory _name, string memory _description)
        public
        onlyByOwner()
    {
        require((rmsCtr > 0) && (manCtr > 0) && (disCtr > 0) && (retCtr > 0), "Register roles first");
        medicineCtr++;
        MedicineStock[medicineCtr] = medicine(
            medicineCtr,
            _name,
            _description,
            0,
            0,
            0,
            0,
            STAGE.Init
        );

        medicineCreatedAt[medicineCtr] = block.timestamp;
        medicineLastUpdatedAt[medicineCtr] = block.timestamp;
        medicineStageAt[medicineCtr][uint8(STAGE.Init)] = block.timestamp;

        emit MedicineOrdered(medicineCtr, _name, block.timestamp, msg.sender);
    }

    // ---------- Batch/Lot + Inventory Transactions ----------

    function createBatch(
        uint256 _medicineID,
        string memory _batchNumber,
        string memory _supplierBatchRef,
        uint256 _mfgDate,
        uint256 _expiryDate
    )
        public
        onlyAuthorizedOperator
        validMedicine(_medicineID)
        returns (uint256)
    {
        require(bytes(_batchNumber).length > 0, "Batch number required");
        require(_expiryDate == 0 || _expiryDate >= _mfgDate, "Expiry before manufacturing");

        batchCtr++;
        BatchStock[batchCtr] = batchInfo({
            id: batchCtr,
            medicineId: _medicineID,
            batchNumber: _batchNumber,
            supplierBatchRef: _supplierBatchRef,
            mfgDate: _mfgDate,
            expiryDate: _expiryDate,
            totalReceived: 0,
            totalIssued: 0,
            createdAt: block.timestamp,
            exists: true
        });
        medicineBatchIds[_medicineID].push(batchCtr);

        emit BatchCreated(
            batchCtr,
            _medicineID,
            _batchNumber,
            _supplierBatchRef,
            _mfgDate,
            _expiryDate,
            block.timestamp
        );

        return batchCtr;
    }

    function receiveInventory(
        uint256 _medicineID,
        uint256 _batchID,
        uint256 _quantity,
        address _to,
        string memory _reference
    )
        public
        onlyAuthorizedOperator
        validMedicine(_medicineID)
        validBatch(_batchID)
    {
        require(_quantity > 0, "Quantity must be > 0");
        require(_to != address(0), "Invalid receiver");
        require(BatchStock[_batchID].medicineId == _medicineID, "Batch-medicine mismatch");

        BatchStock[_batchID].totalReceived += _quantity;
        medicineInventory[_medicineID] += _quantity;
        batchBalanceByHolder[_batchID][_to] += _quantity;

        _recordInventoryTx(
            _medicineID,
            _batchID,
            InventoryAction.Receive,
            _quantity,
            address(0),
            _to,
            int256(_quantity),
            _reference
        );
    }

    function issueInventory(
        uint256 _medicineID,
        uint256 _batchID,
        uint256 _quantity,
        address _from,
        address _to,
        string memory _reference
    )
        public
        onlyAuthorizedOperator
        validMedicine(_medicineID)
        validBatch(_batchID)
    {
        require(_quantity > 0, "Quantity must be > 0");
        require(_from != address(0), "Invalid source");
        require(_to != address(0), "Invalid destination");
        require(BatchStock[_batchID].medicineId == _medicineID, "Batch-medicine mismatch");
        require(batchBalanceByHolder[_batchID][_from] >= _quantity, "Insufficient batch stock");
        require(medicineInventory[_medicineID] >= _quantity, "Insufficient medicine stock");

        batchBalanceByHolder[_batchID][_from] -= _quantity;
        BatchStock[_batchID].totalIssued += _quantity;
        medicineInventory[_medicineID] -= _quantity;

        _recordInventoryTx(
            _medicineID,
            _batchID,
            InventoryAction.Issue,
            _quantity,
            _from,
            _to,
            -int256(_quantity),
            _reference
        );
    }

    function transferInventory(
        uint256 _medicineID,
        uint256 _batchID,
        uint256 _quantity,
        address _from,
        address _to,
        string memory _reference
    )
        public
        onlyAuthorizedOperator
        validMedicine(_medicineID)
        validBatch(_batchID)
    {
        require(_quantity > 0, "Quantity must be > 0");
        require(_from != address(0) && _to != address(0), "Invalid transfer address");
        require(_from != _to, "Source and destination must differ");
        require(BatchStock[_batchID].medicineId == _medicineID, "Batch-medicine mismatch");
        require(batchBalanceByHolder[_batchID][_from] >= _quantity, "Insufficient batch stock");

        batchBalanceByHolder[_batchID][_from] -= _quantity;
        batchBalanceByHolder[_batchID][_to] += _quantity;

        _recordInventoryTx(
            _medicineID,
            _batchID,
            InventoryAction.Transfer,
            _quantity,
            _from,
            _to,
            0,
            _reference
        );
    }

    function adjustInventory(
        uint256 _medicineID,
        uint256 _batchID,
        int256 _quantityDelta,
        address _holder,
        string memory _reference
    )
        public
        onlyByOwner
        validMedicine(_medicineID)
        validBatch(_batchID)
    {
        require(_quantityDelta != 0, "Delta cannot be zero");
        require(_holder != address(0), "Invalid holder");
        require(BatchStock[_batchID].medicineId == _medicineID, "Batch-medicine mismatch");

        if (_quantityDelta > 0) {
            uint256 addQty = uint256(_quantityDelta);
            batchBalanceByHolder[_batchID][_holder] += addQty;
            BatchStock[_batchID].totalReceived += addQty;
            medicineInventory[_medicineID] += addQty;
            _recordInventoryTx(
                _medicineID,
                _batchID,
                InventoryAction.Adjust,
                addQty,
                address(0),
                _holder,
                _quantityDelta,
                _reference
            );
        } else {
            uint256 removeQty = uint256(-_quantityDelta);
            require(batchBalanceByHolder[_batchID][_holder] >= removeQty, "Insufficient holder stock");
            require(medicineInventory[_medicineID] >= removeQty, "Insufficient medicine stock");
            batchBalanceByHolder[_batchID][_holder] -= removeQty;
            BatchStock[_batchID].totalIssued += removeQty;
            medicineInventory[_medicineID] -= removeQty;
            _recordInventoryTx(
                _medicineID,
                _batchID,
                InventoryAction.Adjust,
                removeQty,
                _holder,
                address(0),
                _quantityDelta,
                _reference
            );
        }
    }

    function getMedicineBatchIds(uint256 _medicineID)
        public
        view
        validMedicine(_medicineID)
        returns (uint256[] memory)
    {
        return medicineBatchIds[_medicineID];
    }

    function getBatchRemainingQty(uint256 _batchID)
        public
        view
        validBatch(_batchID)
        returns (uint256)
    {
        return BatchStock[_batchID].totalReceived - BatchStock[_batchID].totalIssued;
    }

    function isBatchExpired(uint256 _batchID)
        public
        view
        validBatch(_batchID)
        returns (bool)
    {
        uint256 expiry = BatchStock[_batchID].expiryDate;
        if (expiry == 0) {
            return false;
        }
        return block.timestamp > expiry;
    }

    function getMedicineTimestamps(uint256 _medicineID)
        public
        view
        validMedicine(_medicineID)
        returns (
            uint256 orderedAt,
            uint256 rawSupplyAt,
            uint256 manufactureAt,
            uint256 distributionAt,
            uint256 retailAt,
            uint256 soldAt,
            uint256 updatedAt
        )
    {
        orderedAt = medicineStageAt[_medicineID][uint8(STAGE.Init)];
        rawSupplyAt = medicineStageAt[_medicineID][uint8(STAGE.RawMaterialSupply)];
        manufactureAt = medicineStageAt[_medicineID][uint8(STAGE.Manufacture)];
        distributionAt = medicineStageAt[_medicineID][uint8(STAGE.Distribution)];
        retailAt = medicineStageAt[_medicineID][uint8(STAGE.Retail)];
        soldAt = medicineStageAt[_medicineID][uint8(STAGE.sold)];
        updatedAt = medicineLastUpdatedAt[_medicineID];
    }

    function _setMedicineStage(uint256 _medicineID, STAGE _expectedCurrent, STAGE _next) internal {
        require(MedicineStock[_medicineID].stage == _expectedCurrent, "Invalid stage");
        MedicineStock[_medicineID].stage = _next;
        medicineStageAt[_medicineID][uint8(_next)] = block.timestamp;
        medicineLastUpdatedAt[_medicineID] = block.timestamp;

        emit MedicineStageUpdated(
            _medicineID,
            uint8(_expectedCurrent),
            uint8(_next),
            block.timestamp,
            msg.sender
        );
    }

    function _recordInventoryTx(
        uint256 _medicineID,
        uint256 _batchID,
        InventoryAction _action,
        uint256 _quantity,
        address _from,
        address _to,
        int256 _signedDelta,
        string memory _reference
    ) internal {
        inventoryTxCtr++;
        InventoryTx[inventoryTxCtr] = inventoryTransaction({
            id: inventoryTxCtr,
            medicineId: _medicineID,
            batchId: _batchID,
            action: _action,
            quantity: _quantity,
            fromAddr: _from,
            toAddr: _to,
            signedDelta: _signedDelta,
            refNote: _reference,
            timestamp: block.timestamp
        });

        emit InventoryChanged(
            inventoryTxCtr,
            _medicineID,
            _batchID,
            _action,
            _quantity,
            _signedDelta,
            _from,
            _to,
            _reference,
            block.timestamp
        );
    }

    function _isRegisteredParticipant(address _address) internal view returns (bool) {
        return _isRMS(_address) || _isMAN(_address) || _isDIS(_address) || _isRET(_address);
    }

    function _isRMS(address _address) internal view returns (bool) {
        for (uint256 i = 1; i <= rmsCtr; i++) {
            if (RMS[i].addr == _address) return true;
        }
        return false;
    }

    function _isMAN(address _address) internal view returns (bool) {
        for (uint256 i = 1; i <= manCtr; i++) {
            if (MAN[i].addr == _address) return true;
        }
        return false;
    }

    function _isDIS(address _address) internal view returns (bool) {
        for (uint256 i = 1; i <= disCtr; i++) {
            if (DIS[i].addr == _address) return true;
        }
        return false;
    }

    function _isRET(address _address) internal view returns (bool) {
        for (uint256 i = 1; i <= retCtr; i++) {
            if (RET[i].addr == _address) return true;
        }
        return false;
    }

    function findRMS(address _address) private view returns (uint256) {
        for (uint256 i = 1; i <= rmsCtr; i++) {
            if (RMS[i].addr == _address) return RMS[i].id;
        }
        return 0;
    }

    function findMAN(address _address) private view returns (uint256) {
        for (uint256 i = 1; i <= manCtr; i++) {
            if (MAN[i].addr == _address) return MAN[i].id;
        }
        return 0;
    }

    function findDIS(address _address) private view returns (uint256) {
        for (uint256 i = 1; i <= disCtr; i++) {
            if (DIS[i].addr == _address) return DIS[i].id;
        }
        return 0;
    }

    function findRET(address _address) private view returns (uint256) {
        for (uint256 i = 1; i <= retCtr; i++) {
            if (RET[i].addr == _address) return RET[i].id;
        }
        return 0;
    }
}
