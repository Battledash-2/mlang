const Interface = require("../../interface");

module.exports = class MathPKG extends Interface {
    constructor(...args) {
        super(...args);

        // random
        this.createFunction("math::random", (arg)=>{
            arg = arg?.value || 100;
            return this.createToken("NUMBER", Math.floor(Math.random() * arg), this.getPositionObject());
        });

        // min and max
        this.createFunction("math::max", (arg)=>{
            let arr = [];
            if (!Array.isArray(arg)) throw new Error(`'math/max' expects atleast 2 params ${this.errorPosition()}`);
            for (let v of arg) {
                if (v.type != "NUMBER") throw new Error(`Expecting numbers for all params in 'math/max' ${this.errorPosition()}`);

                arr.push(v.value);
            }
            return this.createToken("NUMBER", Math.max(...arr), this.getPositionObject());
        });
        this.createFunction("math::min", (arg)=>{
            let arr = [];
            if (!Array.isArray(arg)) throw new Error(`'math/max' expects atleast 2 params ${this.errorPosition()}`);
            for (let v of arg) {
                if (v.type != "NUMBER") throw new Error(`Expecting numbers for all params in 'math/max' ${this.errorPosition()}`);

                arr.push(v.value);
            }
            return this.createToken("NUMBER", Math.min(...arr), this.getPositionObject());
        });
    }
}