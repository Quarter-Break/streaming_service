var options = {
    hostname: 'localhost',
    port: 4343,
    path: '/api/track/6061c90b2658b9001e65311d',
    method: 'GET',

  };
  
  var req = http.request(options, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      console.log('BODY: ' + chunk);
    });
  });