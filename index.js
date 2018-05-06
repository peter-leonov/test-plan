/*::
// $FlowFixMe
declare var plan: any => any
// $FlowFixMe
declare var proxySpy: <V>(any, any, string, V) => V
// $FlowFixMe
declare var autoPlan: (any, any) => any
*/

const proxySpy = (log, serialize, id, v) =>
    new Proxy(v, {
        apply(_, that, args) {
            if (that === undefined) {
                log(['call', id, serialize(args)]);
            } else {
                log(['method', id, serialize(that), serialize(args)]);
            }
            return Reflect.apply(...arguments);
        },
        get(_, prop) {
            log(['get', id, prop]);
            return Reflect.get(...arguments);
        },
        set(_, prop, value) {
            log(['set', id, prop, serialize(value)]);
            return Reflect.set(...arguments);
        },
    });

const plan = ({ log = [], serialize = v => v } = {}) =>
    new Proxy(() => log, {
        get(_, prop) {
            return v =>
                proxySpy(
                    (...args) => log.push(...args),
                    serialize,
                    prop,
                    v || function() {},
                );
        },
    });

// from https://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically
function getArgumentNames(func) {
    var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
    var ARGUMENT_NAMES = /([^\s,]+)/g;
    var fnStr = func.toString().replace(STRIP_COMMENTS, '');
    var result = fnStr
        .slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')'))
        .match(ARGUMENT_NAMES);
    if (result === null) result = [];
    return result;
}

// idea from https://gist.github.com/agentcooper/b055f1eed82faad5321ed5a0d4dae707
const autoPlan = (fn, p = plan()) => {
    const names = getArgumentNames(fn);
    return (args = {}) => {
        const spiedArgs = names.map(name => {
            const arg =
                name in args
                    ? args[name]
                    : function() {
                          return name;
                      };
            return typeof arg == 'function' ? p[name](arg) : arg;
        });
        try {
            const res = fn(...spiedArgs);
            p['return']()(res);
        } catch (err) {
            p['throw']()(err);
        }
        return p;
    };
};

module.exports = {
    proxySpy,
    plan,
    autoPlan,
};
