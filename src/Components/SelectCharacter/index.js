import React, { useEffect, useState } from "react";
import "./SelectCharacter.css";
import { ethers } from "ethers";
import {CONTRACT_ADDRESS, transformCharacterData} from "../../constants";
import myEpicGame from "../../utils/MyEpicGame.json";
import LoadingIndicator from "../LoadingIndicator";

const SelectCharacter = ({ setCharacterNFT }) => {
  const[characters, setCharacters] =useState([]);
  const[gameContract, setGameContract] = useState(null);
  const[mintingCharacter, setMintingCharacter] = useState(false);
  
  //NFTキャラをミント
  const mintCharacterNFTAction = (characterId) => async () =>{
    try{
      if(gameContract){
        setMintingCharacter(true);

        console.log("Minting character in progress...");
        const mintTxn = await gameContract.mintCharacterNFT(characterId);
        await mintTxn.wait();
        console.log("mintTxn:", mintTxn);
        setMintingCharacter(false);
      }
    }catch(error){
      console.warn("MintCharacterAction Error:", error);
      setMintingCharacter(false);
    }
  }
  useEffect(() => {
    const { ethereum } = window;
    if(ethereum){
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(CONTRACT_ADDRESS,myEpicGame.abi,signer);

      setGameContract(gameContract);
    }else{
      console.log("Ethereum object not found");
    }     
  },[]);

  useEffect(() =>{
    //キャラデータ取得
    const getCharacters = async () => {
      try{
        console.log("Getting contract characters to mint");
        const charactersTxn = await gameContract.getAllDefaultCharacters();

        console.log("charactersTxn:", charactersTxn);
        //全てのNFTキャラクターのデータを変換
        const characters = charactersTxn.map((CharacterData) => transformCharacterData(CharacterData));
        //ミント可能なすべてのNFTキャラクターの状態を設定
        setCharacters(characters);
      }catch(error){
        console.error("Something went wrong fetching characters: ", error);
      }
    };

    // イベントを受信したときに起動するコールバックメソッドを追加
    const onCharacterMint = async(sender, tokenId, characterIndex) =>{
      console.log(`CharacterNFTMinted - sender: ${sender} tokenId: ${tokenId.toNumber()} characterIndex: ${characterIndex.toNumber()}`);
      //mint後メタデータを受け取りアリーナに移動するための状態にする
      if(gameContract){
        const characterNFT = await gameContract.checkIFUserHasNFT();
        console.log("CharacterNFT: ", characterNFT);
        setCharacterNFT(transformCharacterData(characterNFT));
        alert(
          `NFTキャラクターがmintされました --URL:https://rinkeby.rarible.com/token/${gameContract.address}:${tokenId.toNumber()}?tab=details`
        )
      }
    };

    if(gameContract){
      getCharacters();
      gameContract.on("CharacterNFTMinted", onCharacterMint);
    }

    return () =>{
      //gameContractの準備が出来たらNFTキャラを読み込む
      if(gameContract){
        gameContract.off("CharacterNFTMinted", onCharacterMint);
      }
    };
  },[gameContract]);

  //NFTcharaをフロントエンドにレンダリング
  const renderCharacters  = () =>
   characters.map((character, index) => (
      <div className="character-item" key={character.name}>
        <div className="name-container">
          <p>{character.name}</p>
        </div>
        <img src={`https://cloudflare-ipfs.com/ipfs/${character.imageURI}`} alt={character.name}/>
        <button type="button" className="character-mint-button" onClick={mintCharacterNFTAction(index)}>{`Mint ${character.name}`}</button>
      </div>
   ));

  return (
    <div className="select-character-container">
      <h2>⏬ 一緒に戦う NFT キャラクターを選択 ⏬</h2>
      {characters.length > 0 && ( 
        <div className="character-grid">{renderCharacters()}</div>
      )}
      {mintingCharacter && (
        <div className="loading">
          <div className="indicator">
            <LoadingIndicator/>
            <p>Minting In Progress...</p>
          </div>
        </div>
      )}
    </div>
  );
};
export default SelectCharacter;