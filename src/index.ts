if (false)
{
    /*
      The below code demonstrates the truth of the following statement
      (found in https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises):

          Callbacks will never be called before the completion of the current run of
          the JavaScript event loop.

          Callbacks added with then(), as above, will be called even after the success or
          failure of the asynchronous operation.

      They also demonstrate that the 'resolve' and 'reject' callbacks are placed in the
      callback queue and are only called once the call stack in which the executor function
      is called has emptied.

    */
    
    const p1SyncExecutor = (resolve: Function, reject: Function) => {
        console.log('a');
        resolve(42);
        console.log('c');
    };

    {   // create the promise and the attach the then to it immediately
        (new Promise<number>( p1SyncExecutor )).then( (result: number) => {
                console.log(`b - got: ${result}`);
        })
    }


    {   // create the promise and attach a 'then' to it after some time
        const p: Promise<number> = new Promise( p1SyncExecutor );

        setTimeout( ()=>{
            p.then( (result: number) => {
                console.log(`b2 - got: ${result}`);
            });
        }, 3000);

    }

}


if (false)
{ // what happens if a Promise rejects and you don't handle it?

    (new Promise( (resolve: Function, reject: Function) => {
        reject('fubar');
    })).then( (result) => {
        // a: sse-1603713579: this code is never executed, instead you get a stern warning
        console.log(`result is ${result}`);
    });
}


if (false)
{ // what happens if a Promise throws an exception synchronously in its executor and you don't handle it?

    (new Promise( (resolve: Function, reject: Function) => {
        throw 'fubar'
    })).then( (result) => {
        // same thing as in sse-1603713579
        console.log(`result is ${result}`);
    });
}


if (false)
{ /*  What happens if a Promise throws an exception synchronously but you attach the 'catch' handler in
   *  a different call stack? No problem at all, exception is caught just fine.
   */

    const p = new Promise( (resolve: Function, reject: Function) => {
        console.log('throwing');
        throw 'fubar'
    });


    console.log('attaching catch');
    p.catch( (error) => {
        console.log(`error is: ${error}`);
    });
}


if (false)
{ // what happens if a Promise rejects asynchronously and you don't handle it?

    (new Promise( (resolve: Function, reject: Function) => {
        setTimeout( ()=>{reject('fubar');}, 1000);
    })).then( (result) => {
        // same thing as in sse-1603713579
        console.log(`result is ${result}`);
    });
}

if (false)
{ /* What happens if a Promise throws an exception asynchronously in its executor EVEN WHEN you DO handle it?
   * In this case, the entire node process terminates with exit code 1. I am not sure what happens in a browser
   * though. It's a pretty safe bet that the browser won't terminate..
   */

    enum Behaviour {RESOLVE, REJECT, THROW}

    const demo = (behaviour: Behaviour) => {
        (new Promise( (resolve: Function, reject: Function) => {
            setTimeout( ()=> {
                switch (behaviour) {
                case Behaviour.RESOLVE:
                    resolve(42);
                    break;
                case Behaviour.REJECT:
                    reject('fubar');
                    break;
                case Behaviour.THROW:
                    throw 'fubar'
                    break;
                default:
                    const x: never = behaviour;
                    throw x;
                }
            }, 100);
        })).then( (result) => {
            console.log(`result is ${result}`);
        }).catch( (error) => {
            console.log(`error is ${error}`);
        });
    }

    demo(Behaviour.RESOLVE);
    demo(Behaviour.REJECT);
    demo(Behaviour.THROW);
}

if (false)
{ /* So, what is the correct way to capture a throw inside an asyncrhonous executor?
   * One approach is the following:
   *
   */

    const someMethodThatMightThrow = () => {
        throw 'fubar';
    }
    (new Promise( (resolve: Function, reject: Function) => {
        setTimeout( ()=> {
            try {
                someMethodThatMightThrow();
            } catch (e) {
                reject(e);
            }
        }, 100);
    })).catch( (error) => {
        console.log(`error is ${error}`);
    });
}

if (false)
{ /*  Another approach is this one where the idea is that function
   *  'someMethodThatMightThrow' gets called in the 'then' block
   *  of a Promise
   */
    const someMethodThatMightThrow = () => {
        throw 'fubar';
    }
    (new Promise( (resolve: Function, rejectOuter: Function) => {

        (new Promise( (resolve, reject) => {
            setTimeout(resolve, 100);
        })).then(someMethodThatMightThrow)
            .catch( (error) => {
                rejectOuter(error);
            });

    })).catch( (error) => {
        console.log(`error is ${error}`);
    });
}

if (false) {
    /* This can be further simplified by the use of a utility function
     * as shown in:
     *        https://stackoverflow.com/a/45761313/274677
     *
     * Or better yet some more advanced promises library that can be
     * used to promisify recursively. E.g. the Bluebird Promisify library:
     *        https://stackoverflow.com/a/34961040/274677
     *
     */    
    const someMethodThatMightThrow = () => {
        throw 'fubar';
    }

    const delay = (ms: number):Promise<any> => {
        return (new Promise( function (resolve) {
            setTimeout(resolve, ms);
        }));
    }

    delay(100).then(someMethodThatMightThrow).catch( (error) => {
        console.log(`error is ${error}`);
    });
}


if (false) {
    // Promises inside promises

    const p1 = new Promise( (resolve: Function, reject: Function) => {
        new Promise( (resolve: Function, reject: Function) => {
            new Promise( (resolve: Function, reject: Function) => {
                setTimeout(()=>{
                    console.log('a');
                    resolve(42);
                }, 1000);
            }).then((value)=>{
                console.log('b');
                setTimeout( ()=>{resolve(value)}, 1000);
            });
        }).then( value=>{
            console.log('c');
            setTimeout( ()=>{resolve(value)}, 1000);
        });
    });

    p1.then( value=>{
        console.log('d');
        console.log(value);
    });

}

if (false) {
    // Promises returning other promises in their 'then' handlers
    
    // https://stackoverflow.com/q/35747957/274677
    let p1 = new Promise(function(resolve, reject) {
        resolve(42);
    });

    let p2 = new Promise(function(resolve, reject) {
        resolve(43);
    });

    let p3 = p1.then(function(value) {
        // first fulfillment handler
        console.log(value);     // 42
        return p2;
    });

    p3.then(function(value) {
        // second fulfillment handler
        console.log(value);     // 43
    });
}

if (false)
{
    /* Exceptions - synchronous case
       The below code demonstrates that exceptions thrown in the body of a synchronous
       executor are caught in the catch, just as if they were explicitly rejected.
       It also demonstrates that you can have multiple 'finally' handlers
    */
    
    const p1SyncExecutor = (resolve: Function, reject: Function) => {
        console.log('inside sync executor');
        const n: number = Math.random();
        if (n>0.6)
            throw `value too high: ${n}`;
        if (n >= 0.3)
            resolve(n);
        else
            reject(n);
    };

    const p1 = new Promise( p1SyncExecutor );

    p1.finally( ()=>{
        console.log(`S-1`);
    }).then( (result)=>{
        console.log(`S-2s successful result: ${result}`);
    }).catch( (error)=> {
        console.log(`S-2f failed result: ${error}`);
    }).finally( ()=> {
        console.log(`S-3`);
    });


    console.log('S0');
}


if (false) {
    // resolved and unresolved promises

    const p1 = new Promise( (resolve) => {
        resolve(42);
    });
    console.log('p1 is: ', p1);

    const p1a = p1.then( (value) => {
        console.log('value inside p1.then is: ', value);
        return value;
    });

    console.log('p1a is: ', p1a);

    const p1b = p1a.then( (value) => {
        console.log('value inside p1a.then is: ', value);
        return value;
    });

    console.log('p1b is: ', p1b);

    const p2 = new Promise( (resolve) => {
        setTimeout(()=>{resolve(42)}, 100);
    });
    console.log('p2 is: ', p2);

}

if (false) {
    // this is a useful idiom in various Redux async action creators
    const p1 = Promise.resolve(42);
    console.log(p1);
    p1.then((value)=>{
        console.log(value);
    });

    const p2 = Promise.reject('fubar');
    console.log(p2);
    p2.then((value)=>{
        console.log('value: ', value);
    }).catch ( error => {
        console.log('error: ', error);
    });
}

if (true) {
    // this goes to show that it is not possible to type the reject type of an exception
    const p : Promise<number> = new Promise( (resolve, reject) => {
        if (Math.random()>0.5)
            resolve(42);
        else
            reject('42');

    });

    p.catch( (error) => {
        console.log(`error is : ${error}`);
    });

}