//jsPoint class holds the 2D drawing point information. It holds values of x and y coordinates of the point.
function jsPoint(x,y)
{
	this.x=0;
	this.y=0;

	if(arguments.length==2)
	{
		this.x=x;
		this.y=y;
	}
}


//Draw cubic bezier curve with specified 4 points (start, gradient1, gradient2, end)
function getBezierPoints(startX, startY, cp1x, cp1y, cp2x, cp2y, endX, endY)
{

	//Check arguments for null values
	if(arguments.length < 8) return false;
	
	var phPoints=new Array();
	var i;

	var points = [new jsPoint(startX, startY), new jsPoint(cp1x, cp1y), new jsPoint(cp2x, cp2y), new jsPoint(endX, endY)];

	phPoints = points;


	var xMin=phPoints[0].x;
	var xMax=phPoints[0].x;
	
	for(i=1;i<phPoints.length;i++)
	{
		if(xMin>phPoints[i-1].x)
		{
			xMin=phPoints[i-1].x;
		}
		if(xMax<phPoints[i-1].x)
		{
			xMax=phPoints[i-1].x;
		}
	}
	
	var p1x,p2x,p3x,p4x,p1y,p2y,p3y,p4y;
	p1x=phPoints[0].x;
	p1y=phPoints[0].y;

	p2x=phPoints[1].x;
	p2y=phPoints[1].y;

	p3x=phPoints[2].x;
	p3y=phPoints[2].y;

	p4x=phPoints[3].x;
	p4y=phPoints[3].y;

	var x,y,xB,t;
	
	var xl=p1x-1;
	var yl=p1y-1;
	var xp,yp;
	t=0;
	var f=1;
	xp=p1x;
	yp=p1y;
	var yStart=false;
	var xStart=false;
	var k=1.1;
	//Array to hold all points on the bezier curve
	var curvePoints=new Array();
	
	var y1,y2,x1,x2;
	y1=yp;
	y2=yp;
	x1=xp;
	x2=xp;
	while(t<=1)
	{
		x=0;
		y=0;
		x=(1-t)*(1-t)*(1-t)*p1x + 3*(1-t)*(1-t)*t*p2x + 3*(1-t)*t*t*p3x + t*t*t*p4x;
		y=(1-t)*(1-t)*(1-t)*p1y + 3*(1-t)*(1-t)*t*p2y + 3*(1-t)*t*t*p3y + t*t*t*p4y;
		x=Math.round(x);
		y=Math.round(y);

		if(x!=xl || y!=yl)
		{
			if(x-xl>1 || y-yl>1 || xl-x>1 || yl-y>1)
			{
				t-=f;
				f=f/k;
			}
			else
			{
			    curvePoints[curvePoints.length]=new jsPoint(x,y);  
				xl=x;
				yl=y;
			}
		}
		else
		{
			t-=f;
			f=f*k;
		}
		t+=f;

	}

	
	return curvePoints;
}