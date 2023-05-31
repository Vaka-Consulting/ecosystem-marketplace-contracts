import { Machine, PCurrencySymbol, PPubKeyHash, PScriptContext, PTokenName, dataFromCbor, pBool, pData } from "@harmoniclabs/plu-ts";
import { NFTSale, SaleAction, contract } from "../../contracts/marketplace";
import { fromHex } from "@harmoniclabs/uint8array-utils";

const datumData = dataFromCbor("d8799f192710581c016814c7ba1e79bf8434a102736e3d4c382e6b2c1e77049e778d330d581cf98d5ea96323da4ed14067d4fa7b84701beb1e705b7991dad3b2ce3b40ff");

const redeemerData = dataFromCbor("d87980");

const ctxData = dataFromCbor("d8799fd8799f9fd8799fd8799fd8799f582064e89ba588f9523852ecbcdbfd32f9874468c9923044b554ef2b535268e1c970ff00ffd8799fd8799fd87a9f581ca7fb6b082f956b8de39ff6903f92ea8be78cd7a667c7aba866fa957bffd87a80ffbf40bf401a001e8480ff581cf98d5ea96323da4ed14067d4fa7b84701beb1e705b7991dad3b2ce3bbf4001ffffd87b9fd8799f192710581c016814c7ba1e79bf8434a102736e3d4c382e6b2c1e77049e778d330d581cf98d5ea96323da4ed14067d4fa7b84701beb1e705b7991dad3b2ce3b40ffffd87a80ffffd8799fd8799fd8799f582064e89ba588f9523852ecbcdbfd32f9874468c9923044b554ef2b535268e1c970ff01ffd8799fd8799fd8799f581c016814c7ba1e79bf8434a102736e3d4c382e6b2c1e77049e778d330dffd87a80ffbf40bf401b0000000252655cd1ff581c0462de27174c88689ec9fe0e13777e1ed52285510300796e16b88acfbf401a000f4240ffffd87980d87a80ffffff9fd8799fd8799fd8799f58203767608e1e96e8c6d9e2f50416847be3dccbbe74ae35c795e35b181fc0b2ec15ff01ffd8799fd8799fd87a9f581c82adff728286ab5ae1dce89b16a7b2402adcdda250c28f634771ea25ffd87a80ffbf40bf401a001e8480ff581cf84eb52734381be98a01311283cadd0bd4ac62ab8bca73a388093e79bf4001ffffd87b9f1961a8ffd87a80ffffd8799fd8799fd8799f582095dfb5af6fd32833f3f348bf88fbcd15e7193c41785d86210351ea1a9ea78112ff00ffd8799fd8799fd87a9f581ca7fb6b082f956b8de39ff6903f92ea8be78cd7a667c7aba866fa957bffd87a80ffbf40bf401a00989680ffffd87b9f40ffd8799f581ca7fb6b082f956b8de39ff6903f92ea8be78cd7a667c7aba866fa957bffffffff9fd8799fd8799fd8799f581c016814c7ba1e79bf8434a102736e3d4c382e6b2c1e77049e778d330dffd87a80ffbf40bf401a001e8480ff581cf98d5ea96323da4ed14067d4fa7b84701beb1e705b7991dad3b2ce3bbf4001ffffd87980d87a80ffd8799fd8799fd8799f581c016814c7ba1e79bf8434a102736e3d4c382e6b2c1e77049e778d330dffd87a80ffbf40bf401a001e8480ff581c0462de27174c88689ec9fe0e13777e1ed52285510300796e16b88acfbf4018faffffd87980d87a80ffd8799fd8799fd8799f581c016814c7ba1e79bf8434a102736e3d4c382e6b2c1e77049e778d330dffd87a80ffbf40bf401a001e8480ff581c0462de27174c88689ec9fe0e13777e1ed52285510300796e16b88acfbf40192616ffffd87980d87a80ffd8799fd8799fd8799f581c016814c7ba1e79bf8434a102736e3d4c382e6b2c1e77049e778d330dffd87a80ffbf40bf401b0000000252255be4ff581c0462de27174c88689ec9fe0e13777e1ed52285510300796e16b88acfbf401a000f1b30ffffd87980d87a80ffffbf40bf401a0002f7edffffbf40bf4000ffff80a0d8799fd8799fd87980d87980ffd8799fd87b80d87a80ffff9f581c016814c7ba1e79bf8434a102736e3d4c382e6b2c1e77049e778d330dffbfd87a9fd8799fd8799f582064e89ba588f9523852ecbcdbfd32f9874468c9923044b554ef2b535268e1c970ff00ffffd87980ffa058209cde359b8985705ab44b6212d86a5b50f2224ae413bf3d1a17932deb1e6cb8c9ffd87a9fd8799fd8799f582064e89ba588f9523852ecbcdbfd32f9874468c9923044b554ef2b535268e1c970ff00ffffff");

const completeContract = contract
.$( PCurrencySymbol.from( fromHex("0462de27174c88689ec9fe0e13777e1ed52285510300796e16b88acf") ) )
.$( PTokenName.from( new Uint8Array(0) ) )
.$( PPubKeyHash.from( fromHex("016814c7ba1e79bf8434a102736e3d4c382e6b2c1e77049e778d330d") ) )
.$( PCurrencySymbol.from( fromHex("f84eb52734381be98a01311283cadd0bd4ac62ab8bca73a388093e79") ) )
.$( PTokenName.from( new Uint8Array(0) ) )

test("yey", () =>  {
   
    const { result, budgetSpent, logs } = Machine.eval(
        completeContract
        .$(
            NFTSale.fromData( pData( datumData ) )
        )
        .$(
            SaleAction.fromData( pData( redeemerData ) )
        )
        .$(
            PScriptContext.fromData( pData( ctxData ) )
        )
    );

    expect( result ).toEqual(
        Machine.evalSimple( pBool( true ) )
    );

});