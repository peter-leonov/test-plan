# TestPlaned

It's a simpler version of [Introscope's Plan](https://github.com/peter-leonov/introscope/plan) in case you do not need scope integration.

## Example

In this example we (ab)use Dependency Injection to illustrate how ealy it is to test a function which side effects are tracked by DP functions. Here the idea of the `redux-saga-test-plan` shines greatly!

```js
// Dependency Injection is abused for purposes of the example :)
function incrementComments(fetch, log, save, postId) {
    const post = fetch(`/posts/${postId}`);
    if (!post) return;
    log('comment.inc', postId);
    post.comments++;
    save(post);
}

import plan from 'test-planed';
describe('incrementComments', () => {
    it('increments existing posts', () => {
        const p = plan();
        incrementComments(
            p.fetch(() => {
                comments: 1;
            }),
            p.log(),
            p.save(),
            123,
        );
        expect(p()).toMatchSnapshot();
        // This creates snapshot with:
        // [
        //     ['call', 'fetch', ['/posts/123']],
        //     ['call', 'log', ['comment.inc', 123]],
        //     ['call', 'save', [{ comments: 2 }]],
        // ];
    });

    it('ignores non existing posts', () => {
        const p = testPlan();
        incrementComments(
            p.fetch(() => null),
            p.log(),
            p.save(),
            123,
        );
        expect(p()).toMatchSnapshot();
        // This creates snapshot with just:
        // [
        //     ['call', 'fetch', ['/posts/123']],
        // ];
    });
});
```
