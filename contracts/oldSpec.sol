// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// OpenZeppelin contracts
import {IERC20, SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {AggregatorV3Interface} from "chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

// LooksRare interfaces
import {ICurrencyManager} from "./interfaces/ICurrencyManager.sol";
import {IExecutionManager} from "./interfaces/IExecutionManager.sol";
import {IRoyaltyFeeManager} from "./interfaces/IRoyaltyFeeManager.sol";
import {ILooksRareExchange} from "./interfaces/ILooksRareExchange.sol";
import {ITransferManagerNFT} from "./interfaces/ITransferManagerNFT.sol";
import {ITransferSelectorNFT} from "./interfaces/ITransferSelectorNFT.sol";
import {IWETH} from "./interfaces/IWETH.sol";

// LooksRare libraries
import {OrderTypes} from "./libraries/OrderTypes.sol";
import {SignatureChecker} from "./libraries/SignatureChecker.sol";

/**
 * @title SpeculateExchange
 * @notice It is the core contract of the Speculate exchange.
 */

contract SpeculateExchange {
    using SafeERC20 for IERC20;

    using OrderTypes for OrderTypes.MakerOrder;
    using OrderTypes for OrderTypes.TakerOrder;

    uint256 public immutable PROTOCOL_FEE;

    address public immutable WETH;

    address public protocolFeeRecipient; // who receives the fee

    // maintains whitelist for erc20s
    ICurrencyManager public currencyManager;
    // maintains whitelist for strategies
    IExecutionManager public executionManager;
    // calculates the fees for sales
    IRoyaltyFeeManager public royaltyFeeManager;
    // does stuff related to who can transfer assets in a collection
    ITransferSelectorNFT public transferSelectorNFT;

    mapping(address => mapping(uint256 => OrderTypes.MakerOrder))
        public makerAskByNFT;
    mapping(address => mapping(uint256 => mapping(address => OrderTypes.MakerOrder)))
        public makerBidByNFTAndMaker;

    event TakerBid(
        address indexed taker,
        address indexed maker,
        address indexed strategy,
        address currency,
        address collection,
        uint256 tokenId,
        uint256 amount,
        uint256 price
    );

    event TakerAsk(
        address indexed taker,
        address indexed maker,
        address indexed strategy,
        address currency,
        address collection,
        uint256 tokenId,
        uint256 amount,
        uint256 price
    );

    event MakerAsk(
        address indexed signer,
        address indexed collection,
        uint256 indexed tokenId,
        bool isOrderAsk,
        address currency,
        address strategy,
        uint256 amount,
        uint256 price,
        uint256 startTime,
        uint256 endTime,
        address underlyingPriceFeed,
        uint256 underlyingPriceTreshold
    );

    event MakerBid(
        address indexed signer,
        address indexed collection,
        uint256 indexed tokenId,
        bool isOrderAsk,
        address currency,
        address strategy,
        uint256 amount,
        uint256 price,
        uint256 startTime,
        uint256 endTime,
        address underlyingPriceFeed,
        uint256 underlyingPriceTreshold
    );

    /**
     * @notice Constructor
     * @param _currencyManager currency manager address
     * @param _executionManager execution manager address
     * @param _royaltyFeeManager royalty fee manager address
     * @param _WETH wrapped ether address (for other chains, use wrapped native asset)
     * @param _protocolFeeRecipient protocol fee recipient
     */
    constructor(
        address _currencyManager,
        address _executionManager,
        address _royaltyFeeManager,
        address _WETH,
        address _protocolFeeRecipient
    ) {
        currencyManager = ICurrencyManager(_currencyManager);
        executionManager = IExecutionManager(_executionManager);
        royaltyFeeManager = IRoyaltyFeeManager(_royaltyFeeManager);
        WETH = _WETH;
        protocolFeeRecipient = _protocolFeeRecipient;
        PROTOCOL_FEE = 0;
    }

    function getMakerAsk(address collection, uint256 id)
        public
        view
        returns (OrderTypes.MakerOrder memory)
    {
        return makerAskByNFT[collection][id];
    }

    function getMakerBid(
        address collection,
        uint256 id,
        address maker
    ) public view returns (OrderTypes.MakerOrder memory) {
        return makerBidByNFTAndMaker[collection][id][maker];
    }

    function createMakerAsk(OrderTypes.MakerOrder calldata makerAsk) external {
        require(makerAsk.isOrderAsk, "order is not an ask");
        require(msg.sender == makerAsk.signer, "maker must be the sender");

        makerAskByNFT[makerAsk.collection][makerAsk.tokenId] = makerAsk;

        emit MakerAsk(
            makerAsk.signer,
            makerAsk.collection,
            makerAsk.tokenId,
            makerAsk.isOrderAsk,
            makerAsk.currency,
            makerAsk.strategy,
            makerAsk.amount,
            makerAsk.price,
            makerAsk.startTime,
            makerAsk.endTime,
            makerAsk.underlyingPriceFeed,
            makerAsk.underlyingPriceTreshold
        );
    }

    function createMakerBid(OrderTypes.MakerOrder calldata makerBid) external {
        require(!makerBid.isOrderAsk, "order is not a bid");
        require(msg.sender == makerBid.signer, "maker must be the sender");
        // check that msg.sender have the funds?
        // check that the nft exists?

        makerBidByNFTAndMaker[makerBid.collection][makerBid.tokenId][
            makerBid.signer
        ] = makerBid;

        emit MakerBid(
            makerBid.signer,
            makerBid.collection,
            makerBid.tokenId,
            makerBid.isOrderAsk,
            makerBid.currency,
            makerBid.strategy,
            makerBid.amount,
            makerBid.price,
            makerBid.startTime,
            makerBid.endTime,
            makerBid.underlyingPriceFeed,
            makerBid.underlyingPriceTreshold
        );
    }

    function matchAskWithTakerBid(
        OrderTypes.TakerOrder calldata takerBid,
        OrderTypes.MakerOrder calldata makerAsk
    ) external {
        require(
            (makerAsk.isOrderAsk) && (!takerBid.isOrderAsk),
            "Order: Wrong sides"
        );
        require(
            msg.sender == takerBid.taker,
            "Order: Taker must be the sender"
        );

        // canExecuteTakerBid checks for validity apart from the price
        (
            bool isExecutionValid,
            uint256 tokenId,
            uint256 amount
        ) = canExecuteTakerBid(takerBid, makerAsk);

        require(isExecutionValid, "Strategy: Execution invalid");

        // validate the price
        (, int256 underlyingAssetPrice, , , ) = AggregatorV3Interface(
            makerAsk.underlyingPriceFeed
        ).latestRoundData();

        // only valid for call options for now
        require(
            underlyingAssetPrice <= int256(makerAsk.underlyingPriceTreshold),
            "price not below treshold"
        );

        // Execution part 1/2
        _transferFeesAndFunds(
            makerAsk.strategy,
            makerAsk.collection,
            tokenId,
            makerAsk.currency,
            msg.sender,
            makerAsk.signer,
            takerBid.price
        );

        // Execution part 2/2
        _transferNonFungibleToken(
            makerAsk.collection,
            makerAsk.signer,
            takerBid.taker,
            tokenId,
            amount
        );

        emit TakerBid(
            takerBid.taker,
            makerAsk.signer,
            makerAsk.strategy,
            makerAsk.currency,
            makerAsk.collection,
            tokenId,
            amount,
            takerBid.price
        );

        delete makerAskByNFT[makerAsk.collection][makerAsk.tokenId];
    }

    /**
     * @notice Match a takerAsk with a makerBid
     * @param takerAsk taker ask order
     * @param makerBid maker bid order
     */
    function matchBidWithTakerAsk(
        OrderTypes.TakerOrder calldata takerAsk,
        OrderTypes.MakerOrder calldata makerBid
    ) external {
        require(
            (!makerBid.isOrderAsk) && (takerAsk.isOrderAsk),
            "Order: Wrong sides"
        );
        require(
            msg.sender == takerAsk.taker,
            "Order: Taker must be the sender"
        );

        (
            bool isExecutionValid,
            uint256 tokenId,
            uint256 amount
        ) = canExecuteTakerAsk(takerAsk, makerBid);

        require(isExecutionValid, "Strategy: Execution invalid");

        // validate the price
        (, int256 underlyingAssetPrice, , , ) = AggregatorV3Interface(
            makerBid.underlyingPriceFeed
        ).latestRoundData();

        // only valid for call options for now
        require(
            underlyingAssetPrice >= int256(makerBid.underlyingPriceTreshold),
            "price not above treshold"
        );

        // Execution part 1/2
        _transferNonFungibleToken(
            makerBid.collection,
            msg.sender,
            makerBid.signer,
            tokenId,
            amount
        );

        // Execution part 2/2
        _transferFeesAndFunds(
            makerBid.strategy,
            makerBid.collection,
            tokenId,
            makerBid.currency,
            makerBid.signer,
            takerAsk.taker,
            takerAsk.price
        );

        emit TakerAsk(
            takerAsk.taker,
            makerBid.signer,
            makerBid.strategy,
            makerBid.currency,
            makerBid.collection,
            tokenId,
            amount,
            takerAsk.price
        );

        delete makerAskByNFT[makerBid.collection][makerBid.tokenId];
        delete makerBidByNFTAndMaker[makerBid.collection][makerBid.tokenId][
            makerBid.signer
        ];
    }

    /**
     * @notice Transfer fees and funds to royalty recipient, protocol, and seller
     * @param strategy address of the execution strategy
     * @param collection non fungible token address for the transfer
     * @param tokenId tokenId
     * @param currency currency being used for the purchase (e.g., WETH/USDC)
     * @param from sender of the funds
     * @param to seller's recipient
     * @param amount amount being transferred (in currency)
     */
    function _transferFeesAndFunds(
        address strategy,
        address collection,
        uint256 tokenId,
        address currency,
        address from,
        address to,
        uint256 amount
    ) internal {
        // Initialize the final amount that is transferred to seller
        uint256 finalSellerAmount = amount;

        // no protocol fee

        // no royalty fee

        // Transfer final amount to seller
        IERC20(currency).safeTransferFrom(from, to, finalSellerAmount);
    }

    /**
     * @notice Transfer NFT
     * @param collection address of the token collection
     * @param from address of the sender
     * @param to address of the recipient
     * @param tokenId tokenId
     * @param amount amount of tokens (1 for ERC721, 1+ for ERC1155)
     * @dev For ERC721, amount is not used
     */
    function _transferNonFungibleToken(
        address collection,
        address from,
        address to,
        uint256 tokenId,
        uint256 amount
    ) internal {
        // Retrieve the transfer manager address
        address transferManager = transferSelectorNFT
            .checkTransferManagerForToken(collection);

        // If no transfer manager found, it returns address(0)
        require(
            transferManager != address(0),
            "Transfer: No NFT transfer manager available"
        );

        // If one is found, transfer the token
        ITransferManagerNFT(transferManager).transferNonFungibleToken(
            collection,
            from,
            to,
            tokenId,
            amount
        );
    }

    /**
     * @notice Update transfer selector NFT
     * @param _transferSelectorNFT new transfer selector address
     */
    function updateTransferSelectorNFT(address _transferSelectorNFT) external {
        require(
            _transferSelectorNFT != address(0),
            "Owner: Cannot be null address"
        );
        transferSelectorNFT = ITransferSelectorNFT(_transferSelectorNFT);

        // emit NewTransferSelectorNFT(_transferSelectorNFT);
    }

    /**
     * @notice Calculate protocol fee for an execution strategy
     * @param amount amount to transfer
     */
    function _calculateProtocolFee(uint256 amount)
        internal
        view
        returns (uint256)
    {
        return (PROTOCOL_FEE * amount) / 10000;
    }

    function canExecuteTakerBid(
        OrderTypes.TakerOrder calldata takerBid,
        OrderTypes.MakerOrder calldata makerAsk
    )
        private
        view
        returns (
            bool,
            uint256,
            uint256
        )
    {
        return (
            ((makerAsk.price == takerBid.price) &&
                (makerAsk.tokenId == takerBid.tokenId) &&
                (makerAsk.startTime <= block.timestamp) &&
                (makerAsk.endTime >= block.timestamp)),
            makerAsk.tokenId,
            makerAsk.amount
        );
    }

    function canExecuteTakerAsk(
        OrderTypes.TakerOrder calldata takerAsk,
        OrderTypes.MakerOrder calldata makerBid
    )
        private
        view
        returns (
            bool,
            uint256,
            uint256
        )
    {
        return (
            ((makerBid.price == takerAsk.price) &&
                (makerBid.tokenId == takerAsk.tokenId) &&
                (makerBid.startTime <= block.timestamp) &&
                (makerBid.endTime >= block.timestamp)),
            makerBid.tokenId,
            makerBid.amount
        );
    }
}
