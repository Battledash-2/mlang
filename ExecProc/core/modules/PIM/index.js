const path = require("path");
function abspath(p){
	return path.normalize(path.resolve(p))
}
const config = require(path.join(__dirname, 'config.json'))
const Interface = require(abspath(__dirname+config.mlang_path+'ExecProc/core/interface.js'));
const PIM = require(__dirname+'/js.js')
module.exports = class pim extends Interface {
    constructor(...args) {
		if (args.length===2){
			return PIM.connect(...args)
		}
        super(...args);

		this.connections = {}
		this.selected_connection = undefined
        this.createFunction("PIM::connect", (arg)=>{
			this.args_is_len(3, 'connect', arg)
			if (Object.keys(this.connections).length === 0){ // if no connections exist auto select the one that is being made
				this.selected_connection = arg[0].value
			}
			this.connections[arg[0].value] = PIM.connect(arg[1].value, arg[2].value)
        });
		
		this.createFunction('PIM::select', (arg)=>{ // this selects a connection by id
			this.args_is_len(1, 'select', arg)
			if (this.connections.hasOwnProperty(arg.value)) {
				this.selected_connection = arg.value
				console.log(this.selected_connection)
			} else {
				this.error(`Connection ${arg.value} doesnt exist`, 'select')
			}
		})

		this.createFunction('PIM::send_message', (arg)=>{ // most funcs will be like this one
            //console.log(arg)
			this.args_is_len(1, 'send_message', arg)
			this.connection().send_message(arg.value.toString())
		})

		this.createFunction('PIM::wait_for_message', (arg)=>{ // most funcs will be like this one
			this.args_is_len(0, 'wait_for_message', arg);
			const output = this.connection().wait_for_message();
			return this.createToken("STRING", output.toString() /* just in case*/, this.getPositionObject())
		})

		this.createFunction('PIM::get_most_recent_message', (arg)=>{
			this.args_is_len(0, 'get_most_recent_message', arg);
			const output = this.connection().get_most_recent_message();
			return this.createToken("STRING", output.toString() /* just in case*/, this.getPositionObject()) 
		})

		this.createFunction('PIM::disconnect', (arg)=>{
			this.args_is_len(0, 'disconnect', arg);
			this.connection().disconnect(); // this should never have a output
		})

		this.createFunction('PIM::on_message', (arg)=>{
			this.args_is_len(1, 'on_message', arg);
			if (this.isFunction(arg.name)){
				this.connection().on_message((msg)=>{
					return this.executeFunction(arg.name, this.createToken("STRING", msg, this.getPositionObject()))
				})
			} else {
				this.error(`Argument must be of type function`, 'on_message')
			}
		})

		this.createFunction('PIM::loop', (arg)=>{
			this.args_is_len(0, 'loop', arg);
			this.connection().loop(); // this should never have a output
		})
    }
	connection(){
		return this.connections[this.selected_connection]
	}
	error(msg, fname) {
		throw new Error(`${msg} in PIM::${fname} ${this.errorPosition()}`)
    }
	args_is_len(l, fname, arg){
		const arglen = this.argumentsLength(arg)
		if (l!==arglen){
    		this.error(`Expected ${l} arguments, got ${arglen}`, fname)
		}
    }
}
