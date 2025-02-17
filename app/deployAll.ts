import { Tx, TxBuilder, TxOut, TxOutRef, UTxO } from "@harmoniclabs/plu-ts";
import { tryGetMarketplaceConfig } from "./utils/tryGetMarketplaceConfig";
import { withFolder } from "./utils/withFolder";
import { getProtocolParams } from "./utils/getProtocolParams";
import { getMintOneShotTx } from "./txns/getMintOneShotTx";
import { makeFeeOracleAndGetDeployTx } from "./txns/feeOracle/makeFeeOracleAndGetDeployTx";
import { makeMarketplaceAndGetDeployTx } from "./txns/marketplace/makeMarketplaceAndGetDeployTx";
import { provider } from "./providers/provider";
import { BlockfrostPluts } from "@harmoniclabs/blockfrost-pluts";

function getOutAsUTxO( tx: Tx, idx: number ): UTxO
{
    return new UTxO({
        utxoRef: new TxOutRef({
            id: tx.hash.toString(),
            index: idx
        }),
        resolved: tx.body.outputs[ idx ]
    });
}

/** waits n seconds (60 default) */
async function wait( n = 60 )
{
    console.log(`waiting ${n} seconds to allow for the transaction to be included in the chain`);
    await new Promise( res => setTimeout( res, n * 1000 ) );    
}

void async function main()
{
    const cfg = tryGetMarketplaceConfig();

    const env = cfg.envFolderPath;

    await  withFolder( env );

    const queryUtxosAt = provider instanceof BlockfrostPluts ?
        provider.addressUtxos.bind( provider ) :
        provider.address.utxos.bind( provider.address );
    const submitTx = provider instanceof BlockfrostPluts ?
        provider.submitTx.bind( provider ) :
        provider.tx.submit.bind( provider.tx );

    const privateKey = cfg.signer.skey;
    const publicKey = cfg.signer.vkey;
    const addr = cfg.signer.address;
    
    const txBuilder = new TxBuilder(
        await getProtocolParams()
    );

    let utxos = await queryUtxosAt( addr );
    
    const initialUtxo = utxos.find( u => u.resolved.value.lovelaces >= 5_200_000 ) ?? utxos[0];

    console.log(`using utxo '${initialUtxo.utxoRef}' as initial utxo parameter`);

    let { tx, nftPolicySource } = await getMintOneShotTx(
        txBuilder,
        initialUtxo,
        addr
    );

    tx.signWith( privateKey );

    const asset = tx.body.outputs[0].value.map.find(f=>f.policy!="" && f.assets.find(f=>f.quantity==1));

    const feeOraceNFTPolicy = asset?.policy.toString();

    let txHash = await submitTx( tx );

    console.log([
        `-------------------------------------------------------------------------`,
        `submitted tx that mints the feeOracle NFT identifyier;`,
        `tx hash: ${txHash}`,
        `-------------------------------------------------------------------------`
    ].join("\n"));

    await wait();

    tx = await makeFeeOracleAndGetDeployTx(
        txBuilder,
        getOutAsUTxO( tx, 0 ),
        addr,
        nftPolicySource.hash,
        publicKey
    );

    tx.signWith( privateKey );

    txHash = await submitTx( tx );

    console.log([
        `-------------------------------------------------------------------------`,
        `submitted tx that deploys the feeOracle contract;`,
        `tx hash: ${txHash}`,
        `source was deployed to utxo: ${txHash}#0`,
        `at the feeOracleAddress: ${tx.body.outputs[0].address}`,
        `fee oracle NFT policy : ${feeOraceNFTPolicy}`,
        `-------------------------------------------------------------------------`
    ].join("\n"));

    await wait();

    tx = await makeMarketplaceAndGetDeployTx(
        txBuilder,
        getOutAsUTxO( tx, 2 ),
        addr,
        initialUtxo.utxoRef
    );

    tx.signWith( privateKey );

    txHash = await submitTx( tx );

    console.log([
        `-------------------------------------------------------------------------`,
        `submitted tx that deploys the marketplace;`,
        `tx hash: ${txHash}`,
        `source was deployed to utxo: ${txHash}#0`,
        `at the marketplaceAddress: ${tx.body.outputs[0].address}`,
        `-------------------------------------------------------------------------`
    ].join("\n"));
}()