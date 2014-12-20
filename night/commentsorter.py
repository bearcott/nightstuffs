#-------COMMENT REPLY SORTER! HELL YES!-------
#Spent about a week pondering, finished 7/22/13
#----expects a linear list of dicts each with id, parent, and level (depth)

#import time
#start = time.time()
def popcomments(a):
	from operator import itemgetter
	from itertools import groupby
	'''Testquery
	a = [
		dict(id='1',parent='0', level='0'),
			dict(id='2',parent='1', level='1'),
				dict(id='3',parent='2', level='2'),
				dict(id='6',parent='2', level='2'),
					dict(id='5',parent='6', level='3'),
		dict(id='4',parent='0', level='0'),
			dict(id='7',parent='4', level='1'),
		dict(id='8',parent='0', level='0'),
		dict(id='9',parent='0', level='0')
		]
	'''
	#1. create reference list: comments new list
	#----this will be used as a look up reference to sort comments
	#2. sorted by level > parent > id in reverse order
	#3. groupby in lists by levels but turn into groupby object
	new = groupby(sorted(a, key=itemgetter('level','parent','id'), reverse=True), key=itemgetter('level'))

	data = []

	#place grouped levels back into a list
	for k, u in new:
		data.append(list(u))
		
	#start the nesting
	#create transitional dict: a dict copy of original list
	#----this will be the final copy
	t = dict((dic['id'], dict(dic)) for index, dic in enumerate(a))

	#for each comment level, lowest first (e.g 4 > 3 > 2 > 1)
	for d in data:
		#for each dict in level
		for y in d:
			#if the parent dict exists
			if y['parent'] in t:
				#if parent['child'] doesn't exist make one
				#----NOTE: child will hold a dict but instead a list!
				if 'child' not in t.get(y['parent']): t[y['parent']]['child'] = []
				#append a copy of child to parent['child']
				#----using this method we can insert the child comment at the beginning of the list
				t[y['parent']]['child'].insert(0,t[y['id']])
				#delete child from table
				del t[y['id']]
			else:
				#else finished EYAY
				break
	#final processing
	#----turning t from dict to list
	j = []
	for v,y in t.iteritems():
		j.append(y)
	#----reversing top branch order
	return sorted(j, key=itemgetter('id'), reverse=True)
	#done!!
#end = time.time()-start
#print ""
#print "this script took %ss" % end
