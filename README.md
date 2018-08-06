# clinical:rules-engine

Rules engines for clinical workflows.

#### Clone the Example Plugin      

```bash
cd webapp/packages
git clone https://github.com/clinical-meteor/rules-engine
```


#### Install

```bash
# add your package
meteor add clinical:rules-engine
meteor npm install
```


#### Basic Example  

```javascript
import { Engine } from 'json-rules-engine'
import { get } from 'lodash';
 
/**
 * Setup a new engine
 */
let engine = new Engine()
 
// define a rule for detecting the player has exceeded foul limits.  Foul out any player who:
// (has committed 5 fouls AND game is 40 minutes) OR (has committed 6 fouls AND game is 48 minutes)
engine.addRule({
  conditions: {
    any: [{
      all: [Goals.find({'code.text': 'BMI'}).map(function(goal){
          return {
            fact: 'BMI',
            operator: 'lessThan',
            value: 24
          }
      })]
    }, {
      all: [Goals.find({'code.text': 'Weight'}).map(function(goal){
          return {
            fact: 'currentWeight',
            operator: 'lessThan',
            value: 150
          }
      })]
    }]
  },
  event: {  // define the event to fire when the conditions evaluate truthy
    resourceType: 'Communication',
    status: 'completed'
    payload: [{
      contentString: "You've met a weight goal!"
    }]
  }
})
 
/**
 * Define facts the engine will use to evaluate the conditions above.
 * Facts may also be loaded asynchronously at runtime; see the advanced example below
 */

let facts = {
  currentWeight: get(Observations.find({'code.text': 'Weight'}).fetch()[0], 'valueQuantity.value'),
  bodyMassIndex: get(Observations.find({'code.text': 'BMI'}).fetch()[0], 'valueQuantity.value')
}
 
// Run the engine to evaluate
engine
  .run(facts)
  .then(events => { // run() returns events with truthy conditions
    events.map(event => console.log(get(event, 'payload.contentString')))
  })
 
/*
 * Output:
 *
 * You've met a weight goal!
 */
```