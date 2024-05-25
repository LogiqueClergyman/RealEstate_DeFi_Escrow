// SPDX-License Identifier: MIT

pragma solidity >=0.8.0 < 0.9.0;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external;
}

contract Escrow {
    address public nftAddress;
    address public lender;
    address public inspector;
    address payable public seller;
    mapping (uint256 => bool) public isListed;
    mapping(uint256 => uint256) public escrowAmount;
    mapping(uint256 => uint256) public purchasePrice;
    mapping(uint256 => address) public buyer;
    mapping(uint256 => bool) public inspectionStatus;
    mapping(uint256 => mapping(address => bool)) public approvalStatus;
    constructor(
        address _nftAddress,
        address payable _seller,
        address _inspector,
        address _lender
    ) {
        nftAddress = _nftAddress;
        lender = _lender;
        inspector = _inspector;
        seller = _seller;
    }

    function listing(uint256 _nftId, address _buyer, uint256 _purchasePrice, uint256 _escrowAmt) public {
        IERC721(nftAddress).transferFrom(seller, address(this), _nftId);

        isListed[_nftId] = true;
        escrowAmount[_nftId] = _escrowAmt;
        purchasePrice[_nftId] = _purchasePrice;
        buyer[_nftId] = _buyer;
    }
    
    function escrowPayment(uint256 _nftId) public payable{
        require(isListed[_nftId], "Property not listed");
        require(msg.value >= escrowAmount[_nftId], "Insufficient escrow amount");
    }

    function inspectorApproval(uint256 _nftId, bool verdict) public {
        require(isListed[_nftId], "Property not listed");
        require(address(this).balance >= escrowAmount[_nftId], "Insufficient escrow amount");
        inspectionStatus[_nftId] = verdict;
    }

    function getApproval(uint256 _nftId, bool verdict) public {
        require(isListed[_nftId], "Property not listed");
        approvalStatus[_nftId][msg.sender] = verdict;
    }

    function finalizeTransaction(uint256 _nftId) public {
        require(isListed[_nftId], "Property not listed");
        require(inspectionStatus[_nftId], "Inspection not approved");
        require(approvalStatus[_nftId][buyer[_nftId]], "Buyer not approved");
        require(approvalStatus[_nftId][seller], "Seller not approved"); 
        require(approvalStatus[_nftId][lender], "Inspector not approved");
        require(address(this).balance >= purchasePrice[_nftId], "Insufficient balance");

        (bool success, ) = payable(seller).call{value: purchasePrice[_nftId]}("");
        require(success, "Transfer failed.");
        IERC721(nftAddress).transferFrom(address(this), buyer[_nftId], _nftId);
    }
    
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    receive() external payable {}
}
