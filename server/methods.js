Meteor.methods({
    createNewRule: function(text){
        check(text, String);        
        console.log('createNewRule()', text);

        Rules.insert({
            resourceType: 'Rule',
            note: text
        });
    }
});