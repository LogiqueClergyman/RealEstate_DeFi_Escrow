// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.8.0 < 0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract RealEstate is ERC721URIStorage{
    uint256 private _tokenId;

    constructor() ERC721("RealEstate", "RE") {}

    function mint(string memory tokenURI) public returns (uint256){
        _tokenId += 1;
        uint256 newItemId = _tokenId;
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
    }

    function totalSupply() public view returns (uint256){
        return _tokenId;
    }
}