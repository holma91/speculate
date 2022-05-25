// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "openzeppelin-contracts/contracts/token/ERC1155/ERC1155.sol";
import "openzeppelin-contracts/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract OptionFactory is ERC721URIStorage {
    uint256 public currentOptionId;

    mapping(uint256 => Option) public optionById;
    mapping(uint256 => Collateral) public collateralById;

    struct Option {
        address underlyingPriceFeed;
        uint256 underlyingAmount;
        bool call;
        uint256 strikePrice;
        uint256 expiry;
        bool european;
    }

    struct Collateral {
        address priceFeed;
        uint256 amount;
    }

    constructor() ERC721("najm", "smbl") {
        currentOptionId = 0;
    }

    function createOption(
        Option memory option,
        Collateral memory collateral,
        string memory metadataURI
    ) public payable returns (uint256) {
        require(collateral.amount == msg.value, "wrong collateral amount");
        collateralById[currentOptionId] = collateral;

        optionById[currentOptionId] = option;
        _safeMint(msg.sender, currentOptionId);
        _setTokenURI(currentOptionId, metadataURI);

        return currentOptionId++;
    }

    function addCollateral(uint256 optionId) public payable {
        Collateral storage collateral = collateralById[optionId];
        collateral.amount += msg.value;
    }

    function withdrawCollateral(uint256 optionId, uint256 amount) public {
        Collateral storage collateral = collateralById[optionId];
        require(
            amount <= collateral.amount,
            "cannot withdraw more than what you have"
        );
        collateral.amount -= amount;

        int256 ratio = getCollateralToRiskRatio(optionId);
        require(ratio >= 1000, "cannot go below 1 in collateral-to-risk ratio");

        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "failed ether transfer");
    }

    function exerciseOption(uint256 optionId) public {
        require(ownerOf(optionId) == msg.sender, "only owner can exercise");

        Option memory option = getOptionById(optionId);
        Collateral memory collateral = getCollateralById(optionId);

        if (option.european) {
            // european style option can only be exercised at expiry
            require(block.timestamp >= option.expiry, "not at expiry");
        }

        // can only exercise if ITM

        // check price
        (, int256 currentUnderlyingPrice, , , ) = AggregatorV3Interface(
            option.underlyingPriceFeed
        ).latestRoundData();

        (, int256 currentCollateralPrice, , , ) = AggregatorV3Interface(
            collateral.priceFeed
        ).latestRoundData();

        require(
            currentUnderlyingPrice > 0 && currentCollateralPrice > 0,
            "oracle error, negative price"
        );
        require(
            currentUnderlyingPrice > int256(option.strikePrice),
            "option is OTM, cannot be exercised"
        );

        uint256 payoutInUSD = option.underlyingAmount *
            uint256(currentUnderlyingPrice);
        uint256 payoutInETH = payoutInUSD / uint256(currentCollateralPrice);

        // burn the nft representing the exercised option
        _burn(optionId);

        // settle in cash
        (bool sent, ) = msg.sender.call{value: payoutInETH}("");
        require(sent, "failed ether transfer");
    }

    function getCollateralToRiskRatio(uint256 optionId)
        public
        view
        returns (int256)
    {
        Option memory option = optionById[optionId];
        Collateral memory collateral = collateralById[optionId];

        (, int256 underlyingPrice, , , ) = AggregatorV3Interface(
            option.underlyingPriceFeed
        ).latestRoundData();
        (, int256 collateralPrice, , , ) = AggregatorV3Interface(
            collateral.priceFeed
        ).latestRoundData();

        int256 riskUsd = int256(option.underlyingAmount) * underlyingPrice;
        int256 collateralUsd = int256(collateral.amount) * collateralPrice;

        return (collateralUsd * 10**3) / riskUsd;
    }

    function canBeLiquidated(uint256 optionId) public view returns (bool) {
        Option memory option = optionById[optionId];

        Collateral memory collateral = collateralById[optionId];
        require(
            option.underlyingPriceFeed != collateral.priceFeed &&
                option.underlyingAmount <= collateral.amount,
            "liquidate: covered call cannot be liquidated"
        );

        int256 collateralToRiskRatio = getCollateralToRiskRatio(optionId);

        return collateralToRiskRatio < 1200;
    }

    function getCollateralById(uint256 optionId)
        public
        view
        returns (Collateral memory)
    {
        return collateralById[optionId];
    }

    function getOptionById(uint256 optionId)
        public
        view
        returns (Option memory)
    {
        return optionById[optionId];
    }
}
