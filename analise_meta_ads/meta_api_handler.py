import requests
import datetime
import os

class MetaAPIHandler:
    def __init__(self, access_token, ad_account_id):
        self.access_token = access_token
        self.ad_account_id = ad_account_id
        self.base_url = "https://graph.facebook.com/v19.0"

    def buscar_metricas(self, dias=15):
        hoje = datetime.date.today()
        inicio = (hoje - datetime.timedelta(days=dias)).strftime('%Y-%m-%d')
        fim = hoje.strftime('%Y-%m-%d')

        url = f"{self.base_url}/act_{self.ad_account_id}/insights"

        params = {
            "access_token": self.access_token,
            "fields": "campaign_name,impressions,clicks,spend,ctr,cpc,actions,action_values,account_name",
            "time_range": {"since": inicio, "until": fim},
            "level": "campaign",
            "limit": 1000
        }

        response = requests.get(url, params=params)
        if response.status_code != 200:
            print("Erro ao buscar dados da conta:", self.ad_account_id)
            return None

        return response.json()

    def verificar_saldo_conta(self):
        url = f"{self.base_url}/act_{self.ad_account_id}?fields=amount_spent,balance&access_token={self.access_token}"
        response = requests.get(url)
        if response.status_code != 200:
            return None
        return response.json()