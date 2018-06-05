

//==========================================================================================
// Global Configs  

var fhirVersion = 'fhir-3.0.0';

if(typeof oAuth2Server === 'object'){
  // TODO:  double check that this is needed; and that the /api/ route is correct
  JsonRoutes.Middleware.use(
    // '/api/*',
    '/fhir-3.0.0/*',
    oAuth2Server.oauthserver.authorise()   // OAUTH FLOW - A7.1
  );
}

JsonRoutes.setResponseHeaders({
  "content-type": "application/fhir+json"
});



//==========================================================================================
// Global Method Overrides

// this is temporary fix until PR 132 can be merged in
// https://github.com/stubailo/meteor-rest/pull/132

JsonRoutes.sendResult = function (res, options) {
  options = options || {};

  // Set status code on response
  res.statusCode = options.code || 200;

  // Set response body
  if (options.data !== undefined) {
    var shouldPrettyPrint = (process.env.NODE_ENV === 'development');
    var spacer = shouldPrettyPrint ? 2 : null;
    res.setHeader('Content-type', 'application/fhir+json');
    res.write(JSON.stringify(options.data, null, spacer));
  }

  // We've already set global headers on response, but if they
  // pass in more here, we set those.
  if (options.headers) {
    //setHeaders(res, options.headers);
    options.headers.forEach(function(value, key){
      res.setHeader(key, value);
    });
  }

  // Send the response
  res.end();
};




//==========================================================================================
// Step 1 - Create New Rule  

JsonRoutes.add("put", "/Rule/:id", function (req, res, next) {
  process.env.DEBUG && console.log('PUT /fhir-1.6.0/Rule/' + req.params.id);
  //process.env.DEBUG && console.log('PUT /fhir-1.6.0/Rule/' + req.query._count);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("content-type", "application/fhir+json");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  var accessToken;

  if(typeof oAuth2Server === 'object'){
    accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});    
  } 
//   else {
//     // no oAuth server installed; Not Implemented
//     JsonRoutes.sendResult(res, {
//       code: 501
//     });
//   }

    if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {
      if (accessToken) {
        process.env.TRACE && console.log('accessToken', accessToken);
        process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
      }


      if (req.body) {
        ruleUpdate = req.body;

        // remove id and meta, if we're recycling a resource
        delete req.body.id;
        delete req.body.meta;

        //process.env.TRACE && console.log('req.body', req.body);

        ruleUpdate.resourceType = "Rule";
        ruleUpdate = Rules.toMongo(ruleUpdate);

        //process.env.TRACE && console.log('ruleUpdate', ruleUpdate);


        ruleUpdate = Rules.prepForUpdate(ruleUpdate);


        process.env.DEBUG && console.log('-----------------------------------------------------------');
        process.env.DEBUG && console.log('ruleUpdate', JSON.stringify(ruleUpdate, null, 2));
        // process.env.DEBUG && console.log('newRule', newRule);

        var rule = Rules.findOne(req.params.id);
        var ruleId;

        if(rule){
          process.env.DEBUG && console.log('Rule found...')
          ruleId = Rules.update({_id: req.params.id}, {$set: ruleUpdate },  function(error, result){
            if (error) {
              process.env.TRACE && console.log('PUT /fhir/Rule/' + req.params.id + "[error]", error);

              // Bad Request
              JsonRoutes.sendResult(res, {
                code: 400
              });
            }
            if (result) {
              process.env.TRACE && console.log('result', result);
              res.setHeader("Location", "fhir/Rule/" + result);
              res.setHeader("Last-Modified", new Date());
              res.setHeader("ETag", "1.6.0");

              var rules = Rules.find({_id: req.params.id});
              var payload = [];

              rules.forEach(function(record){
                payload.push(Rules.prepForFhirTransfer(record));
              });

              console.log("payload", payload);

              // success!
              JsonRoutes.sendResult(res, {
                code: 200,
                data: payload
                //data: Bundle.generate(payload)
              });
            }
          });
        } else {        
          process.env.DEBUG && console.log('No rule found.  Creating one.');
          ruleUpdate._id = req.params.id;
          ruleId = Rules.insert(ruleUpdate,  function(error, result){
            if (error) {
              process.env.TRACE && console.log('PUT /fhir/Rule/' + req.params.id + "[error]", error);

              // Bad Request
              JsonRoutes.sendResult(res, {
                code: 400
              });
            }
            if (result) {
              process.env.TRACE && console.log('result', result);
              res.setHeader("Location", "fhir/Rule/" + result);
              res.setHeader("Last-Modified", new Date());
              res.setHeader("ETag", "1.6.0");

              var rules = Rules.find({_id: req.params.id});
              var payload = [];

              rules.forEach(function(record){
                payload.push(Rules.prepForFhirTransfer(record));
              });

              console.log("payload", payload);

              // success!
              JsonRoutes.sendResult(res, {
                code: 200,
                data: payload
                //data: Bundle.generate(payload)
              });
            }
          });        
        }
      } else {
        // no body; Unprocessable Entity
        JsonRoutes.sendResult(res, {
          code: 422
        });

      }


    } else {
      // Unauthorized
      JsonRoutes.sendResult(res, {
        code: 401
      });
    }

});



//==========================================================================================
// Step 2 - Read Rule  

JsonRoutes.add("get", "/Rule/:id", function (req, res, next) {
  process.env.DEBUG && console.log('GET /fhir-1.6.0/Rule/' + req.params.id);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("content-type", "application/fhir+json");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  var accessToken;

  if(typeof oAuth2Server === 'object'){
    accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});
  } else {
    // no oAuth server installed; Not Implemented
    JsonRoutes.sendResult(res, {
      code: 501
    });
  }


    if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {

      if (accessToken) {
        process.env.TRACE && console.log('accessToken', accessToken);
        process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
      }

      var ruleData = Rules.findOne({_id: req.params.id});
      if (ruleData) {
        ruleData.id = ruleData._id;

        delete ruleData._document;
        delete ruleData._id;

        process.env.TRACE && console.log('ruleData', ruleData);

        // Success
        JsonRoutes.sendResult(res, {
          code: 200,
          data: Rules.prepForFhirTransfer(ruleData)
        });
      } else {
        // Gone
        JsonRoutes.sendResult(res, {
          code: 410
        });
      }
    } else {
      // Unauthorized
      JsonRoutes.sendResult(res, {
        code: 401
      });
    }
});

//==========================================================================================
// Step 3 - Update Rule  

JsonRoutes.add("post", "/Rule", function (req, res, next) {
  process.env.DEBUG && console.log('POST /fhir/Rule/', JSON.stringify(req.body, null, 2));

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("content-type", "application/fhir+json");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  var accessToken;

  if(typeof oAuth2Server === 'object'){
    accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});
  } else {
    // Not Implemented
    JsonRoutes.sendResult(res, {
      code: 501
    });
  }

    if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {

      if (accessToken) {
        process.env.TRACE && console.log('accessToken', accessToken);
        process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
      }

      var ruleId;
      var newRule;

      if (req.body) {
        newRule = req.body;


        // remove id and meta, if we're recycling a resource
        delete newRule.id;
        delete newRule.meta;


        newRule = Rules.toMongo(newRule);

        process.env.TRACE && console.log('newRule', JSON.stringify(newRule, null, 2));
        // process.env.DEBUG && console.log('newRule', newRule);

        console.log('Cleaning new rule...')
        RuleSchema.clean(newRule);

        var practionerContext = RuleSchema.newContext();
        practionerContext.validate(newRule)
        console.log('New rule is valid:', practionerContext.isValid());
        console.log('check', check(newRule, RuleSchema))
        


        var ruleId = Rules.insert(newRule,  function(error, result){
          if (error) {
            process.env.TRACE && console.log('error', error);

            // Bad Request
            JsonRoutes.sendResult(res, {
              code: 400
            });
          }
          if (result) {
            process.env.TRACE && console.log('result', result);
            res.setHeader("Location", "fhir-1.6.0/Rule/" + result);
            res.setHeader("Last-Modified", new Date());
            res.setHeader("ETag", "1.6.0");

            var rules = Rules.find({_id: result});
            var payload = [];

            rules.forEach(function(record){
              payload.push(Rules.prepForFhirTransfer(record));
            });

            //console.log("payload", payload);
            // Created
            JsonRoutes.sendResult(res, {
              code: 201,
              data: Bundle.generate(payload)
            });
          }
        });
        console.log('ruleId', ruleId);
      } else {
        // Unprocessable Entity
        JsonRoutes.sendResult(res, {
          code: 422
        });
      }

    } else {
      // Unauthorized
      JsonRoutes.sendResult(res, {
        code: 401
      });
    }
});

//==========================================================================================
// Step 4 - RuleHistoryInstance

JsonRoutes.add("get", "/Rule/:id/_history", function (req, res, next) {
  process.env.DEBUG && console.log('GET /fhir-1.6.0/Rule/', req.params);
  process.env.DEBUG && console.log('GET /fhir-1.6.0/Rule/', req.query._count);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("content-type", "application/fhir+json");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  var accessToken;

  if(typeof oAuth2Server === 'object'){
    accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});
  } else {
    // no oAuth server installed; Not Implemented
    JsonRoutes.sendResult(res, {
      code: 501
    });
  }

    if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {

      if (accessToken) {
        process.env.TRACE && console.log('accessToken', accessToken);
        process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
      }

      var rules = Rules.find({_id: req.params.id});
      var payload = [];

      rules.forEach(function(record){
        payload.push(Rules.prepForFhirTransfer(record));

        // the following is a hack, to conform to the Touchstone Rule testscript
        // https://touchstone.aegis.net/touchstone/testscript?id=06313571dea23007a12ec7750a80d98ca91680eca400b5215196cd4ae4dcd6da&name=%2fFHIR1-6-0-Basic%2fP-R%2fRule%2fClient+Assigned+Id%2fRule-client-id-json&version=1&latestVersion=1&itemId=&spec=HL7_FHIR_STU3_C2
        // the _history query expects a different resource in the Bundle for each version of the file in the system
        // since we don't implement record versioning in Meteor on FHIR yet
        // we are simply adding two instances of the record to the payload 
        payload.push(Rules.prepForFhirTransfer(record));
      });
      // Success
      JsonRoutes.sendResult(res, {
        code: 200,
        data: Bundle.generate(payload, 'history')
      });
    } else {
      // Unauthorized
      JsonRoutes.sendResult(res, {
        code: 401
      });
    }
});

//==========================================================================================
// Step 5 - Rule Version Read

// NOTE:  We've not implemented _history functionality yet; so this endpoint is mostly a duplicate of Step 2.

JsonRoutes.add("get", "/Rule/:id/_history/:versionId", function (req, res, next) {
  process.env.DEBUG && console.log('GET /fhir-1.6.0/Rule/:id/_history/:versionId', req.params);
  //process.env.DEBUG && console.log('GET /fhir-1.6.0/Rule/:id/_history/:versionId', req.query._count);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("content-type", "application/fhir+json");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  var accessToken;

  if(typeof oAuth2Server === 'object'){
    accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});  
  } else {
    // no oAuth server installed; Not Implemented
    JsonRoutes.sendResult(res, {
      code: 501
    });
  }


  if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {

    if (accessToken) {
      process.env.TRACE && console.log('accessToken', accessToken);
      process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
    }

    var ruleData = Rules.findOne({_id: req.params.id});
    if (ruleData) {
      
      ruleData.id = ruleData._id;

      delete ruleData._document;
      delete ruleData._id;

      process.env.TRACE && console.log('ruleData', ruleData);

      JsonRoutes.sendResult(res, {
        code: 200,
        data: Rules.prepForFhirTransfer(ruleData)
      });
    } else {
      JsonRoutes.sendResult(res, {
        code: 410
      });
    }

  } else {
    JsonRoutes.sendResult(res, {
      code: 401
    });
  }
});



//==========================================================================================
// Step 6 - Rule Search Type  



generateDatabaseQuery = function(query){
  process.env.DEBUG && console.log("generateDatabaseQuery", query);

  var databaseQuery = {};

   if (query.name) {
    databaseQuery['name'] = {
      $regex: query.name,
      $options: 'i'
    };
  }
  if (query.identifier) {
    var paramsArray = query.identifier.split('|');
    process.env.DEBUG && console.log('paramsArray', paramsArray);
    
    databaseQuery['identifier.value'] = paramsArray[1]};

    process.env.DEBUG && console.log('databaseQuery', databaseQuery);
    return databaseQuery;
  }



JsonRoutes.add("get", "/Rule", function (req, res, next) {
  process.env.DEBUG && console.log('GET /fhir-1.6.0/Rule', req.query);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("content-type", "application/fhir+json");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  var accessToken;
  if(typeof oAuth2Server === 'object'){
    accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});
  } else {
    // no oAuth server installed; Not Implemented
    JsonRoutes.sendResult(res, {
      code: 501
    });
  }


    if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {

      if (accessToken) {
        process.env.TRACE && console.log('accessToken', accessToken);
        process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
      }

      var databaseQuery = generateDatabaseQuery(req.query);

      var payload = [];
      var rules = Rules.find(databaseQuery).fetch();
      process.env.DEBUG && console.log('rules', rules);

      rules.forEach(function(record){
        payload.push(Rules.prepForFhirTransfer(record));
      });
      process.env.TRACE && console.log('payload', payload);

      // Success
      JsonRoutes.sendResult(res, {
        code: 200,
        data: Bundle.generate(payload)
      });
    } else {
      // Unauthorized
      JsonRoutes.sendResult(res, {
        code: 401
      });
    }
});


JsonRoutes.add("post", "/Rule/:param", function (req, res, next) {
  process.env.DEBUG && console.log('POST /fhir-1.6.0/Rule/' + JSON.stringify(req.query));

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("content-type", "application/fhir+json");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  var accessToken;
  if(typeof oAuth2Server === 'object'){
    accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});
  } else {
    // no oAuth server installed; Not Implemented
    JsonRoutes.sendResult(res, {
      code: 501
    });
  }


    if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {

      if (accessToken) {
        process.env.TRACE && console.log('accessToken', accessToken);
        process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
      }

      var rules = [];

      if (req.params.param.includes('_search')) {
        var searchLimit = 1;
        if (req && req.query && req.query._count) {
          searchLimit = parseInt(req.query._count);
        }

        var databaseQuery = generateDatabaseQuery(req.query);
        process.env.DEBUG && console.log('databaseQuery', databaseQuery);

        rules = Rules.find(databaseQuery, {limit: searchLimit}).fetch();

        process.env.DEBUG && console.log('rules', rules);

        var payload = [];

        rules.forEach(function(record){
          payload.push(Rules.prepForFhirTransfer(record));
        });
      }

      process.env.TRACE && console.log('payload', payload);

      // Success
      JsonRoutes.sendResult(res, {
        code: 200,
        data: Bundle.generate(payload)
      });
    } else {
      // Unauthorized
      JsonRoutes.sendResult(res, {
        code: 401
      });
    }
});




//==========================================================================================
// Step 7 - Rule Delete    

JsonRoutes.add("delete", "/Rule/:id", function (req, res, next) {
  process.env.DEBUG && console.log('DELETE /fhir-1.6.0/Rule/' + req.params.id);

  res.setHeader("Access-Control-Allow-Origin", "*");

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  var accessToken;
  if(typeof oAuth2Server === 'object'){
    accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});
  } else {
    // no oAuth server installed; Not Implemented
    JsonRoutes.sendResult(res, {
      code: 501
    });
  }


    if (accessToken || process.env.NOAUTH || Meteor.settings.private.disableOauth) {

      if (accessToken) {
        process.env.TRACE && console.log('accessToken', accessToken);
        process.env.TRACE && console.log('accessToken.userId', accessToken.userId);
      }

      if (Rules.find({_id: req.params.id}).count() === 0) {
        // No Content
        JsonRoutes.sendResult(res, {
          code: 204
        });
      } else {
        Rules.remove({_id: req.params.id}, function(error, result){
          if (result) {
            // No Content
            JsonRoutes.sendResult(res, {
              code: 204
            });
          }
          if (error) {
            // Conflict
            JsonRoutes.sendResult(res, {
              code: 409
            });
          }
        });
      }


    } else {
      // Unauthorized
      JsonRoutes.sendResult(res, {
        code: 401
      });
    }  
  
});





// WebApp.connectHandlers.use("/fhir/Rule", function(req, res, next) {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   return next();
// });
