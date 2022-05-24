// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "ds-test/test.sol";
// import {IERC20, SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {ERC721} from "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";

import {IERC721Receiver} from "openzeppelin-contracts/contracts/token/ERC721/IERC721Receiver.sol";
import "../libraries/OrderTypes.sol";

// contracts
import "../SpeculateExchange.sol";
import "../StrategyStandardSaleForFixedPrice.sol";
import "../TransferManagerERC721.sol";
import "../TransferManagerERC1155.sol";
import "../TransferSelectorNFT.sol";

// LooksRare interfaces
import {ICurrencyManager} from "../interfaces/ICurrencyManager.sol";
import {IExecutionManager} from "../interfaces/IExecutionManager.sol";
import {IExecutionStrategy} from "../interfaces/IExecutionStrategy.sol";
import {IRoyaltyFeeManager} from "../interfaces/IRoyaltyFeeManager.sol";
import {ILooksRareExchange} from "../interfaces/ILooksRareExchange.sol";
import {ITransferManagerNFT} from "../interfaces/ITransferManagerNFT.sol";
import {ITransferSelectorNFT} from "../interfaces/ITransferSelectorNFT.sol";

interface CheatCodes {
    function prank(address) external;

    function expectRevert(bytes memory) external;

    function assume(bool) external;

    function warp(uint256) external;

    function startPrank(address, address) external;

    function stopPrank() external;

    function expectEmit(
        bool,
        bool,
        bool,
        bool
    ) external;
}

contract MockWETH is ERC20("Wrapped Ether", "WETH") {
    function mintTo(address to, uint256 amount) public payable {
        _mint(to, amount);
    }
}

contract MockCollection is ERC721("name", "symbol") {
    uint256 public currentTokenId;

    function mintTo(address recipient) public payable returns (uint256) {
        uint256 newTokenId = ++currentTokenId;
        _safeMint(recipient, newTokenId);
        return newTokenId;
    }
}

contract SpeculateExchangeTest is DSTest {
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
        uint256 endTime
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
        uint256 endTime
    );
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

    CheatCodes internal cheats;
    SpeculateExchange internal speculateExchange;

    Receiver internal receiver;

    address internal alice;
    address internal bob;
    address internal babback;
    address internal mange;
    MockWETH internal WETH;
    StrategyStandardSaleForFixedPrice
        internal strategyStandardSaleForFixedPrice;

    TransferManagerERC721 internal transferManagerERC721;
    TransferManagerERC1155 internal transferManagerERC1155;
    ITransferSelectorNFT internal transferSelectorNFT;

    MockCollection internal collection;

    function setUp() public {
        cheats = CheatCodes(HEVM_ADDRESS);
        receiver = new Receiver();
        alice = address(0x1337);
        bob = address(0x1338);
        babback = address(0x1339);
        mange = address(0x1340);
        WETH = new MockWETH();
        strategyStandardSaleForFixedPrice = new StrategyStandardSaleForFixedPrice(
            100
        );
        speculateExchange = new SpeculateExchange(
            alice, // currencyManager
            bob, // executionManager
            babback, // royaltyFeeManager
            address(WETH),
            mange // protocolFeeRecipient
        );
        transferManagerERC721 = new TransferManagerERC721(
            address(speculateExchange)
        );
        transferManagerERC1155 = new TransferManagerERC1155(
            address(speculateExchange)
        );
        transferSelectorNFT = new TransferSelectorNFT(
            address(transferManagerERC721),
            address(transferManagerERC1155)
        );
        speculateExchange.updateTransferSelectorNFT(
            address(transferSelectorNFT)
        );

        collection = new MockCollection();
        collection.mintTo(address(receiver));
        collection.mintTo(address(receiver));
        collection.mintTo(address(receiver));
        cheats.prank(address(receiver));
        collection.setApprovalForAll(address(transferManagerERC721), true);
    }

    function testCanCreateMakerAsks() public {
        cheats.startPrank(address(receiver), address(receiver));
        OrderTypes.MakerOrder memory makerAsk = OrderTypes.MakerOrder(
            true,
            address(receiver),
            address(collection),
            0.01 ether,
            1,
            1,
            address(strategyStandardSaleForFixedPrice),
            address(WETH),
            1650718512,
            1650719912
        );
        cheats.expectEmit(true, true, true, true);
        // the event we expect to see
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
            makerAsk.endTime
        );
        speculateExchange.createMakerAsk(makerAsk);
        OrderTypes.MakerOrder memory retrievedMakerAsk = speculateExchange
            .getMakerAsk(makerAsk.collection, makerAsk.tokenId);

        assertEq(makerAsk.signer, retrievedMakerAsk.signer);
        assertEq(makerAsk.strategy, retrievedMakerAsk.strategy);
        assertEq(makerAsk.endTime, retrievedMakerAsk.endTime);

        OrderTypes.MakerOrder memory makerAsk2 = OrderTypes.MakerOrder(
            true,
            address(receiver),
            address(collection),
            0.02 ether,
            1,
            1,
            address(strategyStandardSaleForFixedPrice),
            address(WETH),
            1650718512,
            1650719912
        );

        speculateExchange.createMakerAsk(makerAsk2);
        OrderTypes.MakerOrder memory retrievedMakerAsk2 = speculateExchange
            .getMakerAsk(makerAsk2.collection, makerAsk2.tokenId);
        assertEq(makerAsk2.signer, retrievedMakerAsk2.signer);
        assertEq(makerAsk2.strategy, retrievedMakerAsk2.strategy);
        assertEq(makerAsk2.endTime, retrievedMakerAsk2.endTime);
        cheats.stopPrank();
    }

    function testCanCreateMakerBids() public {
        cheats.startPrank(alice, alice);
        OrderTypes.MakerOrder memory makerBid = OrderTypes.MakerOrder(
            false,
            alice,
            address(collection),
            0.01 ether,
            1,
            1,
            address(strategyStandardSaleForFixedPrice),
            address(WETH),
            1650718512,
            1650719912
        );

        cheats.expectEmit(true, true, true, true);
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
            makerBid.endTime
        );
        speculateExchange.createMakerBid(makerBid);
        OrderTypes.MakerOrder memory retrievedMakerBid = speculateExchange
            .getMakerBid(
                makerBid.collection,
                makerBid.tokenId,
                makerBid.signer
            );
        emit log_address(makerBid.signer);
        emit log_address(retrievedMakerBid.signer);
        assertEq(makerBid.signer, retrievedMakerBid.signer);
        assertEq(makerBid.strategy, retrievedMakerBid.strategy);
        assertEq(makerBid.endTime, retrievedMakerBid.endTime);

        // can overwrite previous bid
        OrderTypes.MakerOrder memory makerBid2 = OrderTypes.MakerOrder(
            false,
            alice,
            address(collection),
            0.02 ether,
            1,
            1,
            address(strategyStandardSaleForFixedPrice),
            address(WETH),
            1650718512,
            1650719912
        );

        speculateExchange.createMakerBid(makerBid2);
        OrderTypes.MakerOrder memory retrievedMakerBid2 = speculateExchange
            .getMakerBid(
                makerBid2.collection,
                makerBid2.tokenId,
                makerBid2.signer
            );

        assertEq(makerBid2.signer, retrievedMakerBid2.signer);
        assertEq(makerBid2.strategy, retrievedMakerBid2.strategy);
        assertEq(makerBid2.endTime, retrievedMakerBid2.endTime);
        cheats.stopPrank();
    }

    function testCanMultipleAddressesBid() public {
        OrderTypes.MakerOrder memory makerBid = OrderTypes.MakerOrder(
            false,
            alice,
            address(collection),
            0.01 ether,
            1,
            1,
            address(strategyStandardSaleForFixedPrice),
            address(WETH),
            1650718512,
            1650719912
        );
        cheats.prank(alice);
        speculateExchange.createMakerBid(makerBid);

        OrderTypes.MakerOrder memory makerBid2 = OrderTypes.MakerOrder(
            false,
            bob,
            address(collection),
            0.02 ether,
            1,
            1,
            address(strategyStandardSaleForFixedPrice),
            address(WETH),
            1650718512,
            1650719912
        );
        cheats.prank(bob);
        speculateExchange.createMakerBid(makerBid2);

        OrderTypes.MakerOrder memory retrievedMakerBid = speculateExchange
            .getMakerBid(
                makerBid.collection,
                makerBid.tokenId,
                makerBid.signer
            );

        OrderTypes.MakerOrder memory retrievedMakerBid2 = speculateExchange
            .getMakerBid(
                makerBid2.collection,
                makerBid2.tokenId,
                makerBid2.signer
            );

        assertEq(makerBid.price, retrievedMakerBid.price);
        assertEq(makerBid2.signer, retrievedMakerBid2.signer);
    }

    function testCanCanMatchMakerAskWithTakerBid() public {
        // need to check ownership of the nft below
        cheats.startPrank(address(receiver), address(receiver));

        OrderTypes.MakerOrder memory makerAsk = OrderTypes.MakerOrder(
            true,
            address(receiver),
            address(collection),
            1 ether,
            1,
            1,
            address(strategyStandardSaleForFixedPrice),
            address(WETH),
            block.timestamp,
            1653806167
        );
        speculateExchange.createMakerAsk(makerAsk);
        assertTrue(
            collection.isApprovedForAll(
                address(receiver),
                address(transferManagerERC721)
            )
        );

        OrderTypes.MakerOrder memory makerBid = OrderTypes.MakerOrder(
            false,
            alice,
            address(collection),
            0.01 ether,
            1,
            1,
            address(strategyStandardSaleForFixedPrice),
            address(WETH),
            block.timestamp,
            1653806167
        );

        // create taker bid
        OrderTypes.TakerOrder memory takerBid = OrderTypes.TakerOrder(
            false,
            alice,
            1 ether,
            1
        );
        WETH.mintTo(alice, 1 ether);
        uint256 receiverBalanceBefore = WETH.balanceOf(address(receiver));
        uint256 aliceBalanceBefore = WETH.balanceOf(alice);
        cheats.stopPrank();
        cheats.startPrank(alice, alice);
        // create pointless makerBid
        speculateExchange.createMakerBid(makerBid);
        WETH.approve(address(speculateExchange), 1 ether);
        assertEq(collection.ownerOf(1), address(receiver));

        cheats.expectEmit(true, true, true, true);
        emit TakerBid(
            takerBid.taker,
            makerAsk.signer,
            makerAsk.strategy,
            makerAsk.currency,
            makerAsk.collection,
            makerAsk.tokenId,
            makerAsk.amount,
            makerAsk.price
        );
        speculateExchange.matchAskWithTakerBid(takerBid, makerAsk);
        uint256 receiverBalanceAfter = WETH.balanceOf(address(receiver));
        uint256 aliceBalanceAfter = WETH.balanceOf(alice);
        assertEq(receiverBalanceAfter, receiverBalanceBefore + 1 ether);
        assertEq(aliceBalanceAfter, aliceBalanceBefore - 1 ether);
        assertEq(collection.ownerOf(1), alice);

        // make sure old makerAsk is deleted
        OrderTypes.MakerOrder memory oldMakerAsk = speculateExchange
            .getMakerAsk(address(collection), 1);
        assertEq(
            oldMakerAsk.signer,
            0x0000000000000000000000000000000000000000
        );
        assertEq(
            oldMakerAsk.collection,
            0x0000000000000000000000000000000000000000
        );

        // makerBid is not deleted
        OrderTypes.MakerOrder memory oldMakerBid = speculateExchange
            .getMakerBid(address(collection), 1, alice);

        assertEq(oldMakerBid.signer, alice);
    }

    function testCanMatchMakerBidWithTakerAsk() public {
        cheats.startPrank(alice, alice);
        WETH.mintTo(alice, 1 ether);
        WETH.approve(address(speculateExchange), 1 ether);

        OrderTypes.MakerOrder memory makerBid = OrderTypes.MakerOrder(
            false,
            alice,
            address(collection),
            1 ether,
            2,
            1,
            address(strategyStandardSaleForFixedPrice),
            address(WETH),
            block.timestamp,
            1653806167
        );

        speculateExchange.createMakerBid(makerBid);

        // create taker ask
        OrderTypes.TakerOrder memory takerAsk = OrderTypes.TakerOrder(
            true,
            address(receiver),
            1 ether,
            2
        );
        uint256 receiverBalanceBefore = WETH.balanceOf(address(receiver));
        uint256 aliceBalanceBefore = WETH.balanceOf(alice);
        cheats.stopPrank();
        cheats.startPrank(address(receiver), address(receiver));
        assertEq(collection.ownerOf(2), address(receiver));

        cheats.expectEmit(true, true, true, true);
        emit TakerAsk(
            takerAsk.taker,
            makerBid.signer,
            makerBid.strategy,
            makerBid.currency,
            makerBid.collection,
            makerBid.tokenId,
            makerBid.amount,
            makerBid.price
        );
        speculateExchange.matchBidWithTakerAsk(takerAsk, makerBid);
        uint256 receiverBalanceAfter = WETH.balanceOf(address(receiver));
        uint256 aliceBalanceAfter = WETH.balanceOf(alice);
        assertEq(receiverBalanceAfter, receiverBalanceBefore + 1 ether);
        assertEq(aliceBalanceAfter, aliceBalanceBefore - 1 ether);

        assertEq(collection.ownerOf(2), alice);
        assertEq(collection.ownerOf(1), address(receiver));
    }
}

contract Receiver is IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 id,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
