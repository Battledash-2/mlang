const blake2b = require('blake2b')
const Path = require('path')
const fs = require('fs')
function toHexString(byteArray) {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')
}
function abspath(path){
	return Path.normalize(Path.resolve(path))
}
const sleep = ms => {
    const end = Date.now() + ms
    while (Date.now() < end) continue
}

function generateid(path){
	path = abspath(path)
	var hash = blake2b(16)
	var output = new Uint8Array(16)
	hash.update(Buffer.from(path))
	var output = toHexString(hash.digest(output))
	return output
}
function EmptyFunc(...args){}
class Connection {
	constructor(me, filename){
		this.id = generateid(filename)
		this.myid = generateid(me)
		this.on_message_func = EmptyFunc
		this.connfile   = abspath(Path.join(__dirname, 'conn/'+ this.myid+'.'+this.id))
		this.myconnfile = abspath(Path.join(__dirname, 'conn/'+ this.id+'.'+this.myid))
		this.disconnected = false
		fs.writeFileSync(this.connfile, '')
		fs.writeFileSync(this.myconnfile, '')
	}
	send_message(msg){
		if (!this.disconnected){
			fs.writeFileSync(this.connfile, msg+'\n', { flag: 'a' })
		}
	}
	get_most_recent_message(){
		if (!this.disconnected){
			const content = fs.readFileSync(this.myconnfile, 'utf8').split('\n')
			return content[content.length-2]
		}
	}
	on_message(func){
		this.on_message_func = func
	}
	loop(){
		while (!this.disconnected){
			var msg = this.wait_for_message()
			if (this.disconnected){
				break
			}
			this.on_message_func(msg)
		}
	}
	disconnect(){
		if (!this.disconnected){
			fs.unlinkSync(this.connfile)
			this.disconnected = true
		}
	}
	wait_for_message(){
		try {
			var ctime = fs.statSync(this.myconnfile).ctimeMs
			while (true){
				var newctime = fs.statSync(this.myconnfile).ctimeMs
				if (newctime > ctime){
					let lines = fs.readFileSync(this.myconnfile, 'utf8').split('\n')
					if (lines[lines.length-1] === '' && lines.length > 1){
						return lines[lines.length-2]
					}
					ctime = newctime
				}
				sleep(500)
			}
		} catch {
			this.disconnect()
		}
	}
}
module.exports = {}
module.exports['connect'] = function connect(me, filename){
	c = new Connection(me, filename)
	return c
}
