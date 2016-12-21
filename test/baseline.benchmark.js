/**
 * Module dependencies
 */

var parley = require('../');
var benchSync = require('./utils/bench-sync.util');
var bench = require('./utils/bench.util');



/**
 * baseline.benchmark.js
 *
 * A performance benchmark for Deferred instantiation and execution.
 */

describe('baseline.benchmark.js', function() {

  // Set "timeout" and "slow" thresholds incredibly high
  // to avoid running into issues.
  this.slow(240000);
  this.timeout(240000);

  before(function(){
    console.log(
    '  •  •      •       •      •    •    \n'+
    '           •      •              o  \n'+
    '  •    b e n c h m a r k s      •    \n'+
    '   •    (instantiation)       °     \n'+
    '------------------------------------'+
    '');
  });

  //  ╔═╗╦═╗ ╦╔╦╗╦ ╦╦═╗╔═╗╔═╗
  //  ╠╣ ║╔╩╦╝ ║ ║ ║╠╦╝║╣ ╚═╗
  //  ╚  ╩╩ ╚═ ╩ ╚═╝╩╚═╚═╝╚═╝
  var find = require('./fixtures/find.fixture');
  var validate = require('./fixtures/validate.fixture');


  //  ╔═╗╔╗╔╔═╗╔═╗╔═╗╦ ╦╔═╗╔╦╗
  //  ╚═╗║║║╠═╣╠═╝╚═╗╠═╣║ ║ ║
  //  ╚═╝╝╚╝╩ ╩╩  ╚═╝╩ ╩╚═╝ ╩
  // Just a one-off snapshot run on a laptop.
  // For historical reports, see the history of this file on GitHub.
  //
  //
  // Dec 20, 2016 (take 4):  (after removing pretty-print, BEFORE switching to the constructor approach)
  // ================================================================================================================
  //   baseline.benchmark.js
  //   •  •      •       •      •    •
  //            •      •              o
  //   •    b e n c h m a r k s      •
  //    •                          °
  // ------------------------------------
  //     parley(handler)
  //  • just_build#0 x 527,939 ops/sec ±1.45% (85 runs sampled)
  //       ✓ should be performant enough (using benchSync())
  //     parley(handler).exec(cb)
  //  • build_AND_exec#0 x 420,899 ops/sec ±1.61% (85 runs sampled)
  //       ✓ should be performant enough (using benchSync())
  //     practical benchmark
  //  • mock "find()"#0 x 34.33 ops/sec ±0.90% (73 runs sampled)
  //       ✓ should be performant enough when calling fake "find" w/ .exec() (using bench())
  //  • mock "find()"#0 x 34.20 ops/sec ±0.95% (74 runs sampled)
  //       ✓ should be performant enough when calling NAKED fake "find" (using bench())
  //  • mock "validate()"#0 x 173,206 ops/sec ±3.02% (78 runs sampled)
  //       ✓ should be performant enough when calling fake "validate" w/ .exec() (using benchSync())
  //  • mock "validate()"#0 x 5,805,213 ops/sec ±4.04% (87 runs sampled)
  //       ✓ should be performant enough when calling NAKED "validate" (using benchSync())
  // ------------------------------------
  //   •  •      •       •      •    •
  //            •      •              o
  //   • < / b e n c h m a r k s >    •
  //    •                           °
  //                       o°
  // ================================================================================================================


  //  ╔═╗╔╗ ╔═╗╔═╗╦═╗╦  ╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
  //  ║ ║╠╩╗╚═╗║╣ ╠╦╝╚╗╔╝╠═╣ ║ ║║ ║║║║╚═╗
  //  ╚═╝╚═╝╚═╝╚═╝╩╚═ ╚╝ ╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
  //
  // • Removing pretty-print caused a huge performance increase
  //   (33x instead of 317x slower than naked usage)
  //
  // • The additional time added by calling .exec() (vs. just building) is really only
  //   visible now, AFTER removing pretty-print.  It's a difference of 100,000 ops/sec.
  //
  // • By itself, switching to a Deferred constructor doesn't really improve performance
  //   by THAT much.  In some cases, it actually makes it worse (e.g. consistent decrease
  //   in ops/sec for the first 2 benchmarks: just_build, build_and_exec).  BUT it does
  //   ever-so-slightly increase performance for both mock "find" mock "validate".
  //   The question is: "why?"  My guess is that it has something to do w/ accessing
  //   `this` being slower than closure scope, and thus outweighing the gains of faster
  //   construction.  But even then, that wouldn't explain "just_build" being slower, so
  //   it's probably not that...
  //
  // • Reducing the number of `this`/`self` references did not seem to make any sort of
  //   meaningful difference on performance. (see 1d8b6239de2cd84ac76ee015d099c3c5a7013989)
  //   *******UPDATE*******:
  //   Actually -- it might... after removing two unncesssary `this` assignments from the
  //   CONSTRUCTOR itself, performance for "just_build" shot up to where it was for the
  //   original closure approach (and possibly a bit higher).  Still, this is negligible
  //   at the moment, but it's probably an effect that is more pronounced when overall ops/sec
  //   are orders of magnitude higher (e.g. in the millions instead of the hundreds of thousands.)
  //   Even then-- this is still less important than one might expect!
  //
  // • Aside: using a standalone function declaration (rather than invoking a self-calling function)
  //   increases performance, like you might expect.  Whether it's enough to matter is probably
  //   situational.  In the case of the commit where this observation was added to the code base,
  //   it made a difference of ~1,000,000 ops/sec for the "NAKED mock validate" benchmark, and a
  //   difference of ~20,000 ops/sec for the "validate w/ .exec()" benchmark.  Worth it...?
  //   No. Inline function declarations are NEVER worth it.  But in some cases it might be worthwhile
  //   to pull out shared futures used by self-invoking functions and drop them into a separate module.
  //   *******UPDATE*******:
  //   Just verified that, by moving the inline function to a separate file, performance for the
  //   "NAKED mock validate" went up by an ADDITIONAL 2,000,000 ops/sec, and by an ADDITIONAL
  //   ~20,000 ops/sec for the "validate w/ .exec()" benchmark.  So, in conclusion, the answer to the
  //   question of "Worth it?" is a resounding YES -- but only for a hot code path like this.  For
  //   other bits of code, the advantages of keeping the logic inline and avoiding a separate,
  //   weirdly-specific file, are well worth it.  And as for INLINE named function declarations?
  //   They're still never worth it.  Not only do they clutter the local scope and create scoffable
  //   confusion about flow control (plus all the resulting bug potential), they aren't even as fast
  //   as pulling out the code into a separate file.  (Presumably this is because V8 has to make sure
  //   the inline function can access the closure scope.)
  //
  // • It is worth noting that, despite how exciting the previous notes about pulling out self-invoking
  //   functions was, when attempted with the mock "find" fixture, the relevant benchmarks showed no
  //   noticeable improvement (i.e. because they're doing something asynchronous.)
  //
  // • Swapping out non-standard variable names (e.g. π) did not have any noticeable effect.
  //
  // • When using the constructor+prototype approach, accessing `this` is slow.  It's not THAT bad,
  //   but it is definitely a thing.  Note that it is somewhat worse if in the constructor-- and
  //   also worse on assignment (this.foo = x) than on access (var x = this.foo).
  //
  // • When using the closure approach, adding new methods dynamically is slow.  This doesn't seem
  //   to be because defining new functions is slow, per se.  Rather it seems to have to do with
  //   mutating the object after it's already been created.  As a middle ground, it seems that relying
  //   on Lodash's built-in optimizations is the way to go.  Simply changing from `deferred.meta = ...`
  //   to `_.extend(deferred, { meta: ... })` split the difference as far as performance.  It improved
  //   the performance of the 'mock validate with .exec()' benchmark by ~50k-60k ops/sec; i.e. ~20%)
  //
  // • STILL BE CAREFUL when using the closure approach.  Even with the _.extend() trick, performance
  //   decreases as more and more methods are added, whether or not they're within the same `.extend()`
  //   call.  BUT: What's still unclear is if this is due to function construction, or something else.
  //   In this case, in practice, tricks would need to be used to circumvent the need for closure scope
  //   access (i.e. prbly .bind()).  But the answer to the question can actualy be figured out regardless--
  //   by defining stub functions once per process.
  //   *******UPDATE*******:
  //   Well, the answer is that the function construction must have mattered somewhat, but even after
  //   pulling the entire dictionary of methods out (and pretending they're static), the performance is
  //   still lower than when _.extend() is used to attach only ONE method-- even when that one method is
  //   defined inline.  So, at the end of the day, we're just going to have to deal with the fact that,
  //   if we add methods to the Deferred dynamically and construction-time, it's going to be slower and
  //   slower for every additional method we add.


  //  ╔═╗╦ ╦╦╔╦╗╔═╗
  //  ╚═╗║ ║║ ║ ║╣
  //  ╚═╝╚═╝╩ ╩ ╚═╝
  describe('parley(handler)', function(){
    it('should be performant enough (using benchSync())', function (){
      benchSync('parley(handler)', [

        function just_build(){
          var deferred = parley(function(handlerCb) { return handlerCb(); });
        }

      ]);//</benchSync()>
    });
  });

  describe('parley(handler).exec(cb)', function(){
    it('should be performant enough (using benchSync())', function (){
      benchSync('parley(handler).exec(cb)', [

        function build_AND_exec(){
          var deferred = parley(function(handlerCb) { return handlerCb(); });
          deferred.exec(function (err) {
            if (err) {
              console.error('Unexpected error running benchmark:',err);
            }//>-
            // Note: Since the handler is blocking, we actually make
            // it in here within one tick of the event loop.
          });
        }

      ]);//</benchSync()>
    });

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // For additional permutations using bench() +/- extra setImmediate() calls,
    // see the commit history of this file.  As it turn out, the setImmediate()
    // calls just add weight and make it harder to judge the accuracy of results.
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  });//</ describe: parley(handler().exec(cb) )



  describe('practical benchmark', function(){
    it('should be performant enough when calling fake "find" w/ .exec() (using bench())', function (done){
      bench('mock "find()"', [

        function (next){
          find({ where: {id:3, x:30} })
          .exec(function (err, result) {
            if (err) { return next(err); }
            return next();
          });
        }

      ], done);
    });

    it('should be performant enough when calling NAKED fake "find" (using bench())', function (done){
      bench('mock "find()"', [

        function (next){
          find({ where: {id:3, x:30} }, function (err, result) {
            if (err) { return next(err); }
            return next();
          });
        }

      ], done);
    });

    it('should be performant enough when calling fake "validate" w/ .exec() (using benchSync())', function (){
      benchSync('mock "validate()"', [

        function (){
          validate()
          .exec(function (err) {
            if (err) {
              console.error('Unexpected error running benchmark:',err);
            }//>-
            // Note: Since the handler is blocking, we actually make
            // it in here within one tick of the event loop.
          });
        }

      ]);
    });

    it('should be performant enough when calling NAKED "validate" (using benchSync())', function (){
      benchSync('mock "validate()"', [

        function (){
          validate(function (err) {
            if (err) {
              console.error('Unexpected error running benchmark:',err);
            }//>-
            // Note: Since the handler is blocking, we actually make
            // it in here within one tick of the event loop.
          });
        }

      ]);
    });
  });


  after(function(){
    console.log(
    '------------------------------------\n'+
    '  •  •      •       •      •    •    \n'+
    '           •      •              o  \n'+
    '  • < / b e n c h m a r k s >    •    \n'+
    '   •                           °     \n'+
    '                      o°            \n'+
    '');
  });

});//</describe (top-level) >
