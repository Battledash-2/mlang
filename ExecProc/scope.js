module.exports = class Scope {
	constructor(parentPointer) {
		return new Proxy(
			{},
			{
				get: function (target, prop) {
					if (prop == "%PAR") return parentPointer;
					if (target.hasOwnProperty(prop))
						return Reflect.get(target, prop);
					if (typeof parentPointer[prop] !== "undefined")
						return parentPointer[prop]; // for some reason, hasOwnProperty doesn't work here
				},
				set: function (target, prop, value) {
					if (parentPointer[prop]) {
						parentPointer[prop] = value;
					} else {
						Reflect.set(target, prop, value);
					}
					return true;
				},
			}
		);
	}
};
