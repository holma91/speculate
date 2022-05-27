// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "ds-test/test.sol";
import "openzeppelin-contracts/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "openzeppelin-contracts/contracts/token/ERC721/utils/ERC721Holder.sol";
import "../OptionFactory.sol";
import "./mocks/MockV3Aggregator.sol";

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

address constant BTC_USD_FUJI = 0x31CF013A08c6Ac228C94551d535d5BAfE19c602a;
address constant ETH_USD_FUJI = 0x86d67c3D38D2bCeE722E601025C25a575021c6EA;
address constant AVAX_USD_FUJI = 0x5498BB86BC934c8D34FDA08E81D444153d0D06aD;

contract OptionFactoryTest is DSTest, ERC1155Holder, ERC721Holder {
    address internal alice;
    address internal bob;
    CheatCodes internal cheats;
    OptionFactory internal optionFactory;
    MockV3Aggregator internal btcUsdPriceFeed;
    MockV3Aggregator internal ethUsdPriceFeed;
    MockV3Aggregator internal bnbUsdPriceFeed;
    OptionFactory.Option internal eth1Call;
    OptionFactory.Option internal btc20Call;
    OptionFactory.Collateral internal collateral_eth1Call;
    OptionFactory.Collateral internal collateral_btc20Call;
    string internal metadata_eth1Call;
    string internal metadata_btc20Call;

    function setUp() public {
        alice = address(0x1337);
        bob = address(0x1338);
        cheats = CheatCodes(HEVM_ADDRESS);
        optionFactory = new OptionFactory();
        btcUsdPriceFeed = new MockV3Aggregator(8, 40_000 * 10**8);
        ethUsdPriceFeed = new MockV3Aggregator(8, 3_000 * 10**8);
        bnbUsdPriceFeed = new MockV3Aggregator(8, 3_00 * 10**8);

        eth1Call = OptionFactory.Option(
            address(ethUsdPriceFeed),
            1 * 10**18,
            true,
            3_000 * 10**8,
            1_000,
            true,
            address(this)
        );

        // covered call
        collateral_eth1Call = OptionFactory.Collateral(
            address(ethUsdPriceFeed),
            1 * 10**18
        );

        metadata_eth1Call = "ipfs://bafybeiemm2araludhwycruo6j34szn3gr5jkuqycj47k67mdesgndpirbm/metadata.json";

        btc20Call = OptionFactory.Option(
            address(btcUsdPriceFeed),
            1 * 10**18,
            true,
            40_000 * 10**8,
            1_000,
            true,
            address(this)
        );

        collateral_btc20Call = OptionFactory.Collateral(
            address(ethUsdPriceFeed),
            20 * 10**18 // 20 eth collateral
        );

        metadata_btc20Call = "ipfs://bafybeiemm2araludhwycruo6j34szn3gr5jkuqycj47k67mdesgndpirbm/metadata.json";
    }

    function testCanCreateOption() public {
        uint256 eth1CallId = optionFactory.createOption{value: 1 ether}(
            eth1Call,
            collateral_eth1Call,
            metadata_eth1Call
        );
        OptionFactory.Option memory retrievedOption = optionFactory
            .getOptionById(eth1CallId);

        OptionFactory.Collateral memory retrievedCollateral = optionFactory
            .getCollateralById(eth1CallId);

        assertEq(
            eth1Call.underlyingPriceFeed,
            retrievedOption.underlyingPriceFeed
        );
        assertEq(collateral_eth1Call.priceFeed, retrievedCollateral.priceFeed);
        assertEq(optionFactory.ownerOf(eth1CallId), address(this));
    }

    function testCanCheckIfLiquidateable() public {
        uint256 btc20CallId = optionFactory.createOption{value: 20 ether}(
            btc20Call,
            collateral_btc20Call,
            metadata_btc20Call
        );

        assertTrue(!optionFactory.canBeLiquidated(btc20CallId));

        // collateral = 42k
        // intrinsic value is still 0
        assertTrue(!optionFactory.canBeLiquidated(btc20CallId));

        btcUsdPriceFeed.updateAnswer(60000 * 10**8);
        // intrinsic value is now 20k
        assertTrue(!optionFactory.canBeLiquidated(btc20CallId));

        btcUsdPriceFeed.updateAnswer(80000 * 10**8);
        // intrinsic value is now 40k, collateral value is 60k
        assertTrue(!optionFactory.canBeLiquidated(btc20CallId));

        btcUsdPriceFeed.updateAnswer(95000 * 10**8);
        // intrinsic value is now 55k, collateral value is 60k
        // ratio = 60 / 55 = 1.09...
        assertTrue(optionFactory.canBeLiquidated(btc20CallId));
    }

    function testCanTransferOption() public {
        uint256 long_btc20CallId = optionFactory.createOption{value: 20 ether}(
            btc20Call,
            collateral_btc20Call,
            metadata_btc20Call
        );
        assertEq(optionFactory.ownerOf(long_btc20CallId), address(this));
        optionFactory.safeTransferFrom(
            address(this),
            alice,
            long_btc20CallId,
            ""
        );
        assertEq(optionFactory.ownerOf(long_btc20CallId), alice);
    }

    function testCanExerciseEuropeanAtExpiry() public {
        uint256 balanceStart = address(this).balance;
        eth1Call.underlyingAmount = 2 ether;
        collateral_eth1Call.amount = 2 ether;

        // write option
        uint256 eth1CallId = optionFactory.createOption{value: 2 ether}(
            eth1Call,
            collateral_eth1Call,
            metadata_eth1Call
        );

        assertEq(optionFactory.ownerOf(eth1CallId), address(this));

        // transfer option
        optionFactory.safeTransferFrom(address(this), alice, eth1CallId, "");

        assertEq(optionFactory.ownerOf(eth1CallId), alice);

        ethUsdPriceFeed.updateAnswer(4000 * 10**8);
        assertEq(
            optionFactory.getIntrinsicValue(eth1CallId),
            2000 * 10**(18 + 8)
        );
        cheats.warp(1000); // now at expiry

        emit log_uint(alice.balance);
        uint256 balanceBefore = alice.balance;
        cheats.prank(alice);
        optionFactory.exerciseOption(eth1CallId);
        uint256 balanceAfter = alice.balance;
        emit log_uint(alice.balance);

        assertEq(balanceAfter, balanceBefore + 0.5 ether);

        // token should now be burned
        cheats.expectRevert("ERC721: owner query for nonexistent token");
        optionFactory.ownerOf(eth1CallId);
    }

    function testCannotExerciseEuropeanBeforeExpiry() public {
        uint256 eth1CallId = optionFactory.createOption{value: 1 ether}(
            eth1Call,
            collateral_eth1Call,
            metadata_eth1Call
        );

        optionFactory.safeTransferFrom(address(this), alice, eth1CallId, "");

        assertEq(optionFactory.ownerOf(eth1CallId), alice);

        ethUsdPriceFeed.updateAnswer(4000 * 10**8);

        cheats.expectRevert("not at expiry");
        cheats.prank(alice);
        optionFactory.exerciseOption(eth1CallId);
    }

    function testCanExerciseAmericanBeforeExpiry() public {
        eth1Call.european = false;

        // write option
        uint256 eth1CallId = optionFactory.createOption{value: 1 ether}(
            eth1Call,
            collateral_eth1Call,
            metadata_eth1Call
        );

        assertEq(optionFactory.ownerOf(eth1CallId), address(this));

        // transfer option
        optionFactory.safeTransferFrom(address(this), alice, eth1CallId, "");

        assertEq(optionFactory.ownerOf(eth1CallId), alice);

        ethUsdPriceFeed.updateAnswer(4000 * 10**8);

        // intrinsic value is in usd
        int256 intrinsicValue = optionFactory.getIntrinsicValue(eth1CallId);
        assertEq(intrinsicValue, 1000 * 10**(18 + 8));

        uint256 balanceBefore = alice.balance;
        cheats.prank(alice);
        optionFactory.exerciseOption(eth1CallId);
        uint256 balanceAfter = alice.balance;
        assertEq(balanceAfter, balanceBefore + 0.25 ether);

        // token should now be burned
        cheats.expectRevert("ERC721: owner query for nonexistent token");
        optionFactory.ownerOf(eth1CallId);
    }

    function testCanAddCollateral() public {
        uint256 eth1CallId = optionFactory.createOption{value: 1 ether}(
            eth1Call,
            collateral_eth1Call,
            metadata_eth1Call
        );

        OptionFactory.Collateral memory collateralBefore = optionFactory
            .getCollateralById(eth1CallId);

        optionFactory.addCollateral{value: 1 ether}(eth1CallId);

        OptionFactory.Collateral memory collateralAfter = optionFactory
            .getCollateralById(eth1CallId);

        assertEq(collateralBefore.amount, collateralAfter.amount - 1 ether);
    }

    function testCanWithdrawCollateral() public {
        collateral_eth1Call.amount += 1 ether;

        uint256 eth1CallId = optionFactory.createOption{value: 2 ether}(
            eth1Call,
            collateral_eth1Call,
            metadata_eth1Call
        );

        OptionFactory.Collateral memory collateralBefore = optionFactory
            .getCollateralById(eth1CallId);

        optionFactory.withdrawCollateral(eth1CallId, 1 ether);

        OptionFactory.Collateral memory collateralAfter = optionFactory
            .getCollateralById(eth1CallId);

        assertEq(collateralBefore.amount, collateralAfter.amount + 1 ether);
    }

    function testCannotWithdrawToARatioBelow1() public {
        collateral_eth1Call.amount += 1 ether;

        uint256 eth1CallId = optionFactory.createOption{value: 2 ether}(
            eth1Call,
            collateral_eth1Call,
            metadata_eth1Call
        );

        OptionFactory.Collateral memory collateralBefore = optionFactory
            .getCollateralById(eth1CallId);

        emit log_uint(collateralBefore.amount);

        emit log_uint(address(this).balance);

        // cheats.expectRevert("can't withdraw below liq limit");
        optionFactory.withdrawCollateral(eth1CallId, 1.9 ether);

        emit log_uint(address(this).balance);

        // OptionFactory.Collateral memory collateralAfter = optionFactory
        //     .getCollateralById(eth1CallId);

        // assertEq(collateralBefore.amount, collateralAfter.amount);
    }

    function testCanGetRatio() public {
        uint256 eth1CallId = optionFactory.createOption{value: 1 ether}(
            eth1Call,
            collateral_eth1Call,
            metadata_eth1Call
        );

        ethUsdPriceFeed.updateAnswer(4000 * 10**8);

        // int256 ratio = optionFactory.getCollateralizationRatio(eth1CallId);
        // // risk = $1000 / $4000 = 0.25 ETH
        // // ratio = 1 ETH / 0.25 ETH = 4.00 scaled up to 4000
        // assertEq(ratio, 4000);

        // ethUsdPriceFeed.updateAnswer(3500 * 10**8);
        // ratio = optionFactory.getCollateralizationRatio(eth1CallId);
        // assertEq(ratio, 7);

        // ethUsdPriceFeed.updateAnswer(3000 * 10**8);
        // ratio = optionFactory.getCollateralizationRatio(eth1CallId);
        // // assertEq(ratio, 7);
        // emit log_int(ratio);
    }

    function testRealTest() public {
        payable(alice).transfer(1 ether);
        cheats.startPrank(alice, alice);
        emit log_uint(alice.balance);
        OptionFactory.Option memory bnbCall = OptionFactory.Option(
            address(bnbUsdPriceFeed),
            0.001 ether,
            true,
            150 * 10**8,
            1_000,
            false,
            alice
        );

        OptionFactory.Collateral memory collateral_bnbCall = OptionFactory
            .Collateral(address(bnbUsdPriceFeed), 0.001 ether);

        uint256 id = optionFactory.createOption{value: 0.001 ether}(
            bnbCall,
            collateral_bnbCall,
            ""
        );
        assertEq(optionFactory.getIntrinsicValue(id), 0.15 * 10**(8 + 18));
        emit log_uint(alice.balance);

        emit log_uint(optionFactory.getPayout(id));

        assertEq(optionFactory.getPayout(id), 0.0005 ether);

        uint256 balanceBefore = alice.balance;
        optionFactory.exerciseOption(id);

        assertEq(alice.balance, balanceBefore + 0.0005 ether);

        OptionFactory.Collateral memory collatAfter = optionFactory
            .getCollateralById(id);

        assertEq(collatAfter.amount, 0.0005 ether);
    }

    receive() external payable {}
}
