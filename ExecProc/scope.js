module.exports = class Scope {
    constructor(parentPointer) {
        return new Proxy({}, { 
            get: function(target, prop) {
                if (prop == "%PAR") return parentPointer;
                if (target[prop]) return Reflect.get(target, prop);
                if (parentPointer[prop]) return parentPointer[prop];
            },
            set: function(target, prop, value) {
                if (parentPointer[prop]) {
                    parentPointer[prop] = value;
                } else {
                    Reflect.set(target, prop, value);
                };
                return true;
            }
        });
    }
}