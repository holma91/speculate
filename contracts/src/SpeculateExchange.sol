// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// OpenZeppelin contracts
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";
import {IERC20, SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721} from "openzeppelin-contracts/contracts/token/ERC721/IERC721.sol";

// LooksRare interfaces
import {ICurrencyManager} from "./interfaces/ICurrencyManager.sol";
import {IExecutionManager} from "./interfaces/IExecutionManager.sol";
import {IExecutionStrategy} from "./interfaces/IExecutionStrategy.sol";
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
    mapping(address => mapping(uint256 => OrderTypes.MakerOrder))
        public makerBidByNFT;

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
        address indexed maker,
        address indexed collection,
        uint256 indexed tokenId,
        address currency,
        address strategy,
        uint256 amount,
        uint256 price
    );

    event MakerBid(
        address indexed maker,
        address indexed collection,
        uint256 indexed tokenId,
        address currency,
        address strategy,
        uint256 amount,
        uint256 price
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
    }

    function getMakerAsk(address collection, uint256 id)
        public
        view
        returns (OrderTypes.MakerOrder memory)
    {
        return makerAskByNFT[collection][id];
    }

    function getMakerBid(address collection, uint256 id)
        public
        view
        returns (OrderTypes.MakerOrder memory)
    {
        return makerBidByNFT[collection][id];
    }

    function createMakerAsk(OrderTypes.MakerOrder calldata makerAsk) external {
        require(makerAsk.isOrderAsk, "order is not an ask");
        require(msg.sender == makerAsk.signer, "maker must be the sender");
        require(
            IERC721(makerAsk.collection).ownerOf(makerAsk.tokenId) ==
                msg.sender,
            "caller is not the owner"
        );

        makerAskByNFT[makerAsk.collection][makerAsk.tokenId] = makerAsk;

        emit MakerAsk(
            makerAsk.signer,
            makerAsk.collection,
            makerAsk.tokenId,
            makerAsk.currency,
            makerAsk.strategy,
            makerAsk.amount,
            makerAsk.price
        );
    }

    function createMakerBid(OrderTypes.MakerOrder calldata makerBid) external {
        require(!makerBid.isOrderAsk, "order is not a bid");
        require(msg.sender == makerBid.signer, "maker must be the sender");
        require(
            makerBid.price >
                makerBidByNFT[makerBid.collection][makerBid.tokenId].price ||
                block.timestamp >
                makerBidByNFT[makerBid.collection][makerBid.tokenId].endTime,
            "cannot overwrite previous bid"
        );
        // check that msg.sender have the funds?
        // check that the nft exists?

        makerBidByNFT[makerBid.collection][makerBid.tokenId] = makerBid;

        emit MakerBid(
            makerBid.signer,
            makerBid.collection,
            makerBid.tokenId,
            makerBid.currency,
            makerBid.strategy,
            makerBid.amount,
            makerBid.price
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

        (
            bool isExecutionValid,
            uint256 tokenId,
            uint256 amount
        ) = IExecutionStrategy(makerAsk.strategy).canExecuteTakerBid(
                takerBid,
                makerAsk
            );

        require(isExecutionValid, "Strategy: Execution invalid");

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

        delete makerBidByNFT[makerAsk.collection][makerAsk.tokenId];
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
        ) = IExecutionStrategy(makerBid.strategy).canExecuteTakerAsk(
                takerAsk,
                makerBid
            );

        require(isExecutionValid, "Strategy: Execution invalid");

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
        delete makerBidByNFT[makerBid.collection][makerBid.tokenId];
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
     * @param executionStrategy strategy
     * @param amount amount to transfer
     */
    function _calculateProtocolFee(address executionStrategy, uint256 amount)
        internal
        view
        returns (uint256)
    {
        uint256 protocolFee = IExecutionStrategy(executionStrategy)
            .viewProtocolFee();
        return (protocolFee * amount) / 10000;
    }
}
