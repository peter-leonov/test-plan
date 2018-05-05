# TestPlan

It's a simpler version of Introscope's [SideShooter](https://github.com/peter-leonov/introscope/sideshooter) in case you do not need scope integration.

If you know what a brilliant [redux-saga-test-plan](https://github.com/jfairbank/redux-saga-test-plan) is, then this TestPlan is just the same, but without redux and with [Jest snapshots](https://facebook.github.io/jest/docs/en/snapshot-testing.html).

## Example

In this example we (ab)use Dependency Injection to illustrate how ealy it is to test a function which side effects are tracked by DP functions. Here the idea of the `redux-saga-test-plan` shines greatly!

```js
// abusing Dependency Injection to make side effects explicit
function incrementComments(fetch, log, save, postId) {
    const post = fetch(`/posts/${postId}`);
    if (!post) return;
    log('comment.inc', postId);
    post.comments++;
    save(post);
}

const { plan } = require('.');
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