# IndexNow
Manual & Auto submit url IndexNow Api menggunakan Google Apps Script (GAS), dan catat log di Spreadsheets.

## Script property
- IndexNow_KEY : 8f947d2fcacb4e328b38xxxx
- SPREADSHEETS_ID : 1LRuYLDPzNWpQP4LPZqdW6lHwdeVKxxxxxxx
- TARGET_POINTS : ["https://api.indexnow.org/indexnow","https://yandex.com/indexnow"]
- idx_cache_final : []

### Generate API Key
- https://www.bing.com/indexnow/getstarted

### Respons
HTTP Code - Response & Reasons
- 200 : Ok - URL submitted successfully
- 202 : Accepted - URL received. IndexNow key validation pending.
- 400 : Bad request - Invalid format
- 403 : Forbidden - In case of key not valid
- 422 : Unprocessable Entity - URLs don’t belong to the host or the key is not matching the schema in the protocol
- 429 : Too Many Requests - Too Many Requests (potential Spam)
