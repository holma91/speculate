// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "openzeppelin-contracts/contracts/token/ERC1155/ERC1155.sol";

contract OptionFactory is ERC1155 {
    uint256 public currentOptionId;

    mapping(uint256 => Option) public optionById;

    struct Option {
        address underlyingAsset;
        uint256 underlyingAmount;
        bool call;
        uint256 strikePrice;
        uint256 expiry;
        uint256 premium; // paid in native currency
    }

    constructor() ERC1155("/path") {
        currentOptionId = 0;
    }

    function createOption(
        Option memory option,
        uint256 quantity,
        address collateralAddress
    ) public returns (uint256) {
        optionById[currentOptionId] = option;
        _mint(msg.sender, currentOptionId, quantity, "");
        return currentOptionId++;
    }

    function getOptionById(uint256 optionId)
        public
        view
        returns (Option memory)
    {
        return optionById[optionId];
    }
}
