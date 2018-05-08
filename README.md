# TestPlan

It's a simpler version of Introscope's [EffectsLogger](https://github.com/peter-leonov/introscope#effectslogger) in case you do not need scope integration.

If you know what a brilliant [redux-saga-test-plan](https://github.com/jfairbank/redux-saga-test-plan) is, then this TestPlan is just the same, but without redux and with [Jest snapshots](https://facebook.github.io/jest/docs/en/snapshot-testing.html).

## Install

```sh
yarn add -D @introscope/test-plan
# or
npm i -D @introscope/test-plan
```

## Example

In this example we (ab)use Dependency Injection to illustrate how ealy it is to test a function which side effects are tracked by DP functions. Here the idea of the `redux-saga-test-plan` shines greatly!

```js
// abusing Dependency Injection to make side effects explicit (high five AngularJS)
function incrementComments(fetch, log, save, postId) {
    const post = fetch(`/posts/${postId}`);
    if (!post) return;
    log('comment.inc', postId);
    post.comments++;
    save(post);
}

const { plan } = require('@introscope/test-plan');
describe('incrementComments', () => {
    it('increments existing posts', () => {
        const p = plan();
        incrementComments(
            p.fetch(() => ({
                comments: 1,
            })),
            p.log(),
            p.save(),
            123,
        );
        expect(p()).toMatchSnapshot();
        /*
        [
            [
                "call",
                "fetch",
                [
                "/posts/123",
                ],
            ],
            [
                "call",
                "log",
                [
                "comment.inc",
                123,
                ],
            ],
            [
                "call",
                "save",
                [
                {
                    "comments": 2,
                },
                ],
            ],
        ]
        */
    });

    it('ignores non existing posts', () => {
        const p = plan();
        incrementComments(
            p.fetch(() => null),
            p.log(),
            p.save(),
            123);
        expect(p()).toMatchSnapshot();
    });
    /*
    [
        [
            "call",
            "fetch",
            [
                "/posts/123",
            ],
        ],
    ]
    */
});
```

See this example in action in [the spec](index.spec.js).

There is also a [brilliant idea](https://gist.github.com/agentcooper/b055f1eed82faad5321ed5a0d4dae707) from [@agentcooper](https://github.com/agentcooper) for auto mocking and spying  function arguments:

```js
function recipe(getBread, getButter, mix) {
    const bread = getBread();
    const butter = getButter();
    return mix(butter, bread);
}

const { autoPlan } = require('@introscope/test-plan');
describe('recipe', () => {
    it('goes well', () => {
        // returns a function with all functional arguments spied
        const wrapped = autoPlan(recipe);
        // it takes an object with arguments instead of a list
        // to make it clear which arguments to auto mock
        const p = wrapped({ mix: (a, b) => [a, b] });
        // the return is a test plan with the function call result
        // logged as a call to `return`
        expect(p()).toMatchSnapshot();
    });
    /*
    [
        [
            "call",
            "getBread",
            [],
        ],
        [
            "call",
            "getButter",
            [],
        ],
        [
            "call",
            "mix",
            [
            "getButter",
            "getBread",
            ],
        ],
        [
            "call",
            "return",
            [
            [
                "getButter",
                "getBread",
            ],
            ],
        ],
    ]
    */

    it('catches a falling toast', () => {
        const wrapped = autoPlan(recipe);
        // an exception gets logged as a "call" to `throw`
        // it kinda fits the idea of side effects as function calls
        const p = wrapped({
            mix: () => {
                throw 'on the floor';
            },
        });
        expect(p()).toMatchSnapshot();
    });
    /*
    [
        [
            "call",
            "getBread",
            [],
        ],
        [
            "call",
            "getButter",
            [],
        ],
        [
            "call",
            "mix",
            [
            "getButter",
            "getBread",
            ],
        ],
        [
            "call",
            "throw",
            [
            "on the floor",
            ],
        ],
    ]
    */
});
```