
  
  // create the object using our BaseModel
  Rule = BaseModel.extend();
  
  //Assign a collection so the object knows how to perform CRUD operations
  Rule.prototype._collection = Rules;
  
  // Create a persistent data store for addresses to be stored.
  // HL7.Resources.Patients = new Mongo.Collection('HL7.Resources.Patients');
  Rules = new Mongo.Collection('Rules');
  
  //Add the transform to the collection since Meteor.users is pre-defined by the accounts package
  Rules._transform = function (document) {
    return new Rule(document);
  };
  
  
  
  RuleSchema = new SimpleSchema([
    {
    "resourceType" : {
      type: String,
      defaultValue: "Rule"
    },
    "tags" : {
      optional: true,
      type: [ String ]
    }, 
    "note" : {
      optional: true,
      type: String
    }
  }]);
  Rules.attachSchema(RuleSchema);
  
  




//=================================================================
// FHIR Methods

Rules.fetchBundle = function (query, parameters, callback) {
    var noteArray = Rules.find(query, parameters, callback).map(function(note){
      note.id = note._id;
      delete note._document;
      return note;
    });
  
    // console.log("noteArray", noteArray);
  
    // var result = Bundle.generate(noteArray);
    var result = noteArray;
    
    // console.log("result", result.entry[0]);
  
    return result;
  };
  
  
  /**
   * @summary This function takes a FHIR resource and prepares it for storage in Mongo.
   * @memberOf Rules
   * @name toMongo
   * @version 1.6.0
   * @returns { Rule }
   * @example
   * ```js
   *  let notes = Rules.toMongo('12345').fetch();
   * ```
   */
  
  Rules.toMongo = function (originalRule) {
    return originalRule;
  };
  
  
  /**
   * @summary Similar to toMongo(), this function prepares a FHIR record for storage in the Mongo database.  The difference being, that this assumes there is already an existing record.
   * @memberOf Rules
   * @name prepForUpdate
   * @version 1.6.0
   * @returns { Object }
   * @example
   * ```js
   *  let notes = Rules.findMrn('12345').fetch();
   * ```
   */
  
  Rules.prepForUpdate = function (note) {
    return note;
  };
  
  
  /**
   * @summary Scrubbing the note; make sure it conforms to v1.6.0
   * @memberOf Rules
   * @name scrub
   * @version 1.2.3
   * @returns {Boolean}
   * @example
   * ```js
   *  let notes = Rules.findMrn('12345').fetch();
   * ```
   */
  
  Rules.prepForFhirTransfer = function (note) {
    process.env.DEBUG && console.log("Rules.prepForBundle()");
  
    console.log("Rules.prepForBundle()", note);  
    return note;
  };
  