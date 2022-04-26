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
import "../strategies/StrategyStandardSaleForFixedPrice.sol";
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
        uint256 makerAskId = speculateExchange.createMakerAsk(makerAsk);
        OrderTypes.MakerOrder memory retrievedMakerAsk = speculateExchange
            .getMakerOrder(makerAskId);
        assertEq(makerAsk.signer, retrievedMakerAsk.signer);
        assertEq(makerAsk.strategy, retrievedMakerAsk.strategy);

        OrderTypes.MakerOrder memory makerAsk2 = OrderTypes.MakerOrder(
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

        uint256 makerAskId2 = speculateExchange.createMakerAsk(makerAsk2);
        OrderTypes.MakerOrder memory retrievedMakerAsk2 = speculateExchange
            .getMakerOrder(makerAskId2);
        assertEq(makerAsk2.signer, retrievedMakerAsk2.signer);
        assertEq(makerAsk2.strategy, retrievedMakerAsk2.strategy);
        assertEq(speculateExchange.makerOrderCount(), 2);
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
        uint256 makerAskId = speculateExchange.createMakerBid(makerBid);
        OrderTypes.MakerOrder memory retrievedMakerAsk = speculateExchange
            .getMakerOrder(makerAskId);
        assertEq(makerBid.signer, retrievedMakerAsk.signer);
        assertEq(makerBid.strategy, retrievedMakerAsk.strategy);

        OrderTypes.MakerOrder memory makerBid2 = OrderTypes.MakerOrder(
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

        uint256 makerAskId2 = speculateExchange.createMakerBid(makerBid2);
        OrderTypes.MakerOrder memory retrievedMakerAsk2 = speculateExchange
            .getMakerOrder(makerAskId2);
        assertEq(makerBid2.signer, retrievedMakerAsk2.signer);
        assertEq(makerBid2.strategy, retrievedMakerAsk2.strategy);
        assertEq(speculateExchange.makerOrderCount(), 2);
        cheats.stopPrank();
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
        WETH.approve(address(speculateExchange), 1 ether);
        assertEq(collection.ownerOf(1), address(receiver));

        speculateExchange.matchAskWithTakerBid(takerBid, makerAsk);
        uint256 receiverBalanceAfter = WETH.balanceOf(address(receiver));
        uint256 aliceBalanceAfter = WETH.balanceOf(alice);
        assertEq(receiverBalanceAfter, receiverBalanceBefore + 1 ether);
        assertEq(aliceBalanceAfter, aliceBalanceBefore - 1 ether);

        assertEq(collection.ownerOf(1), alice);
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
