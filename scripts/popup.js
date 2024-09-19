document.getElementById('save-api-token-button').onclick = saveApiToken;
loadApiToken()

function loadApiToken() {
    chrome.storage.local.get(['apiToken'], function (result) {
        if ('apiToken' in result) {
            document.getElementById('api-token-input').value = result['apiToken'];
        }
    });
}

function saveApiToken() {
    const apiToken = document.getElementById('api-token-input').value;
    chrome.storage.local.set({"apiToken": apiToken}, function () {
        loadApiToken();
        alert('API Token saved');
    })
}
