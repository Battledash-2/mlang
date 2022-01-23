const http = require("http");
const Interface = require("../../interface");

const fs = require("fs");
const path = require("path");

const bp = (f)=>path.join(__dirname, "boilerplate", f);
const rf = (bp)=>fs.readFileSync(bp);

const bprf = (f)=>rf(bp(f));

const builtIn = {
	"404": bprf("404.html"), // only at the start of the script because it's sync
	"start": bprf("land.html"),
}

module.exports = class extends Interface {
	constructor(...args) {
		super(...args);

		this.defaultName = "%default%";
		
		this.paths = {
			[this.defaultName]: {
				path: /^\/(index\.?(html|htm|aspx|asp))?$/,
				callback: {
					status: 200,
					type: "INTERNAL",
					body: builtIn["start"]
				},
				headers: {
					"Content-Type": "text/html"
				}
			}
		};

		this.createFunction("http::start", (arg)=>{
			const port = this.getArgumentAt(arg, 0);
			if (port == null) this.throwError("Missing argument 1", "new", "http");
			
			http.createServer((req, res)=>{
				const url = req.url;
				
				for (let path in this.paths) {
					path = this.paths[path];
					
					if (path.path.exec(url) != null) {
						const close = ()=>{
							this.deleteBuiltInFunction("http::response::setheader");
							this.deleteBuiltInFunction("http::response::getheader");
							this.deleteBuiltInFunction("http::response::writeclose");
							this.deleteBuiltInFunction("http::response::write");
							this.deleteBuiltInFunction("http::response::write");
							res.end();
						}

						this.createFunction("http::response::getheader", (arg)=>{
							const name = this.getArgumentAt(arg, 0);
							const header = res.getHeader(this.concatValues(arg, "-"));

							if (typeof header !== "object") {
								return this.getTokenFrom(header);
							}
						});
						
						this.createFunction("http::response::setheader", (arg)=>{
							const name = this.getArgumentAt(arg, 0);
							const value = this.getArgumentAt(arg, 1);
							res.setHeader(name, value);
						});
						
						this.createFunction("http::response::writeclose", (arg)=>{
							res.write(this.concatValues(arg));
							close();
						});
						
						this.createFunction("http::response::write", (arg)=>{
							res.write(this.concatValues(arg));
						});

						if (path.callback?.type == "INTERNAL") {
							res.writeHead(path.callback?.status, path.headers);
							res.write(path.callback?.body)

							res.end();
							
							return;
							break;
						}
						
						this.executeFunction(path.callback, this.getTokenFrom(req.url));
						
						return;
						break;
					}
				}

				res.writeHead(404, {"Content-Type":"text/html"});
				res.write(builtIn["404"]);
				
				res.end()
			}).listen(port);
		});

		this.createFunction("http::route", (arg)=>{
			this.expectArguments(2, arg, "route", "http", true);

			if (this.paths.hasOwnProperty(this.defaultName)) delete this.paths[this.defaultName];
			
			const path = this.getArgumentObjectAt(arg, 0);
			const callback = this.getArgumentObjectAt(arg, 1);
			
			const contentType = this.getArgumentObjectAt(arg, 2)?.value || 'text/plain';

			this.typeAssertError("STRING", path, "route", "http");
			
			if (!this.typeAssert("IDENTIFIER", callback) || !this.isUserFunction(callback?.name)) this.throwError("Invaild argument 1, expected pointer to FUNCTION", 'http', 'route');
			
			const pathRegex = RegExp(path.value)
			const name = this.getArgumentObjectAt(args, 3) ?? callback.name;
			
			this.paths[name] = {
				path: pathRegex,
				callback: name,
				headers: {
					"Content-Type": contentType
				}
			}		  
		});
	}
}