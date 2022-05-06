const CONTRACT_ADDRESS = "0xa726B9dcA9A39f43a8d70A68808C6bb3AC71174f";

const transformCharacterData = (characterData) => {
    return{
        name: characterData.name,
        imageURI: characterData.imageURI,
        hp: characterData.hp.toNumber(),
        maxHp: characterData.maxHp.toNumber(),
        attackDamage: characterData.attackDamage.toNumber(),
    }
}
export{CONTRACT_ADDRESS, transformCharacterData};