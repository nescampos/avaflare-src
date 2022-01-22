const serverUrl = "https://g26vfddx4srs.usemoralis.com:2053/server";
const appId = "H9ucEGlWzLscZbMvgpxDawOpftrxpheGw5rFaCG6";
const covalentId = "ckey_756a9fcc593742108e6204976ff";

var pools = [];
var balances = [];

Moralis.start({ serverUrl, appId });

var user = Moralis.User.current();

/* Authentication code */
async function login() {
  
  if (!user) {
    user = await Moralis.authenticate({ signingMessage: "Log in Avaflare" })
      .then(async function (user) {
        console.log("logged in user:", user);
        location.href = 'index.html';
      })
      .catch(function (error) {
        console.log(error);
      });
      
      
  }
}

async function getBalances() {
  const balance = await Moralis.Web3API.account.getNativeBalance({chain:'avalanche', address: Moralis.User.current().get("ethAddress")});
  console.log(balance);
  const tokenBalances = await Moralis.Web3API.account.getTokenBalances({chain:'avalanche', address: Moralis.User.current().get("ethAddress")});
  tokenBalances.forEach( function(valor, indice, array) {
    if(valor.balance != "0") {
      balances.push(valor.name);
    }
  });
  $('.view_balance_address').text(balance.balance*10e17);
  $('.view_tokens').text(tokenBalances.join());
    
}

async function logOut() {
  await Moralis.User.logOut();
  console.log("logged out");
  location.href = 'login.html';
}

function getXYKPools(dex) {
  const settings = {
    "async": true,
    "crossDomain": true,
    "url": "https://api.covalenthq.com/v1/43114/xy=k/"+dex+"/pools/?key="+covalentId,
    "method": "GET",
    "headers": {
      "content-type": "application/json",
    },
    "processData": false
   };
  
  $.ajax(settings).done(function (response) {
    response.data.items.forEach( function(valor, indice, array) {
      var token_0_avai = balances.indexOf(valor.token_0.contract_name)  != -1;
      var token_1_avai = balances.indexOf(valor.token_1.contract_name)  != -1;
      pools.push({annualized_fee:valor.annualized_fee, block_height:valor.block_height, dex_name:valor.dex_name, total_liquidity_quote:valor.total_liquidity_quote
        , token_0_contract_name:valor.token_0.contract_name, token_0_contract_ticker_symbol:valor.token_0.contract_ticker_symbol, token_0_logo_url:valor.token_0.logo_url 
        , token_1_contract_name:valor.token_1.contract_name, token_1_contract_ticker_symbol:valor.token_1.contract_ticker_symbol, token_1_logo_url:valor.token_1.logo_url
        , token_0_available :token_0_avai, token_1_available : token_1_avai });
    });
    renderTable();
  }).fail(function (response) {
    console.log(response);
  });
} 

function dynamicSort(property) {
  var sortOrder = 1;
  if(property[0] === "-") {
      sortOrder = -1;
      property = property.substr(1);
  }
  return function (a,b) {
      /* next line works with strings and numbers, 
       * and you may want to customize it to your needs
       */
      var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
      return result * sortOrder;
  }
}

function renderTable(filter_by_availability) {
  var pools_render = pools.sort(dynamicSort('annualized_fee')).reverse();;
  if(filter_by_availability) {
    pools_render = pools_render.filter(x => x.token_0_available == true || x.token_1_available == true)
  }
  var tbody = document.getElementById('tbody_pools');

  $("#tbody_pools").empty();

  for (var i = 0; i < pools_render.length; i++) {
      var tr = "<tr>";

      /* Must not forget the $ sign */
      tr += "<td>" + pools_render[i].dex_name + "</td>" + "<td>" + pools_render[i].token_0_contract_name + " ("+pools_render[i].token_0_contract_ticker_symbol+")</td>" + "<td>" + pools_render[i].token_1_contract_name + " ("+pools_render[i].token_1_contract_ticker_symbol+")</td>" + "<td>" + pools_render[i].total_liquidity_quote + "</td>" + "<td>" + pools_render[i].block_height + "</td>" + "<td>" + (pools_render[i].annualized_fee*100).toFixed(2)+"%" + "</td></tr>";

      /* We add the table row to the table body */
      tbody.innerHTML += tr;
  }
}


$(function()
{
  if(user) {
    getBalances();
    getXYKPools('pangolin');
    getXYKPools('traderjoe');
    getXYKPools('sushiswap');
    $('.current_account').qrcode(Moralis.User.current().get("ethAddress"));
    $('.current_account_text').text(Moralis.User.current().get("ethAddress"));
  }
  else {
    login();
  }
    $('#generateWalletPrivKeyButton').click(
        function() {
          login()});

    $('#btnLogout').click(
      function() {
        logOut()});

  $('#filter_available' ).on( 'click', function() {
          if( $(this).is(':checked') ){
            renderTable(true);
          } else {
            renderTable(false);
          }
      });

}
    
);