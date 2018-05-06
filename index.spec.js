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
    });

    it('ignores non existing posts', () => {
        const p = plan();
        incrementComments(p.fetch(() => null), p.log(), p.save(), 123);
        expect(p()).toMatchSnapshot();
    });
});

function recipe(getBread, getButter, mix) {
    const bread = getBread();
    const butter = getButter();
    return mix(butter, bread);
}

const { autoPlan } = require('.');
describe('recipe', () => {
    it('goes well', () => {
        const wrapped = autoPlan(recipe);
        const p = wrapped({ mix: (a, b) => [a, b] });
        expect(p()).toMatchSnapshot();
    });

    it('catches a falling toast', () => {
        const wrapped = autoPlan(recipe);
        const p = wrapped({
            mix: () => {
                throw 'on the floor';
            },
        });
        expect(p()).toMatchSnapshot();
    });
});
