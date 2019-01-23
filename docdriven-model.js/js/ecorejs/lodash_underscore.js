if (typeof _.contains === 'undefined') {
  _.contains = _.includes;
  _.prototype.contains = _.includes;
} 
if (typeof _.object === 'undefined') {
  _.object = _.zipObject;
}
if (typeof _.all === 'undefined') {
  _.all = _.every;
}
if (typeof _.any === 'undefined') {
  _.any = _.some;
}
let lodashEach = _.each;
_.each = function(collection, iteratee, context) {
  if(context === 'undefined') {
    return lodashEach(collection, iteratee);
  }
  return lodashEach(collection, iteratee.bind(context));
}