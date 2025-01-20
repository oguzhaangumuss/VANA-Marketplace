export const config = {
    name: "Serica Test NFT Collection", //koleksiyon adı
    description: "A Serica's test NFT collection on Vana Network", //koleksiyon açıklaması
    supply: 20, //koleksiyon arzı
    token_uri: "https://api.serica.com/metadata/", //koleksiyon token uri
    royalty_percent: 5, //royalty yüzdesi
    royalty_wallet: "0x57093af844a282f04bf302fA2B43d537E4BfDFE7", //royalty wallet adresi
    iterated_uri: true, //bu ne demek bilmiyorum
    hidden_metadata: false, //metadata gizli mi
    placeholder_token_uri: "https://api.serica.com/hidden.json", //placeholder token uri
    groups: [
        {
            name: "whitelist", //grup adı
            merkle_root: null, //merkle root
            max_tokens: 10, //bu grup için maksimum token sayısı
            unit_price: 10, //mint fiyatı
            mintPerWallet: 2,  // <- Her cüzdan max 2 mint yapabilir
            creators: [
                {
                    address: "0x57093af844a282f04bf302fA2B43d537E4BfDFE7", //yönetici adresi
                    share: 100 //yönetici payı
                }
            ],
            start_time: "2024-12-31T11:30:05Z", //mint başlangıç zamanı
            end_time: null //mint bitiş zamanı
        },
        {
            name: "public",
            merkle_root: null,
            max_tokens: 10,
            unit_price: 20,
            mintPerWallet: 5,  // <- Her cüzdan max 5 mint yapabilir
            creators: [
                {
                    address: "0x57093af844a282f04bf302fA2B43d537E4BfDFE7",
                    share: 100
                }
            ],
            start_time: "2024-12-31T12:00:05Z",
            end_time: null
        }
    ]
}; 