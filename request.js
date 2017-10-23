import rp from 'request-promise'
import qs from 'qs'
import cheerio from 'cheerio'

const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:49.0) Gecko/20100101 Firefox/49.0',
  'Upgrade-Insecure-Requests': '1',
  'Content-Type': 'application/x-www-form-urlencoded',
}

const defaultOptions = {
  jar: rp.jar(),
  gzip: true,
  followAllRedirects: true,
  resolveWithFullResponse: true,
  headers: defaultHeaders,
}

const requestPromise = rp.defaults(defaultOptions)
const request = async requestOptions => await requestPromise(requestOptions)

// Encode function taken from NAB source.
const encode = (p, k, a) => {
  for (let i = a.length - 1; i > 0; i--) {
    if (i !== a.indexOf(a.charAt(i))) {
      a = a.substring(0, i) + a.substring(i + 1);
    }
  }
  const r = new Array(p.length);
  for (let i = 0; i < p.length; i++) {
    r[i] = p.charAt(i);
    let pi = a.indexOf(p.charAt(i));
    if (pi >= 0 && i < k.length) {
      const ki = a.indexOf(k.charAt(i));
      if (ki >= 0) {
        pi -= ki;
        if (pi < 0) pi += a.length;
        r[i] = a.charAt(pi);
      }
    }
  }
  return r.join('');
};

const credentials = { username: process.env.NAB_USERNAME, password: process.env.NAB_PASSWORD }
let csrfToken = undefined

const nabLogin = async credentials => {
  const options = {};
  
  options.url = 'https://ib.nab.com.au/nabib/index.jsp';
  await request(options).then((response) => {
    console.log(response.body.length)
    const $ = cheerio.load(response.body);

    credentials.password = encode(credentials.password, $('#webKey').attr('value'), $('#webAlpha').attr('value'));

    csrfToken = $('input[name=\'org.apache.struts.taglib.html.TOKEN\']').val();
  });

  options.url = 'https://ib.nab.com.au/nabib/loginProcess.ctl';
  options.method = 'POST';
  options.body = qs.stringify({
    browserData: '',
    'org.apache.struts.taglib.html.TOKEN': csrfToken,
    userid: credentials.username,
    password: credentials.password,
    login:"Login"
  });

  const validLoginWithoutSplash = await request(options).then((response) => {      
    // Handle Authentication Errors - 'response.request.uri.search' is set to ?error=xxx on error
    if (response.request.uri.search !== null && response.request.uri.search.indexOf('=') >= 0) {
      // Throw Error...
    }
  
    // Check valid login.
    const $ = cheerio.load(response.body);
    if ($('#accountBalances_nonprimary_subaccounts tbody tr').length > 0){
      console.log(true)
    } else {
      console.log(false)
    }
  });
}

nabLogin(credentials)
