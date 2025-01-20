import requests

# API anahtarı
api_key = "c067a310-3204-481b-96df-68bf3ed836ae"

# VANA Coin sorgusu
url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest"
parameters = {
    "symbol": "VANA",  # VANA yerine doğru sembolü kullanın
    "convert": "USD"
}
headers = {
    "Accepts": "application/json",
    "X-CMC_PRO_API_KEY": api_key,
}

response = requests.get(url, headers=headers, params=parameters)
data = response.json()

# Sonuçları yazdırma
print("Coin Adı:", data["data"]["VANA"]["name"])
print("Fiyat (USD):", data["data"]["VANA"]["quote"]["USD"]["price"])
print("Piyasa Değeri (USD):", data["data"]["VANA"]["quote"]["USD"]["market_cap"])