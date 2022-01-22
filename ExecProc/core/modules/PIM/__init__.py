import hashlib
import os
import inspect
import time
import json

config = json.load(open("config.json"))

def generateid(path):
	path = os.path.abspath(path)
	h = hashlib.blake2b(digest_size=16)
	h.update(bytes(path, 'UTF8'))
	return h.hexdigest()

class DummyClass: pass
__dir__ = os.path.dirname(os.path.abspath(inspect.getsourcefile(DummyClass)))
def EmptyFunc(*args, **kwargs): pass
class Connection:
	def __init__(self, me, filename):
		self.id = generateid(filename)
		self.myid = generateid(me)
		self.on_message_func = EmptyFunc
		self.connfile = os.path.abspath(os.path.join(__dir__, 'conn/'+self.myid+'.'+self.id))
		self.myconnfile = os.path.abspath(os.path.join(__dir__, 'conn/'+self.id+'.'+self.myid))
		self.disconnected = False
		with open(self.myconnfile, 'w') as f:
			f.write('')
		with open(self.connfile, 'w') as f:
			f.write('')
	def send_message(self, msg):
		if not self.disconnected:
			with open(self.connfile, 'a') as f:
				f.write(msg+'\n')
	def get_most_recent_message(self):
		if not self.disconnected:
			with open(self.myconnfile, 'r') as f:
				return f.read().split('\n')[-2]
	def on_message(self, func):
		self.on_message_func = func
		return func
	def loop(self):
		while not self.disconnected:
			msg = self.wait_for_message()
			if (self.disconnected):
				break
			self.on_message_func(msg)
	def disconnect(self):
		if not self.disconnected:
			os.remove(self.connfile)
			self.disconnected = True
	def __del__(self):
		self.disconnect()
	def wait_for_message(self):
		try:
			ctime = os.stat(self.myconnfile).st_ctime
			while True:
				nctime = os.stat(self.myconnfile).st_ctime
				if nctime > ctime:
					with open(self.myconnfile) as f:
						lines = f.read().split('\n')
						if lines[-1]=='' and len(lines)>1:
							return lines[-2]
					ctime = nctime
				time.sleep(0.1)
		except FileNotFoundError:
			self.disconnect()
		
def connect(me, filename):
	c = Connection(me, filename)
	return c
