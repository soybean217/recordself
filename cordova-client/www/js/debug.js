function ShowObjProperty(Obj) {
	var PropertyList = '';
	var PropertyCount = 0;
	for (i in Obj) {
		if (Obj.i != null)
			PropertyList = PropertyList + i + '属性：' + Obj.i + '\r\n';
		else
			PropertyList = PropertyList + i + '方法\r\n';
	}
	console.log(PropertyList);
}