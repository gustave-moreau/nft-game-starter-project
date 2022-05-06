import React, {useEffect, useState} from "react";
import {ethers} from "ethers";
import { CONTRACT_ADDRESS, transformCharacterData } from "../../constants";
import myEpicGame from "../../utils/MyEpicGame.json";
import "./Arena.css";
import LoadingIndicator from "../LoadingIndicator";

//characterNFTのメタデータを渡します
const Arena = ({characterNFT, setCharacterNFT}) =>{
    //コントラクトのデータを保有する状態変数を初期化する
    const [gameContract, setGameContract] = useState(null);
    //ボスのメタデータを保存する状態変数
    const[boss, setBoss] = useState(null);
    //コントラクトのデータを保有する状態変数を初期化
    const[attackState, setAttackState] = useState("");
    const[showToast, setShowToast] = useState(false);
    
    //ページがロードすると実行
    useEffect(() =>{
        //コントラクトからボスのメタデータを取得、bossを設定する非同期関数fetchBossを設定
        const fetchBoss = async () =>{
            const bossTxn = await gameContract.getBigBoss();
            console.log("Boss: ", bossTxn);
            setBoss(transformCharacterData(bossTxn));
        };
        
        //AttackCompleteイベントを受信したときに起動するコールバックメソッド
        const onAttackComplete = (newBossHp, newPlayerHp) =>{
            //bossのHP
            const bossHp = newBossHp.toNumber();
            //NFTキャラの新しHP
            const playerHp = newPlayerHp.toNumber();
            console.log(`AttackComplete: Boss Hp: ${bossHp} Player Hp: ${playerHp}`);
            //キャラとボスのHP更新
            setBoss((prevState) =>{
                return{ ...prevState, hp:bossHp};
            });
            setCharacterNFT((prevState) =>{
                return{ ...prevState, hp:playerHp};
            });
        };
        
        if(gameContract){
            //コントラクトの準備が出来たらボスのメタデータを取得
            fetchBoss();
            gameContract.on("AttackComplete", onAttackComplete);
        }
        //コンポーネントがマウントされたらリスナーを停止
        return () =>{
            if(gameContract){
                gameContract.off("AttackComplete", onAttackComplete);
            }
        };
    },[gameContract]);

    //NFTcharaがボスを攻撃する際に使用する関数
    const runAttackAction = async () => {
        try{
            if(gameContract){
                setAttackState("attacking");
                console.log("Attacking boss...");
                //NFTキャラがボスを攻撃
                const attackTxn = await gameContract.attackBoss();
                //tranzactionの承認を待つ
                await attackTxn.wait();
                console.log("attackTxn:", attackTxn);
                //attackStateの状態をhitに設定
                setAttackState("hit");
            }

            setShowToast(true);
            setTimeout(() =>{
                setShowToast(false);
            }, 5000);
        }catch(error){
            console.error("Error attacking boss:", error);
            setAttackState("");
        }
    };

    //ページがロードするとuseEffect
    useEffect(() => {
        const {ethereum} =window;
        if(ethereum){
            const provider = new ethers.providers.Web3Provider(ethereum);
            const signer = provider.getSigner();
            const gameContract = new ethers.Contract(
                CONTRACT_ADDRESS,myEpicGame.abi,signer
            );
            setGameContract(gameContract);
        }else{
            console.log("Ethereum object not found");
        }
    },[]);

    return(
        <div className="arena-container">
            {boss && characterNFT && (
                <div id="toast" className={showToast ? "show" : ""}>
                    <div id="desc">{`${boss.name} was hit for ${characterNFT.attackDamage}!`}</div>
                </div>
            )}
            {boss && (
                <div className="boss-container">
                    <div className={`boss-content ${attackState}`}>
                        <h2>{boss.name}</h2>
                        <div className="image-content">
                            <img src={boss.imageURI} alt={`Boss ${boss.name}`}/>
                            <div className="health-bar">
                                <progress value={boss.hp} max={boss.maxHp}/>
                                <p>{`${boss.hp} / ${boss.maxHp} HP`}</p>
                            </div>
                        </div>
                    </div>
                    <div className="attack-container">
                        <button className="cta-button" onClick={runAttackAction}>
                            {`Attack${boss.name}`}
                        </button>
                    </div>
                    {attackState === "attacking" && (
                        <div className="loading-indicator">
                            <LoadingIndicator />
                            <p>Attacking</p>
                        </div>
                    )}
                </div>
            )}
            {characterNFT && (
                <div className="players-container">
                    <div className="player-container">
                        <h2>Your Character</h2>
                        <div className="player">
                            <div className="image-content">
                                <h2>{characterNFT.name}</h2>
                                <img src={`https://cloudflare-ipfs.com/ipfs/${characterNFT.imageURI}`} alt={`Character${characterNFT.name}`}/>
                                <div className="health-bar">
                                    <progress value={characterNFT.hp} max={characterNFT.maxHp}/>
                                    <p>{`${characterNFT.hp} / ${characterNFT.maxHp} HP`}</p>                                    
                                </div>
                            </div>
                            <div className="stats">
                                <h4>{`Attack Damage: ${characterNFT.attackDamage}`}</h4>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Arena;